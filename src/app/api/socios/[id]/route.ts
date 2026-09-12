import { NextRequest, NextResponse } from 'next/server';
import { getSocioByIdServer } from '@/services/server/socioServerService';
import {
  authorizationErrorResponse,
  authorizePersonalOrDashboardRequest,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await authorizePersonalOrDashboardRequest(
      req,
      '/dashboard/socios',
      ['admin', 'usuario'],
      ['socio'],
    );
    const socio = await getSocioByIdServer(user, id);
    return NextResponse.json({ data: socio }, { status: 200 });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    const message =
      error instanceof Error ? error.message : '';

    if (message === 'No se encontró el socio con ese ID') {
      return NextResponse.json(
        { error: message },
        { status: 404 },
      );
    }

    console.error('Error al obtener el socio:', {
      name: error instanceof Error
        ? error.name
        : 'UnknownError',
    });

    return NextResponse.json(
      { error: 'Error al obtener el socio' },
      { status: 500 },
    );
  }
}
