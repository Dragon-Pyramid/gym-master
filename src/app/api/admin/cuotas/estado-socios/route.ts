import { NextResponse } from 'next/server';
import { getAdminCuotasEstadoServer } from '@/services/server/cuotaEstadoServerService';
import {
  authorizationErrorResponse,
  authorizeDashboardRequest,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const user = await authorizeDashboardRequest(
      req,
      '/dashboard/bi-cuotas-pagos',
      ['admin', 'usuario'],
    );
    const data = await getAdminCuotasEstadoServer(user);

    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;

    if (
      error instanceof Error &&
      error.message === 'No autorizado para consultar estados de cuota administrativos'
    ) {
      return NextResponse.json(
        { error: 'No autorizado para consultar estados de cuota administrativos' },
        { status: 403 }
      );
    }

    console.error('ERROR al obtener estado de cuotas admin:', error);
    return NextResponse.json(
      { error: 'Error al obtener estado de cuotas' },
      { status: 500 }
    );
  }
}
