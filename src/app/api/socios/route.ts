import { NextResponse } from 'next/server';
import {
  createSocioServer,
  deactivateSocioServer,
  fetchSociosServer,
  updateSocioServer,
} from '@/services/server/socioServerService';
import {
  authorizationErrorResponse,
  authorizeDashboardRequest,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

const SOCIOS_PATH = '/dashboard/socios';
const MANAGER_ROLES = ['admin', 'usuario'] as const;

export async function GET(req: Request) {
  try {
    const user = await authorizeDashboardRequest(req, SOCIOS_PATH, [...MANAGER_ROLES]);
    const socios = await fetchSociosServer(user);
    return NextResponse.json(socios, { status: 200 });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    const message = error instanceof Error ? error.message : 'Error al obtener socios';
    console.error('ERROR al obtener socios:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await authorizeDashboardRequest(req, SOCIOS_PATH, [...MANAGER_ROLES]);
    const body = await req.json();
    const creado = await createSocioServer(user, body);
    return NextResponse.json({ message: 'Socio creado con éxito', data: creado }, { status: 201 });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    const message = error instanceof Error ? error.message : 'Error al crear socio';
    console.error('ERROR al crear socio:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await authorizeDashboardRequest(req, SOCIOS_PATH, [...MANAGER_ROLES]);
    const { id, ...updateData } = await req.json();
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'ID inválido para actualizar' }, { status: 400 });
    }
    const actualizado = await updateSocioServer(user, id, updateData);
    return NextResponse.json({ message: 'Socio actualizado con éxito', data: actualizado }, { status: 200 });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    const message = error instanceof Error ? error.message : 'Error al actualizar socio';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await authorizeDashboardRequest(req, SOCIOS_PATH, [...MANAGER_ROLES]);
    const { id } = await req.json();
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'ID requerido para eliminar' }, { status: 400 });
    }
    const desactivado = await deactivateSocioServer(user, id);
    return NextResponse.json({ message: 'Socio desactivado con éxito', data: desactivado }, { status: 200 });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    const message = error instanceof Error ? error.message : 'Error al desactivar socio';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
