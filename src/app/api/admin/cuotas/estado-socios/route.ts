import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { getAdminCuotasEstadoServer } from '@/services/server/cuotaEstadoServerService';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { user } = await authMiddleware(req);
    const data = await getAdminCuotasEstadoServer(user);

    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    console.error('ERROR al obtener estado de cuotas admin:', error.message || error);
    const message = error.message || 'Error al obtener estado de cuotas';
    const status =
      message.includes('Token') || message.includes('No autorizado') ? 403 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
