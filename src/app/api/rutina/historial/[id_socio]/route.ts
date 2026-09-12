import { NextResponse } from 'next/server';
import { historialRutinaSocio } from '@/services/rutinaService';
import {
  authorizationErrorResponse,
  authorizePersonalOrDashboardRequest,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id_socio: string }> },
) {
  try {
    const user = await authorizePersonalOrDashboardRequest(
      req,
      ['/dashboard/rutinas/asistente', '/dashboard/gestor-rutinas'],
      ['admin', 'usuario'],
      ['socio'],
    );
    const { id_socio } = await params;
    const historialRutina = await historialRutinaSocio(user, id_socio);
    return NextResponse.json(historialRutina, { status: 200 });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;

    console.error('Error al obtener historial de rutinas:', {
      name: error instanceof Error ? error.name : 'UnknownError',
    });

    return NextResponse.json(
      { error: 'Error al obtener historial de rutinas' },
      { status: 500 },
    );
  }
}
