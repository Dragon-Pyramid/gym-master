import { NextResponse } from 'next/server';
import { createNotificacion, getNotificaciones } from '@/services/notificacionService';
import { NotificacionFechaInvalidaError } from '@/services/notificacionService';
import { authorizationErrorResponse, authorizeDashboardRequest } from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const user = await authorizeDashboardRequest(req, '/dashboard/notificaciones', ['admin', 'usuario']);
    return NextResponse.json(await getNotificaciones(user));
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Error al obtener notificaciones:", error);
    return NextResponse.json(
      { error: "Error al obtener notificaciones" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await authorizeDashboardRequest(req, '/dashboard/notificaciones', ['admin', 'usuario']);
    const notificacion = await createNotificacion(await req.json(), user);
    return NextResponse.json(notificacion, { status: 201 });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    if (error instanceof NotificacionFechaInvalidaError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : '';
    if (["Título requerido", "Asunto requerido", "Mensaje requerido"].includes(message)) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    console.error("Error al crear la notificación:", error);
    return NextResponse.json(
      { error: "Error al crear la notificación" },
      { status: 500 }
    );
  }
}
