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

    const message =
      error?.message || 'Error al crear activo edilicio.';

    if (
      message ===
      'El nombre del activo edilicio es obligatorio.'
    ) {
      return NextResponse.json(
        {
          error:
            'El nombre del activo edilicio es obligatorio.',
        },
        { status: 400 },
      );
    }

    console.error(
      'Error al crear activo edilicio:',
      error,
    );

    return NextResponse.json(
      { error: 'Error al crear activo edilicio.' },
      { status: 500 },
    );
  }
}
