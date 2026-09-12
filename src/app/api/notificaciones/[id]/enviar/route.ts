import { NextResponse } from 'next/server';
import {
  enviarNotificacion,
  NotificacionNoEncontradaError,
} from '@/services/notificacionService';
import { authorizationErrorResponse, authorizeDashboardRequest } from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await authorizeDashboardRequest(req, '/dashboard/notificaciones', ['admin', 'usuario']);
    return NextResponse.json(await enviarNotificacion(params.id, user));
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    if (error instanceof NotificacionNoEncontradaError) {
      return NextResponse.json(
        { error: 'Notificación no encontrada' },
        { status: 404 }
      );
    }
    const message = error instanceof Error ? error.message : '';
    if (["No se puede enviar una notificación cancelada"].includes(message)) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    console.error("Error al preparar el envío de la notificación:", error);
    return NextResponse.json(
      { error: "Error al preparar el envío de la notificación" },
      { status: 500 }
    );
  }
}
