import { NextResponse } from 'next/server';
import {
  cancelarNotificacion,
  getNotificacionById,
  updateNotificacion,
  NotificacionNoEncontradaError,
} from '@/services/notificacionService';
import { NotificacionFechaInvalidaError } from '@/services/notificacionService';
import { authorizationErrorResponse, authorizeDashboardRequest } from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await authorizeDashboardRequest(req, '/dashboard/notificaciones', ['admin', 'usuario']);
    return NextResponse.json(await getNotificacionById(params.id, user));
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    if (error instanceof NotificacionNoEncontradaError) {
      return NextResponse.json(
        { error: 'Notificación no encontrada' },
        { status: 404 }
      );
    }
    console.error("Error al obtener la notificación:", error);
    return NextResponse.json(
      { error: "Error al obtener la notificación" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await authorizeDashboardRequest(req, '/dashboard/notificaciones', ['admin', 'usuario']);
    return NextResponse.json(await updateNotificacion(params.id, await req.json(), user));
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    if (error instanceof NotificacionFechaInvalidaError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof NotificacionNoEncontradaError) {
      return NextResponse.json(
        { error: 'Notificación no encontrada' },
        { status: 404 }
      );
    }
    console.error("Error al actualizar la notificación:", error);
    return NextResponse.json(
      { error: "Error al actualizar la notificación" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await authorizeDashboardRequest(req, '/dashboard/notificaciones', ['admin', 'usuario']);
    return NextResponse.json(await cancelarNotificacion(params.id, user));
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    if (error instanceof NotificacionNoEncontradaError) {
      return NextResponse.json(
        { error: 'Notificación no encontrada' },
        { status: 404 }
      );
    }
    console.error("Error al cancelar la notificación:", error);
    return NextResponse.json(
      { error: "Error al cancelar la notificación" },
      { status: 500 }
    );
  }
}
