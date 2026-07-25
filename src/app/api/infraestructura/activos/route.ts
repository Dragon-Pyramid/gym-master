import { NextResponse } from 'next/server';
import { createInfraestructuraActivo } from '@/services/server/infraestructuraMantenimientoService';

import {
  authorizationErrorResponse,
  authorizeDashboardRequest,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    await authorizeDashboardRequest(req, '/dashboard/infraestructura/mantenimiento-edilicio', ['admin', 'usuario']);
    const body = await req.json();
    const activo = await createInfraestructuraActivo(body);
    return NextResponse.json({ message: 'Activo edilicio creado con éxito', data: activo }, { status: 201 });
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json(
      { error: error?.message || 'Error al crear activo edilicio.' },
      { status: error?.message?.includes('obligatorio') ? 400 : 500 },
    );
  }
}
