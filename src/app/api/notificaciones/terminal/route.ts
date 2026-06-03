import { authMiddleware } from '@/middlewares/auth.middleware';
import { getNotificacionesTerminalActivas } from '@/services/notificacionService';
import { NextResponse } from 'next/server';

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

    const notificaciones = await getNotificacionesTerminalActivas(user);
    return NextResponse.json(notificaciones);
  } catch (error) {
    if (isAuthSessionError(error)) {
      return NextResponse.json(
        {
          error: 'La sesión de Terminal expiró. Iniciá sesión nuevamente o renová la sesión.',
          error_code: 'TERMINAL_SESSION_EXPIRED',
        },
        { status: 401 }
      );
    }

    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
