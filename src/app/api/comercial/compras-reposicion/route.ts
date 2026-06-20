import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import {
  createComercialOrdenCompra,
  getComercialComprasReposicionDashboard,
  recibirComercialOrdenCompra,
  upsertComercialProveedorProducto,
} from '@/services/server/comercialComprasReposicionServerService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await authMiddleware(req);
    const dashboard = await getComercialComprasReposicionDashboard();
    return NextResponse.json({ data: dashboard }, { status: 200 });
  } catch (error: any) {
    const message = error?.message || 'Error al obtener compras y reposición comercial';
    const status = message.includes('Token') || message.includes('JWT') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await authMiddleware(req);
    const body = await req.json();

    if (body?.action === 'proveedor_producto') {
      const data = await upsertComercialProveedorProducto(body, user ?? null);
      return NextResponse.json({ data, message: 'Proveedor asociado al producto' }, { status: 201 });
    }

    if (body?.action === 'crear_orden') {
      const data = await createComercialOrdenCompra(body, user ?? null);
      return NextResponse.json({ data, message: 'Orden de compra creada' }, { status: 201 });
    }

    if (body?.action === 'recibir_orden') {
      const data = await recibirComercialOrdenCompra(body, user ?? null);
      return NextResponse.json({ data, message: 'Recepción registrada' }, { status: 200 });
    }

    return NextResponse.json({ error: 'Acción de compras/reposición inválida' }, { status: 400 });
  } catch (error: any) {
    const message = error?.message || 'Error al operar compras y reposición comercial';
    const status = message.includes('Token') || message.includes('JWT') ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
