import {
  authorizationErrorResponse,
  authorizeDashboardRequest,
} from '@/lib/auth/serverAuthorization';
import {
  createCuota,
  deleteCuota,
  getAllCuotas,
  updateCuota,
} from '@/services/cuotaService';
import { NextResponse } from 'next/server';

const CUOTAS_PATH = '/dashboard/cuotas';
const CUOTAS_ROLES = ['admin', 'usuario'] as const;

export async function GET(req: Request) {
  try {
    await authorizeDashboardRequest(req, CUOTAS_PATH, [...CUOTAS_ROLES]);
    const cuotas = await getAllCuotas();
    return NextResponse.json({ data: cuotas }, { status: 200 });
  } catch (error) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;

    console.error('Error al obtener las cuotas:', error);
    return NextResponse.json(
      { error: 'Error al obtener las cuotas' },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    await authorizeDashboardRequest(req, CUOTAS_PATH, [...CUOTAS_ROLES]);
    const body = await req.json();

    if (
      !body.descripcion ||
      !body.monto ||
      body.monto <= 0 ||
      !body.fecha_inicio ||
      !body.fecha_fin
    ) {
      return NextResponse.json(
        {
          error:
            'Todos los campos son obligatorios y el monto debe ser mayor que 0',
        },
        { status: 400 },
      );
    }

    const cuota = await createCuota(body);
    return NextResponse.json(
      { message: 'Cuota creada con éxito', data: cuota },
      { status: 201 },
    );
  } catch (error) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;

    console.error('Error al crear la cuota:', error);
    return NextResponse.json(
      { error: 'Error al crear la cuota' },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    await authorizeDashboardRequest(req, CUOTAS_PATH, [...CUOTAS_ROLES]);
    const { id, updateData } = await req.json();

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'ID inválido para actualizar' },
        { status: 400 },
      );
    }

    const cuotaModificada = await updateCuota(id, updateData);
    return NextResponse.json(
      { message: 'Cuota actualizada con éxito', data: cuotaModificada },
      { status: 200 },
    );
  } catch (error) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;

    const message =
      error instanceof Error ? error.message : 'Error al actualizar cuota';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await authorizeDashboardRequest(req, CUOTAS_PATH, [...CUOTAS_ROLES]);
    const { id } = await req.json();

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'ID inválido para eliminar' },
        { status: 400 },
      );
    }

    await deleteCuota(id);
    return NextResponse.json(
      { message: 'Cuota eliminada con éxito' },
      { status: 200 },
    );
  } catch (error) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;

    const message =
      error instanceof Error ? error.message : 'Error al eliminar cuota';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
