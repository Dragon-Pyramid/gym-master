import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { getAdminCuotasEstadoServer } from '@/services/server/cuotaEstadoServerService';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { user } = await authMiddleware(req);
    const data = await getAdminCuotasEstadoServer(user);

    return NextResponse.json(
      {
        data: {
          resumen: data.resumen,
          pagos_por_metodo: data.pagos_por_metodo,
          vencidos: data.vencidos,
          sin_pagos: data.sin_pagos,
          proximos_vencer: data.proximos_vencer,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('ERROR al obtener resumen de cuotas admin:', error.message || error);
    const message = error.message || 'Error al obtener resumen de cuotas';
    const status =
      message.includes('Token') || message.includes('No autorizado') ? 403 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
