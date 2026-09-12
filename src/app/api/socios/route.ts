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
import {
  HttpRuntimeError,
  readJsonBody,
  runtimeErrorResponse,
} from '@/lib/security/httpRuntimeSecurity';

export const dynamic = 'force-dynamic';

const SOCIOS_PATH = '/dashboard/socios';
const MANAGER_ROLES = ['admin', 'usuario'] as const;

type CreateSocioRequestBody =
  Parameters<typeof createSocioServer>[1];

type UpdateSocioRequestBody =
  Parameters<typeof updateSocioServer>[2] & {
    id?: unknown;
  };

function sociosErrorResponse(error: unknown, fallback: string) {
  if (error instanceof HttpRuntimeError) {
    return runtimeErrorResponse(error, fallback);
  }

  const message = error instanceof Error ? error.message : '';

  if (message === 'No autorizado para administrar socios') {
    return NextResponse.json({ error: message }, { status: 403 });
  }

  if (
    message === 'Nombre completo y DNI son obligatorios' ||
    message === 'usuario_id no existe en la base de datos'
  ) {
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (message === 'No se encontró el socio con ese ID') {
    return NextResponse.json({ error: message }, { status: 404 });
  }

  console.error(fallback, {
    name: error instanceof Error ? error.name : 'UnknownError',
  });

  return NextResponse.json(
    { error: fallback },
    { status: 500 },
  );
}

export async function GET(req: Request) {
  try {
    const user = await authorizeDashboardRequest(req, SOCIOS_PATH, [...MANAGER_ROLES]);
    const socios = await fetchSociosServer(user);
    return NextResponse.json(socios, { status: 200 });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return sociosErrorResponse(
      error,
      'Error al obtener socios',
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await authorizeDashboardRequest(req, SOCIOS_PATH, [...MANAGER_ROLES]);
    const body =
      await readJsonBody<CreateSocioRequestBody>(
        req,
        128 * 1024,
      );
    const creado = await createSocioServer(user, body);
    return NextResponse.json({ message: 'Socio creado con éxito', data: creado }, { status: 201 });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return sociosErrorResponse(
      error,
      'Error al crear socio',
    );
  }
}

export async function PUT(req: Request) {
  try {
    const user = await authorizeDashboardRequest(req, SOCIOS_PATH, [...MANAGER_ROLES]);
    const { id, ...updateData } =
      await readJsonBody<UpdateSocioRequestBody>(
        req,
        128 * 1024,
      );
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'ID inválido para actualizar' }, { status: 400 });
    }
    const actualizado = await updateSocioServer(user, id, updateData);
    return NextResponse.json({ message: 'Socio actualizado con éxito', data: actualizado }, { status: 200 });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return sociosErrorResponse(
      error,
      'Error al actualizar socio',
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await authorizeDashboardRequest(req, SOCIOS_PATH, [...MANAGER_ROLES]);
    const { id } =
      await readJsonBody<{ id?: unknown }>(
        req,
        128 * 1024,
      );
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'ID requerido para eliminar' }, { status: 400 });
    }
    const desactivado = await deactivateSocioServer(user, id);
    return NextResponse.json({ message: 'Socio desactivado con éxito', data: desactivado }, { status: 200 });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return sociosErrorResponse(
      error,
      'Error al desactivar socio',
    );
  }
}
