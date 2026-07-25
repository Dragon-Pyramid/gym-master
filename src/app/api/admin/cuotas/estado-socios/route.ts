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

    console.error('ERROR al obtener estado de cuotas admin:', error.message || error);
    const message = error.message || 'Error al obtener estado de cuotas';
    const status =
      message.includes('Token') || message.includes('No autorizado') ? 403 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
