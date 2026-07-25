import { NextResponse } from 'next/server';
import { getInfraestructuraQrLabelsDashboard } from '@/services/server/infraestructuraMantenimientoService';

import {
  authorizationErrorResponse,
  authorizeDashboardRequest,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await authorizeDashboardRequest(req, '/dashboard/infraestructura/etiquetas-qr', ['admin', 'usuario']);
    const dashboard = await getInfraestructuraQrLabelsDashboard();
    return NextResponse.json(dashboard, { status: 200 });
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    console.error('Error al consultar etiquetas QR:', error?.message ?? error);
    return NextResponse.json(
      { error: error?.message || 'Error al consultar etiquetas QR.' },
      { status: 500 },
    );
  }
}
