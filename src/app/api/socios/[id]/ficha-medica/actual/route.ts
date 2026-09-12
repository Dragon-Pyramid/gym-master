import { NextResponse } from 'next/server';
import {
  authorizationErrorResponse,
  authorizePersonalOrDashboardRequest,
} from '@/lib/auth/serverAuthorization';
import { FindFichaMedicaSocio, resolveFichaMedicaSocioId } from '@/services/fichaMedicaService';



function getFichaMedicaErrorStatus(message?: string) {
  if (message?.includes('No autorizado')) return 403;
  if (message?.includes('No se encontró')) return 404;
  if (message?.includes('no proporcionado')) return 400;
  return 500;
}

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authorizePersonalOrDashboardRequest(
      req,
      '/dashboard/ficha-medica',
      ['admin', 'usuario'],
      ['socio'],
    );

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: 'ID de socio no proporcionado' },
        { status: 400 }
      );
    }

    const resolvedSocioId = await resolveFichaMedicaSocioId(user, id);
    const ficha = await FindFichaMedicaSocio(user, resolvedSocioId);

    return NextResponse.json({ data: ficha }, { status: 200 });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;

    const message =
      error instanceof Error ? error.message : '';

    const status =
      getFichaMedicaErrorStatus(message);

    if (status >= 500) {
      console.error('Error al obtener ficha médica actual:', {
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
