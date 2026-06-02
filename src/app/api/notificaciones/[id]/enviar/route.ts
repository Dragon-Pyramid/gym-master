import { authMiddleware } from '@/middlewares/auth.middleware';
import { enviarNotificacion } from '@/services/notificacionService';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { user } = await authMiddleware(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const notificacion = await enviarNotificacion(params.id, user);
    return NextResponse.json(notificacion);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
