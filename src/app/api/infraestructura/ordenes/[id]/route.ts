import { NextResponse } from 'next/server';
import {
  MANTENIMIENTO_EDILICIO_ORDEN_NOT_FOUND_ERROR,
  updateMantenimientoEdilicioOrden,
} from '@/services/server/infraestructuraMantenimientoService';

import {
  authorizationErrorResponse,
  authorizeDashboardRequest,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await authorizeDashboardRequest(req, '/dashboard/infraestructura/mantenimiento-edilicio', ['admin', 'usuario']);
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'ID de orden requerido.' }, { status: 400 });
    }

    const body = await req.json();
    const orden = await updateMantenimientoEdilicioOrden(id, body);
    return NextResponse.json({ message: 'Orden de mantenimiento edilicio actualizada con éxito', data: orden }, { status: 200 });
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    if (
      error?.message ===
      MANTENIMIENTO_EDILICIO_ORDEN_NOT_FOUND_ERROR
    ) {
      return NextResponse.json(
        { error: 'Orden de mantenimiento edilicio no encontrada.' },
        { status: 404 },
      );
    }

    console.error(
      'Error al actualizar orden de mantenimiento edilicio:',
      error,
    );

    return NextResponse.json(
      { error: 'Error al actualizar orden de mantenimiento edilicio.' },
      { status: 500 },
    );
  }
}
