import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { createQRDiario } from '@/services/asistenciaService';

export const dynamic = 'force-dynamic';

function isAuthSessionError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  return (
    message.includes('token') ||
    message.includes('jwt') ||
    message.includes('authorization') ||
    message.includes('unauthorized')
  );
}

export async function GET(req: Request) {
  try {
    const { user } = await authMiddleware(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', error_code: 'TERMINAL_SESSION_UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { qrCode, url, token } = await createQRDiario();
    return NextResponse.json({ qrCode, url, token });
  } catch (err) {
    console.error('Error al generar el QR:', err);

    if (isAuthSessionError(err)) {
      return NextResponse.json(
        {
          error: 'La sesión de Terminal expiró. Iniciá sesión nuevamente o renová la sesión.',
          error_code: 'TERMINAL_SESSION_EXPIRED',
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Error al generar el QR' },
      { status: 500 }
    );
  }
}
