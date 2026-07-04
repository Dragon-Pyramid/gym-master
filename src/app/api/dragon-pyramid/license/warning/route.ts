import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { getDragonPyramidLicense } from '@/services/server/dragonPyramidLicenseService';
import { buildDragonPyramidGraceWarning } from '@/utils/dragonPyramidLicenseWarning';

export const dynamic = 'force-dynamic';

function assertCanReadLicenseWarning(role?: string | null) {
  if (role !== 'admin' && role !== 'masteradmin') {
    throw new Error('No tenés permisos para consultar avisos de licencia Dragon Pyramid');
  }
}

function resolveStatus(message: string) {
  if (message.includes('Token')) return 401;
  if (message.includes('permisos')) return 403;
  return 500;
}

export async function GET(req: Request) {
  try {
    const { user } = await authMiddleware(req);
    assertCanReadLicenseWarning(user?.rol);

    const license = await getDragonPyramidLicense();
    const warning = buildDragonPyramidGraceWarning(license);

    return NextResponse.json(
      {
        data: warning,
        summary: license
          ? {
              client_name: license.client_name,
              license_status: license.license_status,
              payment_status: license.payment_status,
              next_due_at: license.next_due_at,
              grace_until: license.grace_until,
              expires_at: license.expires_at,
            }
          : null,
      },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ error: message }, { status: resolveStatus(message) });
  }
}
