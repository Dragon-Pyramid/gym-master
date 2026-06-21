import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import {
  createComercialCupon,
  createComercialPack,
  createComercialPromocion,
  getComercialServiciosPromocionesDashboard,
} from '@/services/server/comercialServiciosPromocionesServerService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await authMiddleware(req);
    const dashboard = await getComercialServiciosPromocionesDashboard();
    return NextResponse.json({ data: dashboard }, { status: 200 });
  } catch (error: any) {
    const message = error?.message || 'Error al obtener servicios, packs y promociones';
    const status = message.includes('Token') || message.includes('JWT') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    await authMiddleware(req);
    const body = await req.json();

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
  } catch (error: any) {
    const message = error?.message || 'Error al operar servicios, packs y promociones';
    const status = message.includes('Token') || message.includes('JWT') ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
