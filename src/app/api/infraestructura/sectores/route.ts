import { NextResponse } from 'next/server';
import { createInfraestructuraSector } from '@/services/server/infraestructuraMantenimientoService';

import {
  authorizationErrorResponse,
  authorizeDashboardRequest,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    await authorizeDashboardRequest(req, '/dashboard/infraestructura/mantenimiento-edilicio', ['admin', 'usuario']);
    const body = await req.json();
    const sector = await createInfraestructuraSector(body);
    return NextResponse.json({ message: 'Sector edilicio creado con éxito', data: sector }, { status: 201 });
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json(
      { error: error?.message || 'Error al crear sector edilicio.' },
      { status: error?.message?.includes('obligatorio') ? 400 : 500 },
    );
  }
}
