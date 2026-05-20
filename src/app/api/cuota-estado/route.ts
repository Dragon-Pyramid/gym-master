import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import {
  getAdminCuotasEstadoServer,
  getEstadoCuotaSocioServer,
} from '@/services/server/cuotaEstadoServerService';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { user } = await authMiddleware(req);
    const url = new URL(req.url);
    const socioIdFromQuery = url.searchParams.get('socio_id');

    if (user.rol === 'socio') {
      if (!user.id_socio) {
        return NextResponse.json(
          { error: 'El usuario socio no tiene id_socio asociado' },
          { status: 400 }
        );
      }

      const estado = await getEstadoCuotaSocioServer(user, user.id_socio);
      return NextResponse.json({ data: estado }, { status: 200 });
    }

    if (socioIdFromQuery) {
      const estado = await getEstadoCuotaSocioServer(user, socioIdFromQuery);
      return NextResponse.json({ data: estado }, { status: 200 });
    }

    const estadoGeneral = await getAdminCuotasEstadoServer(user);
    return NextResponse.json({ data: estadoGeneral }, { status: 200 });
  } catch (error: any) {
    console.error('ERROR al obtener estado de cuota:', error.message || error);
    const message = error.message || 'Error al obtener estado de cuota';
    const status =
      message.includes('Token') || message.includes('No autorizado') ? 403 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
