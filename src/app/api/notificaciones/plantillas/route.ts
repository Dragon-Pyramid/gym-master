import { authMiddleware } from '@/middlewares/auth.middleware';
import { getNotificacionPlantillas } from '@/services/notificacionService';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { user } = await authMiddleware(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const plantillas = await getNotificacionPlantillas(user);
    return NextResponse.json(plantillas);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
