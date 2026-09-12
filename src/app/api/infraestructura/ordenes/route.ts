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
    const message =
      error?.message ||
      'Error al crear orden de mantenimiento edilicio.';

    if (
      message ===
      'El título de la orden es obligatorio.'
    ) {
      return NextResponse.json(
        {
          error:
            'El título de la orden es obligatorio.',
        },
        { status: 400 },
      );
    }

    if (
      message ===
      'La orden debe estar asociada a un activo edilicio o a un sector.'
    ) {
      return NextResponse.json(
        {
          error:
            'La orden debe estar asociada a un activo edilicio o a un sector.',
        },
        { status: 400 },
      );
    }

    console.error(
      'Error al crear orden de mantenimiento edilicio:',
      error,
    );

    return NextResponse.json(
      {
        error:
          'Error al crear orden de mantenimiento edilicio.',
      },
      { status: 500 },
    );
  }
}
