import { comercialErrorResponse, readComercialJson } from '@/lib/comercial/comercialErrorBoundary';
import { NextRequest, NextResponse } from 'next/server';
import {
  abrirCaja,
  cerrarCaja,
  getComercialCajaDashboard,
  registrarMovimientoCaja,
} from '@/services/server/comercialCajaServerService';

import { authorizationErrorResponse, authorizeDashboardRequest } from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await authorizeDashboardRequest(req, '/dashboard/comercial/caja', ['admin', 'usuario']);
    const dashboard = await getComercialCajaDashboard();
    return NextResponse.json({ data: dashboard }, { status: 200 });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return comercialErrorResponse(error, "Error al obtener caja comercial");
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authorizeDashboardRequest(req, '/dashboard/comercial/caja', ['admin', 'usuario']);
    const body = await readComercialJson(req);

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
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return comercialErrorResponse(error, "Error al operar caja comercial");
  }
}
