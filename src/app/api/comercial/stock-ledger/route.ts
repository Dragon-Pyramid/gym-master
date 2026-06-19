import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import {
  createComercialStockMovimiento,
  getComercialStockLedgerDashboard,
} from '@/services/server/comercialStockLedgerServerService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await authMiddleware(req);
    const dashboard = await getComercialStockLedgerDashboard();
    return NextResponse.json({ data: dashboard }, { status: 200 });
  } catch (error: any) {
    const message = error?.message || 'Error al obtener stock ledger comercial';
    const status = message.includes('Token') || message.includes('JWT') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await authMiddleware(req);
    const body = await req.json();
    const movimiento = await createComercialStockMovimiento(body, user?.id ?? null);
    return NextResponse.json({ data: movimiento }, { status: 201 });
  } catch (error: any) {
    const message = error?.message || 'Error al registrar movimiento de stock comercial';
    const status = message.includes('Token') || message.includes('JWT') ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
