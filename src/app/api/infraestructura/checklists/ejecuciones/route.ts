import { NextResponse } from 'next/server';
import { createInfraestructuraChecklistEjecucion } from '@/services/server/infraestructuraMantenimientoService';

import {
  authorizationErrorResponse,
  authorizeDashboardRequest,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    await authorizeDashboardRequest(req, '/dashboard/infraestructura/mantenimiento-edilicio', ['admin', 'usuario']);
    const body = await req.json();
    const ejecucion = await createInfraestructuraChecklistEjecucion(body);
    return NextResponse.json({ message: 'Checklist edilicio ejecutado con éxito', data: ejecucion }, { status: 201 });
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    const message =
      error?.message ||
      'Error al ejecutar checklist edilicio.';

    if (
      message ===
      'Seleccioná un checklist para ejecutar.'
    ) {
      return NextResponse.json(
        {
          error:
            'Seleccioná un checklist para ejecutar.',
        },
        { status: 400 },
      );
    }

    if (
      message ===
      'La ejecución debe estar asociada a un activo, sector u orden edilicia.'
    ) {
      return NextResponse.json(
        {
          error:
            'La ejecución debe estar asociada a un activo, sector u orden edilicia.',
        },
        { status: 400 },
      );
    }

    if (
      message ===
      'No se encontró el checklist seleccionado.'
    ) {
      return NextResponse.json(
        {
          error:
            'No se encontró el checklist seleccionado.',
        },
        { status: 404 },
      );
    }

    console.error(
      'Error al ejecutar checklist edilicio:',
      error,
    );

    return NextResponse.json(
      { error: 'Error al ejecutar checklist edilicio.' },
      { status: 500 },
    );
  }
}
