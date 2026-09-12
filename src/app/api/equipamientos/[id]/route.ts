import {
  deleteEquipamiento,
  getOneEquipamientoById,
  updateEquipamiento,
} from '@/services/equipamientoService';
import { NextRequest, NextResponse } from 'next/server';


import {
  authorizationErrorResponse,
  authorizeDashboardRequest,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';


export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await authorizeDashboardRequest(req, '/dashboard/equipamientos', ['admin', 'usuario']);
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'El ID del equipamiento no puede estar vacío' },
        { status: 400 }
      );
    }

    const equipamiento = await getOneEquipamientoById(id);
    return NextResponse.json(
      { data: equipamiento },
      { status: 200 }
    );
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    console.error('Error al obtener el equipamiento:', error);
    return NextResponse.json(
      { error: 'Error al obtener el equipamiento' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await authorizeDashboardRequest(req, '/dashboard/equipamientos', ['admin', 'usuario']);
    const { id } = await params;

    const { updateData } = await req.json();

    if (!updateData || !id || id === '') {
      return NextResponse.json(
        { error: 'El cuerpo de la solicitud no puede estar vacío' },
        { status: 400 }
      );
    }

    const equipamiento = await updateEquipamiento(id, updateData);
    return NextResponse.json(
      { message: 'Equipamiento modificado', data: equipamiento },
      { status: 201 }
    );
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    console.error('Error al modificar el equipamiento:', error);
    return NextResponse.json(
      { error: 'Error al modificar el equipamiento' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await authorizeDashboardRequest(req, '/dashboard/equipamientos', ['admin', 'usuario']);
    const { id } = await params;

    if (!id || id === '') {
      return NextResponse.json(
        { error: 'El ID del equipamiento no puede estar vacío' },
        { status: 400 }
      );
    }
    const equipamiento = await deleteEquipamiento(id);
    return NextResponse.json(
      { message: 'Equipamiento eliminado', data: equipamiento },
      { status: 200 }
    );
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    console.error('Error al eliminar el equipamiento:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el equipamiento' },
      { status: 500 }
    );
  }
}
