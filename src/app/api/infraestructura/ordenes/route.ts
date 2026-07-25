import { NextResponse } from 'next/server';
import { createMantenimientoEdilicioOrden } from '@/services/server/infraestructuraMantenimientoService';

import {
  authorizationErrorResponse,
  authorizeDashboardRequest,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    await authorizeDashboardRequest(req, '/dashboard/infraestructura/mantenimiento-edilicio', ['admin', 'usuario']);
    const body = await req.json();
    const orden = await createMantenimientoEdilicioOrden(body);
    return NextResponse.json({ message: 'Orden de mantenimiento edilicio creada con éxito', data: orden }, { status: 201 });
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    const message = error?.message || 'Error al crear orden de mantenimiento edilicio.';
    const status = message.includes('obligatorio') || message.includes('asociada') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
