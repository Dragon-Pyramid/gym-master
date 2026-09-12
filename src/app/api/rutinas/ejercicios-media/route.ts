import { NextResponse } from 'next/server';
import {
  getExerciseMediaCatalog,
  updateExerciseMediaCatalogItem,
} from '@/services/ejercicioMediaCatalogService';

import {
  authorizeDashboardRequest,
  authorizationErrorResponse,
} from '@/lib/auth/serverAuthorization';
import {
  ejercicioMediaHttpErrorResponse,
} from '@/lib/rutinas/ejercicioMediaHttpBoundary';
import {
  readJsonBody,
} from '@/lib/security/httpRuntimeSecurity';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await authorizeDashboardRequest(request, '/dashboard/rutinas/media', ['admin', 'usuario']);
    const url = new URL(request.url);
    const catalog = await getExerciseMediaCatalog(user, url.searchParams);

    return NextResponse.json(catalog, { status: 200 });
  } catch (error: unknown) {
    const authResponse =
      authorizationErrorResponse(error);

    if (authResponse) return authResponse;

    const response =
      ejercicioMediaHttpErrorResponse(
        error,
        'Error al obtener catálogo de media de ejercicios.',
      );

    if (response.status >= 500) {
      console.error(
        'Error al obtener catálogo de media de ejercicios:',
        {
          name:
            error instanceof Error
              ? error.name
              : 'UnknownError',
        },
      );
    }

    return response;
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await authorizeDashboardRequest(request, '/dashboard/rutinas/media', ['admin', 'usuario']);
    const payload =
      await readJsonBody<
        Parameters<
          typeof updateExerciseMediaCatalogItem
        >[1]
      >(
        request,
        64 * 1024,
      );

    if (!payload?.id_ejercicio || !Number.isInteger(Number(payload.id_ejercicio))) {
      return NextResponse.json(
        { error: 'Debe indicar un id_ejercicio válido.' },
        { status: 400 }
      );
    }

    const updated = await updateExerciseMediaCatalogItem(user, {
      ...payload,
      id_ejercicio: Number(payload.id_ejercicio),
    });

    return NextResponse.json(
      {
        message: 'Media del ejercicio actualizada correctamente.',
        data: updated,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const authResponse =
      authorizationErrorResponse(error);

    if (authResponse) return authResponse;

    const response =
      ejercicioMediaHttpErrorResponse(
        error,
        'Error al actualizar media de ejercicio.',
      );

    if (response.status >= 500) {
      console.error(
        'Error al actualizar media de ejercicio:',
        {
          name:
            error instanceof Error
              ? error.name
              : 'UnknownError',
        },
      );
    }

    return response;
  }
}
