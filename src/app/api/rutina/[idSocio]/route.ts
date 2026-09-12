import {
  authorizationErrorResponse,
  authorizePersonalOrDashboardRequest,
} from '@/lib/auth/serverAuthorization';
import { historialRutinaSocio } from '@/services/rutinaService';
import { deleteRutinaById } from '@/services/server/rutinaServerService';
import { NextResponse } from 'next/server';


export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ idSocio: string }> }
) {
  try {
    const user = await authorizePersonalOrDashboardRequest(
      req,
      ['/dashboard/rutinas/asistente', '/dashboard/gestor-rutinas'],
      ['admin', 'usuario'],
      ['socio'],
    );

    const { idSocio } = await params;
    if (!idSocio) {
      return NextResponse.json(
        { error: 'ID del socio es requerido' },
        { status: 400 }
      );
    }

    const rutinas = await historialRutinaSocio(user, idSocio);

    if (!rutinas) {
      return NextResponse.json(
        { error: 'Rutinas no encontradas para el socio' },
        { status: 404 }
      );
    }

    return NextResponse.json(rutinas, { status: 200 });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;

    console.error('Error al obtener las rutinas del socio:', {
      name: error instanceof Error ? error.name : 'UnknownError',
    });

    return NextResponse.json(
      { error: 'Error al obtener las rutinas del socio' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ idSocio: string }> }
) {
  try {
    const user = await authorizePersonalOrDashboardRequest(
      req,
      ['/dashboard/rutinas/asistente', '/dashboard/gestor-rutinas'],
      ['admin', 'usuario'],
      ['socio'],
    );

    const { idSocio: idRutina } = await params;
    const deletedRutina = await deleteRutinaById(user, idRutina);

    return NextResponse.json(
      {
        message: 'Rutina eliminada correctamente',
        data: deletedRutina,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;

    const message =
      error instanceof Error ? error.message : '';

    if (message === 'El id de rutina no es válido') {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (message === 'Rutina no encontrada') {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    console.error('Error al eliminar rutina:', {
      name: error instanceof Error ? error.name : 'UnknownError',
    });

    return NextResponse.json(
      { error: 'Error al eliminar rutina' },
      { status: 500 },
    );
  }
}
