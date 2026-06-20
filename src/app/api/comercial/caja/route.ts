import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import {
  abrirCaja,
  cerrarCaja,
  getComercialCajaDashboard,
  registrarMovimientoCaja,
} from '@/services/server/comercialCajaServerService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await authMiddleware(req);
    const dashboard = await getComercialCajaDashboard();
    return NextResponse.json({ data: dashboard }, { status: 200 });
  } catch (error: any) {
    const message = error?.message || 'Error al obtener caja comercial';
    const status = message.includes('Token') || message.includes('JWT') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await authMiddleware(req);
    const body = await req.json();

    if (body?.action === 'abrir') {
      const data = await abrirCaja(body, user ?? null);
      return NextResponse.json({ data, message: 'Caja abierta correctamente' }, { status: 201 });
    }

    if (body?.action === 'movimiento') {
      const data = await registrarMovimientoCaja(body, user ?? null);
      return NextResponse.json({ data, message: 'Movimiento de caja registrado' }, { status: 201 });
    }

    if (body?.action === 'cerrar') {
      const data = await cerrarCaja(body, user ?? null);
      return NextResponse.json({ data, message: 'Caja cerrada correctamente' }, { status: 200 });
    }

    return NextResponse.json({ error: 'Acción de caja inválida' }, { status: 400 });
  } catch (error: any) {
    const message = error?.message || 'Error al operar caja comercial';
    const status = message.includes('Token') || message.includes('JWT') ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
