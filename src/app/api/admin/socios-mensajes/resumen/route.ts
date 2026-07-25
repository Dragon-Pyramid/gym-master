import { NextResponse } from 'next/server';
import { getMensajesAdmin } from '@/services/socioMensajeService';
import {
  authorizationErrorResponse,
  authorizeDashboardRequest,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

type EstadoMensaje = string | null | undefined;
const normalizeEstado = (estado: EstadoMensaje) => String(estado ?? '').trim().toLowerCase();
const isPendiente = (estado: EstadoMensaje) => normalizeEstado(estado) === 'pendiente';
const isSinResponder = (estado: EstadoMensaje) => ['pendiente', 'leido', 'leído'].includes(normalizeEstado(estado));

export async function GET(req: Request) {
  try {
    const user = await authorizeDashboardRequest(req, '/dashboard/mensajes-admin', ['admin', 'usuario']);
    const mensajes = await getMensajesAdmin(user, {});
    return NextResponse.json({
      data: {
        total: mensajes.length,
        nuevos: mensajes.filter((mensaje) => isPendiente(mensaje.estado)).length,
        sin_responder: mensajes.filter((mensaje) => isSinResponder(mensaje.estado)).length,
      },
    });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    const status = message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
