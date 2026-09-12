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

    const message =
      error?.message || 'Error al crear sector edilicio.';

    if (
      message ===
      'El nombre del sector es obligatorio.'
    ) {
      return NextResponse.json(
        {
          error:
            'El nombre del sector es obligatorio.',
        },
        { status: 400 },
      );
    }

    console.error(
      'Error al crear sector edilicio:',
      error,
    );

    return NextResponse.json(
      { error: 'Error al crear sector edilicio.' },
      { status: 500 },
    );
  }
}
