import { NextResponse } from 'next/server';
import {
  reactivateDragonPyramidLicenseAfterPayment,
  upsertDragonPyramidLicense,
} from '@/services/server/dragonPyramidLicenseService';

export const dynamic = 'force-dynamic';

function getSyncSecret() {
  return process.env.DRAGON_PYRAMID_LICENSE_SYNC_SECRET?.trim() || '';
}

function resolveStatus(message: string) {
  if (message.includes('no configurado')) return 503;
  if (message.includes('no autorizada')) return 401;
  if (message.includes('válid')) return 400;
  return 500;
}

export async function POST(req: Request) {
  try {
    const expectedSecret = getSyncSecret();
    if (!expectedSecret) {
      throw new Error('Endpoint de sincronización no configurado');
    }

    const providedSecret = req.headers.get('x-dragon-pyramid-sync-key')?.trim() || '';
    if (!providedSecret || providedSecret !== expectedSecret) {
      throw new Error('Sincronización no autorizada');
    }

    const body = await req.json();
    const wantsReactivation = Boolean(body?.reactivate) ||
      ((body?.status ?? body?.license_status) === 'active' &&
        (body?.paymentStatus ?? body?.payment_status) === 'paid');

    const commonPayload = {
      client_code: body?.clientCode ?? body?.client_code,
      client_name: body?.clientName ?? body?.client_name,
      license_status: body?.status ?? body?.license_status,
      payment_status: body?.paymentStatus ?? body?.payment_status,
      last_payment_at: body?.lastPaymentAt ?? body?.last_payment_at,
      next_due_at: body?.nextDueAt ?? body?.next_due_at,
      expected_amount: body?.expectedAmount ?? body?.expected_amount,
      currency: body?.currency,
      billing_plan: body?.billingPlan ?? body?.billing_plan,
      payment_notes: body?.paymentNotes ?? body?.payment_notes,
      activated_at: body?.activatedAt ?? body?.activated_at,
      expires_at: body?.expiresAt ?? body?.expires_at,
      grace_until: body?.graceUntil ?? body?.grace_until,
      suspended_at: body?.suspendedAt ?? body?.suspended_at,
      reactivated_at: body?.reactivatedAt ?? body?.reactivated_at,
      suspension_reason: body?.reason ?? body?.suspension_reason,
      sync_source: 'dragon_pyramid_platform',
      reason: body?.reason ?? body?.suspension_reason,
      metadata: {
        ...(body?.metadata && typeof body.metadata === 'object' ? body.metadata : {}),
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
          license_status: body?.status ?? body?.license_status,
          suspended_at: body?.suspendedAt ?? body?.suspended_at,
          reactivated_at: body?.reactivatedAt ?? body?.reactivated_at,
          suspension_reason: body?.reason ?? body?.suspension_reason,
          sync_source: 'dragon_pyramid_platform',
        });

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ error: message }, { status: resolveStatus(message) });
  }
}
