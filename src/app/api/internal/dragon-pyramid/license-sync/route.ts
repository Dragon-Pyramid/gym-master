import { timingSafeEqual } from 'node:crypto';

import {
  noStoreJson,
  readJsonBody,
  runtimeErrorResponse,
} from '@/lib/security/httpRuntimeSecurity';
import {
  reactivateDragonPyramidLicenseAfterPayment,
  upsertDragonPyramidLicense,
} from '@/services/server/dragonPyramidLicenseService';

export const dynamic = 'force-dynamic';

// AUTH POLICY: INTERNAL_SHARED_SECRET
// This endpoint is used only by Dragon Pyramid's billing platform and requires
// a dedicated server-to-server secret. It never accepts a browser JWT.

const LICENSE_SYNC_BODY_MAX_BYTES = 128 * 1024;

function getSyncSecret() {
  return process.env.DRAGON_PYRAMID_LICENSE_SYNC_SECRET?.trim() || '';
}

function secretsMatch(provided: string, expected: string) {
  const providedBuffer = Buffer.from(provided, 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');

  return (
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  );
}

export async function POST(req: Request) {
  const expectedSecret = getSyncSecret();
  if (!expectedSecret) {
    console.error('DRAGON_PYRAMID_LICENSE_SYNC_SECRET no está configurado.');
    return noStoreJson(
      { error: 'Endpoint de sincronización no disponible' },
      503,
    );
  }

  const providedSecret = req.headers.get('x-dragon-pyramid-sync-key')?.trim() || '';
  if (!providedSecret || !secretsMatch(providedSecret, expectedSecret)) {
    return noStoreJson(
      { error: 'Sincronización no autorizada' },
      401,
    );
  }

  try {
    const body = await readJsonBody<Record<string, any>>(
      req,
      LICENSE_SYNC_BODY_MAX_BYTES,
    );
    const wantsReactivation = Boolean(body.reactivate) ||
      ((body.status ?? body.license_status) === 'active' &&
        (body.paymentStatus ?? body.payment_status) === 'paid');

    const commonPayload = {
      client_code: body.clientCode ?? body.client_code,
      client_name: body.clientName ?? body.client_name,
      license_status: body.status ?? body.license_status,
      payment_status: body.paymentStatus ?? body.payment_status,
      last_payment_at: body.lastPaymentAt ?? body.last_payment_at,
      next_due_at: body.nextDueAt ?? body.next_due_at,
      expected_amount: body.expectedAmount ?? body.expected_amount,
      currency: body.currency,
      billing_plan: body.billingPlan ?? body.billing_plan,
      payment_notes: body.paymentNotes ?? body.payment_notes,
      activated_at: body.activatedAt ?? body.activated_at,
      expires_at: body.expiresAt ?? body.expires_at,
      grace_until: body.graceUntil ?? body.grace_until,
      suspended_at: body.suspendedAt ?? body.suspended_at,
      reactivated_at: body.reactivatedAt ?? body.reactivated_at,
      suspension_reason: body.reason ?? body.suspension_reason,
      sync_source: 'dragon_pyramid_platform',
      reason: body.reason ?? body.suspension_reason,
      metadata: {
        ...(body.metadata && typeof body.metadata === 'object' ? body.metadata : {}),
        synced_from: 'dragon_pyramid_platform',
        received_at: new Date().toISOString(),
      },
    };

    const data = wantsReactivation
      ? await reactivateDragonPyramidLicenseAfterPayment({
          ...commonPayload,
          sync_source: 'dragon_pyramid_platform_reactivation',
        })
      : await upsertDragonPyramidLicense({
          ...commonPayload,
          license_status: body.status ?? body.license_status,
          suspended_at: body.suspendedAt ?? body.suspended_at,
          reactivated_at: body.reactivatedAt ?? body.reactivated_at,
          suspension_reason: body.reason ?? body.suspension_reason,
          sync_source: 'dragon_pyramid_platform',
        });

    return noStoreJson({ data }, 200);
  } catch (error) {
    const runtimeResponse = runtimeErrorResponse(
      error,
      'No se pudo sincronizar la licencia',
    );

    if (runtimeResponse.status !== 500) return runtimeResponse;

    console.error('Error en sincronización interna de licencia:', {
      name: error instanceof Error ? error.name : 'UnknownError',
    });
    return runtimeResponse;
  }
}
