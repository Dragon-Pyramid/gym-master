import { authMiddleware } from '@/middlewares/auth.middleware';
import { getMensajesAdmin } from '@/services/socioMensajeService';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { user } = await authMiddleware(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const mensajes = await getMensajesAdmin(user, {
      estado: url.searchParams.get('estado'),
      q: url.searchParams.get('q'),
    });

    return NextResponse.json({ data: mensajes });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    const status = message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
