import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { getHeaderNotificationsServer } from '@/services/server/headerNotificationsServerService';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { user } = await authMiddleware(req);
    if (!user) {
      return NextResponse.json({ error: 'No se pudo obtener el usuario' }, { status: 401 });
    }

    const data = await getHeaderNotificationsServer(user);
    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    console.error('Error al obtener notificaciones del header:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener notificaciones del header' },
      { status: 500 }
    );
  }
}
