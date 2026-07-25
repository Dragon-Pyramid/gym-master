import { NextResponse } from 'next/server';
import { getEquipamientosPreventivosDashboard } from '@/services/server/equipamientoPreventivoService';

import {
  authorizationErrorResponse,
  authorizeDashboardRequest,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await authorizeDashboardRequest(req, '/dashboard/infraestructura/equipamientos/preventivos', ['admin', 'usuario']);
    const dashboard = await getEquipamientosPreventivosDashboard();
    return NextResponse.json(dashboard, { status: 200 });
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json(
      { error: error?.message || 'Error al consultar preventivos de equipamientos.' },
      { status: 500 },
    );
  }
}
