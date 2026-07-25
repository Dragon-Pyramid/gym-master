import { NextResponse } from 'next/server';
import {
  authorizationErrorResponse,
  authorizeDashboardRequest,
} from '@/lib/auth/serverAuthorization';
import {
  getDragonPyramidLicense,
  upsertDragonPyramidLicense,
} from '@/services/server/dragonPyramidLicenseService';

export const dynamic = 'force-dynamic';

function resolveStatus(message: string) {
  if (message.includes('permisos')) return 403;
  if (message.includes('válid')) return 400;
  return 500;
}

export async function GET(req: Request) {
  try {
    await authorizeDashboardRequest(
      req,
      '/dashboard/masteradmin/license',
      ['masteradmin'],
    );

    const data = await getDragonPyramidLicense();
    return NextResponse.json(
      { data },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      },
    );
  } catch (error) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;

    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ error: message }, { status: resolveStatus(message) });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await authorizeDashboardRequest(
      req,
      '/dashboard/masteradmin/license',
      ['masteradmin'],
    );

    const body = await req.json();
    const data = await upsertDragonPyramidLicense({
      ...body,
      sync_source: body?.sync_source ?? 'manual_masteradmin',
      metadata: {
        ...(body?.metadata && typeof body.metadata === 'object' ? body.metadata : {}),
        updated_by: user.email ?? user.id,
        updated_from: 'gym-master-masteradmin-panel',
      },
    });

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;

    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ error: message }, { status: resolveStatus(message) });
  }
}
