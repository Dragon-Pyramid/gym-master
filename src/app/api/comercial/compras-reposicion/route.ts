import { comercialErrorResponse, readComercialJson } from '@/lib/comercial/comercialErrorBoundary';
import { NextRequest, NextResponse } from 'next/server';
import {
  createComercialOrdenCompra,
  getComercialComprasReposicionDashboard,
  recibirComercialOrdenCompra,
  upsertComercialProveedorProducto,
} from '@/services/server/comercialComprasReposicionServerService';

import { authorizationErrorResponse, authorizeDashboardRequest } from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await authorizeDashboardRequest(req, '/dashboard/comercial/compras-reposicion', ['admin', 'usuario']);
    const dashboard = await getComercialComprasReposicionDashboard();
    return NextResponse.json({ data: dashboard }, { status: 200 });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return comercialErrorResponse(error, "Error al obtener compras y reposición comercial");
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authorizeDashboardRequest(req, '/dashboard/comercial/compras-reposicion', ['admin', 'usuario']);
    const body = await readComercialJson(req);

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
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return comercialErrorResponse(error, "Error al operar compras y reposición comercial");
  }
}
