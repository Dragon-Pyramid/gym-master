import { NextRequest, NextResponse } from 'next/server';
import {
  getAvisoById,
  updateAviso,
  deleteAviso,
} from '@/services/avisoService';


import {
  authorizationErrorResponse,
  authorizeDashboardRequest,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await authorizeDashboardRequest(_req, '/dashboard/avisos', ['admin', 'usuario']);
    const { id } = await params;
    const aviso = await getAvisoById(id);
    if (!aviso)
      return NextResponse.json(
        { error: 'Aviso no encontrado' },
        { status: 404 }
      );
    return NextResponse.json(aviso);
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    if (error?.message === 'No se encontró el aviso con ese id') {
      return NextResponse.json(
        { error: 'Aviso no encontrado' },
        { status: 404 },
      );
    }

    console.error('Error al obtener aviso:', error);
    return NextResponse.json(
      { error: 'Error al obtener aviso' },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await authorizeDashboardRequest(req, '/dashboard/avisos', ['admin', 'usuario']);
    const { id } = await params;
    const body = await req.json();
    const aviso = await updateAviso(id, body);
    return NextResponse.json(aviso);
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    if (error?.message === 'No se encontró el aviso con ese id') {
      return NextResponse.json(
        { error: 'Aviso no encontrado' },
        { status: 404 },
      );
    }

    console.error('Error al actualizar aviso:', error);
    return NextResponse.json(
      { error: 'Error al actualizar aviso' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await authorizeDashboardRequest(_req, '/dashboard/avisos', ['admin', 'usuario']);
    const { id } = await params;
    const aviso = await deleteAviso(id);
    return NextResponse.json(aviso);
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    if (error?.message === 'No se encontró el aviso con ese id') {
      return NextResponse.json(
        { error: 'Aviso no encontrado' },
        { status: 404 },
      );
    }

    console.error('Error al eliminar aviso:', error);
    return NextResponse.json(
      { error: 'Error al eliminar aviso' },
      { status: 500 },
    );
  }
}
