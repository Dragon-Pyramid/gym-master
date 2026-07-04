import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { getDragonPyramidLicense } from '@/services/server/dragonPyramidLicenseService';
import { buildDragonPyramidSuspensionStatus } from '@/utils/dragonPyramidSuspension';

export const dynamic = 'force-dynamic';

function resolveStatus(message: string) {
  if (message.includes('Token')) return 401;
  return 500;
}

export async function GET(req: Request) {
  try {
    const { user } = await authMiddleware(req);
    const license = await getDragonPyramidLicense();
    const status = buildDragonPyramidSuspensionStatus(license);

    const safeStatus = user.rol === 'socio'
      ? {
          ...status,
          title: status.isSuspended ? 'Servicio temporalmente no disponible' : status.title,
          message: status.isSuspended
            ? 'El servicio del gimnasio se encuentra temporalmente no disponible. Comunicate con la administración del gimnasio para más información.'
            : status.message,
          details: status.isSuspended ? [] : status.details,
          clientName: null,
        }
      : status;

    return NextResponse.json(
      { data: safeStatus },
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
