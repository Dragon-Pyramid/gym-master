import { comercialErrorResponse, readComercialJson } from '@/lib/comercial/comercialErrorBoundary';
import { NextRequest, NextResponse } from 'next/server';
import {
  createComercialStockMovimiento,
  getComercialStockLedgerDashboard,
} from '@/services/server/comercialStockLedgerServerService';

import { authorizationErrorResponse, authorizeDashboardRequest } from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await authorizeDashboardRequest(req, '/dashboard/comercial/stock-ledger', ['admin', 'usuario']);
    const dashboard = await getComercialStockLedgerDashboard();
    return NextResponse.json({ data: dashboard }, { status: 200 });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return comercialErrorResponse(error, "Error al obtener stock ledger comercial");
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authorizeDashboardRequest(req, '/dashboard/comercial/stock-ledger', ['admin', 'usuario']);
    const body = await readComercialJson(req);
    const movimiento = await createComercialStockMovimiento(body, user?.id ?? null);
    return NextResponse.json({ data: movimiento }, { status: 201 });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return comercialErrorResponse(error, "Error al registrar movimiento de stock comercial");
  }
}
