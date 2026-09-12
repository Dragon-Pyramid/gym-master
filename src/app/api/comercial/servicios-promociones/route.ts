import { comercialErrorResponse, readComercialJson } from '@/lib/comercial/comercialErrorBoundary';
import { NextRequest, NextResponse } from 'next/server';
import {
  createComercialCupon,
  createComercialPack,
  createComercialPromocion,
  getComercialServiciosPromocionesDashboard,
} from '@/services/server/comercialServiciosPromocionesServerService';

import { authorizationErrorResponse, authorizeDashboardRequest } from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await authorizeDashboardRequest(req, '/dashboard/comercial/servicios-promociones', ['admin', 'usuario']);
    const dashboard = await getComercialServiciosPromocionesDashboard();
    return NextResponse.json({ data: dashboard }, { status: 200 });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return comercialErrorResponse(error, "Error al obtener servicios, packs y promociones");
  }
}

export async function POST(req: NextRequest) {
  try {
    await authorizeDashboardRequest(req, '/dashboard/comercial/servicios-promociones', ['admin', 'usuario']);
    const body = await readComercialJson(req);

    if (body?.action === 'crear_pack') {
      const data = await createComercialPack(body);
      return NextResponse.json({ data, message: 'Pack creado correctamente' }, { status: 201 });
    }

    if (body?.action === 'crear_promocion') {
      const data = await createComercialPromocion(body);
      return NextResponse.json({ data, message: 'Promoción creada correctamente' }, { status: 201 });
    }

    if (body?.action === 'crear_cupon') {
      const data = await createComercialCupon(body);
      return NextResponse.json({ data, message: 'Cupón creado correctamente' }, { status: 201 });
    }

    return NextResponse.json({ error: 'Acción comercial inválida' }, { status: 400 });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return comercialErrorResponse(error, "Error al operar servicios, packs y promociones");
  }
}
