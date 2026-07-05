import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import {
  assertMasterAdmin,
  reactivateDragonPyramidLicenseAfterPayment,
} from '@/services/server/dragonPyramidLicenseService';

export const dynamic = 'force-dynamic';

function resolveStatus(message: string) {
  if (message.includes('permisos')) return 403;
  if (message.includes('válid')) return 400;
  return 500;
}

export async function POST(req: Request) {
  try {
    const { user } = await authMiddleware(req);
    assertMasterAdmin(user);

    const body = await req.json().catch(() => ({}));
    const data = await reactivateDragonPyramidLicenseAfterPayment({
      client_code: body?.client_code,
      client_name: body?.client_name,
      last_payment_at: body?.last_payment_at,
      next_due_at: body?.next_due_at,
      expected_amount: body?.expected_amount,
      currency: body?.currency,
      billing_plan: body?.billing_plan,
      payment_notes: body?.payment_notes,
      expires_at: body?.expires_at,
      grace_until: body?.grace_until,
      reason: body?.reason,
      sync_source: 'manual_masteradmin_reactivation',
      metadata: {
        ...(body?.metadata && typeof body.metadata === 'object' ? body.metadata : {}),
        updated_by: user.email ?? user.id,
        updated_from: 'gym-master-masteradmin-reactivation',
      },
    });

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ error: message }, { status: resolveStatus(message) });
  }
}
