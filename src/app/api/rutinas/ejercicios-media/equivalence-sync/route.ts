import { NextResponse } from 'next/server';
import { syncExerciseMediaEquivalences } from '@/services/ejercicioMediaCatalogService';

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

export async function POST(request: Request) {
  try {
    const user = await authorizeDashboardRequest(request, '/dashboard/rutinas/media', ['admin', 'usuario']);
    const payload =
      await readJsonBody<
        NonNullable<
          Parameters<
            typeof syncExerciseMediaEquivalences
          >[1]
        >
      >(
        request,
        64 * 1024,
      );

    const result = await syncExerciseMediaEquivalences(user, {
      apply: payload?.apply === true,
      limit: Number(payload?.limit ?? 500),
    });

    return NextResponse.json(
      {
        message: result.dryRun
          ? 'Previsualización de equivalencias generada correctamente.'
          : 'Sincronización de media equivalente aplicada correctamente.',
        ...result,
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
        'Error al sincronizar media de ejercicios equivalentes.',
      );

    if (response.status >= 500) {
      console.error(
        'Error al sincronizar media de ejercicios equivalentes:',
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
