import { NextResponse } from 'next/server';
import { getInfraestructuraMantenimientoDashboard } from '@/services/server/infraestructuraMantenimientoService';

import {
  authorizationErrorResponse,
  authorizeDashboardRequest,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await authorizeDashboardRequest(req, '/dashboard/infraestructura/mantenimiento-edilicio', ['admin', 'usuario']);
    const dashboard = await getInfraestructuraMantenimientoDashboard();
    return NextResponse.json(dashboard, { status: 200 });
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    console.error('Error al consultar mantenimiento edilicio:', error?.message ?? error);
    return NextResponse.json(
      { error: 'Error al consultar mantenimiento edilicio.' },
      { status: 500 },
    );
  }
}
