import { authMiddleware } from '@/middlewares/auth.middleware';
import { getMensajesAdmin } from '@/services/socioMensajeService';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type EstadoMensaje = string | null | undefined;

function normalizeEstado(estado: EstadoMensaje) {
  return String(estado ?? '').trim().toLowerCase();
}

function isPendiente(estado: EstadoMensaje) {
  return normalizeEstado(estado) === 'pendiente';
}

function isSinResponder(estado: EstadoMensaje) {
  const normalized = normalizeEstado(estado);
  return normalized === 'pendiente' || normalized === 'leido' || normalized === 'leído';
}

export async function GET(req: Request) {
  try {
    const { user } = await authMiddleware(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (user.rol !== 'admin' && user.rol !== 'usuario') {
      return NextResponse.json({ error: 'No autorizado para ver mensajes de socios' }, { status: 403 });
    }

    const mensajes = await getMensajesAdmin(user, {});
    const nuevos = mensajes.filter((mensaje) => isPendiente(mensaje.estado)).length;
    const sinResponder = mensajes.filter((mensaje) => isSinResponder(mensaje.estado)).length;

    return NextResponse.json({
      data: {
        total: mensajes.length,
        nuevos,
        sin_responder: sinResponder,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    const status = message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
