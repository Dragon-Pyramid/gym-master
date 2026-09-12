import {
  authorizationErrorResponse,
  authorizePersonalOrDashboardRequest,
} from '@/lib/auth/serverAuthorization';
import { FindOneFichaMedicaSocio, resolveFichaMedicaSocioId } from '@/services/fichaMedicaService';
import { NextResponse } from 'next/server';



function getFichaMedicaErrorStatus(message?: string) {
  if (message?.includes('No autorizado')) return 403;
  if (message?.includes('No se encontró')) return 404;
  if (message?.includes('no proporcionado')) return 400;
  return 500;
}

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; id_ficha: string }> }
) {
  try {
    const user = await authorizePersonalOrDashboardRequest(
      req,
      '/dashboard/ficha-medica',
      ['admin', 'usuario'],
      ['socio'],
    );
    const { id, id_ficha } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'ID de socio no proporcionado' },
        { status: 400 }
      );
    }

    if (!id_ficha) {
      return NextResponse.json(
        { error: 'ID de ficha médica no proporcionado' },
        { status: 400 }
      );
    }

    const resolvedSocioId = await resolveFichaMedicaSocioId(user, id);
    const ficha = await FindOneFichaMedicaSocio(user, resolvedSocioId, id_ficha);

    return NextResponse.json({ data: ficha }, { status: 200 });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;

    const message =
      error instanceof Error ? error.message : '';

    const status =
      getFichaMedicaErrorStatus(message);

    if (status >= 500) {
      console.error('Error al obtener ficha médica:', {
        name: error instanceof Error
          ? error.name
          : 'UnknownError',
      });
    }

    return NextResponse.json(
      {
        error: status >= 500
          ? 'No se pudo obtener la ficha médica'
          : message || 'Solicitud inválida',
      },
      { status },
    );
  }
}
