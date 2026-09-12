import { mantenimientoCompletado } from '@/services/mantenimientoService';
import { NextRequest, NextResponse } from 'next/server';


import {
  authorizationErrorResponse,
  authorizeDashboardRequest,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await authorizeDashboardRequest(req, '/dashboard/equipamientos', ['admin', 'usuario']);
    const { id } = await params;
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'ID inválido para actualizar' },
        { status: 400 }
      );
    }
    const mantenimiento = await mantenimientoCompletado(id);
    return NextResponse.json(
      {
        message:
          'Mantenimiento completado, el equipamiento vuelve a estar operativo',
        data: mantenimiento,
      },
      { status: 200 }
    );
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    console.error('Error al completar el mantenimiento:', error);
    return NextResponse.json(
      { error: 'Error al completar el mantenimiento' },
      { status: 500 }
    );
  }
}
