import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import {
  createComercialKioscoPosVenta,
  getComercialKioscoPosDashboard,
} from '@/services/server/comercialKioscoPosServerService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await authMiddleware(req);
    const dashboard = await getComercialKioscoPosDashboard();
    return NextResponse.json({ data: dashboard }, { status: 200 });
  } catch (error: any) {
    const message = error?.message || 'Error al obtener POS/Kiosco';
    const status = message.includes('Token') || message.includes('JWT') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await authMiddleware(req);
    const body = await req.json();
    const venta = await createComercialKioscoPosVenta(body, user ?? null);
    return NextResponse.json({ data: venta, message: 'Venta POS/Kiosco registrada' }, { status: 201 });
  } catch (error: any) {
    const message = error?.message || 'Error al registrar venta POS/Kiosco';
    const status = message.includes('Token') || message.includes('JWT') ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
