import { getHorariosByEntrenadorId } from '@/services/entrenadorHorarioService';
import { NextResponse } from 'next/server';


import {
  authorizeDashboardRequest,
  authorizationErrorResponse,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authorizeDashboardRequest(req, '/dashboard/empleados', ['admin', 'usuario']);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: 'ID del entrenador es requerido' },
        { status: 400 }
      );
    }

    const horarios = await getHorariosByEntrenadorId(id, user);

    if (!horarios) {
      return NextResponse.json(
        { error: 'Horarios no encontrados para el entrenador' },
        { status: 404 }
      );
    }

    return NextResponse.json(horarios, { status: 200 });
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    console.error('Error al obtener los horarios del entrenador:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
