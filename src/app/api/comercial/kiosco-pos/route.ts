import { comercialErrorResponse, readComercialJson } from '@/lib/comercial/comercialErrorBoundary';
import { NextRequest, NextResponse } from 'next/server';
import {
  createComercialKioscoPosVenta,
  getComercialKioscoPosDashboard,
} from '@/services/server/comercialKioscoPosServerService';

import { authorizationErrorResponse, authorizeDashboardRequest } from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await authorizeDashboardRequest(req, '/dashboard/comercial/kiosco', ['admin', 'usuario']);
    const dashboard = await getComercialKioscoPosDashboard();
    return NextResponse.json({ data: dashboard }, { status: 200 });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return comercialErrorResponse(error, "Error al obtener POS/Kiosco");
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authorizeDashboardRequest(req, '/dashboard/comercial/kiosco', ['admin', 'usuario']);
    const body = await readComercialJson(req);
    const venta = await createComercialKioscoPosVenta(body, user ?? null);
    return NextResponse.json({ data: venta, message: 'Venta POS/Kiosco registrada' }, { status: 201 });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return comercialErrorResponse(error, "Error al registrar venta POS/Kiosco");
  }
}
