import { NextRequest, NextResponse } from 'next/server';
import {
  createComercialStockMovimiento,
  getComercialStockLedgerDashboard,
} from '@/services/server/comercialStockLedgerServerService';

import {
  authorizeDashboardRequest,
  authorizationErrorResponse,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await authorizeDashboardRequest(req, '/dashboard/comercial/stock-ledger', ['admin', 'usuario']);
    const dashboard = await getComercialStockLedgerDashboard();
    return NextResponse.json({ data: dashboard }, { status: 200 });
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    const message = error?.message || 'Error al obtener stock ledger comercial';
    const status = message.includes('Token') || message.includes('JWT') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authorizeDashboardRequest(req, '/dashboard/comercial/stock-ledger', ['admin', 'usuario']);
    const body = await req.json();
    const movimiento = await createComercialStockMovimiento(body, user?.id ?? null);
    return NextResponse.json({ data: movimiento }, { status: 201 });
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    const message = error?.message || 'Error al registrar movimiento de stock comercial';
    const status = message.includes('Token') || message.includes('JWT') ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
