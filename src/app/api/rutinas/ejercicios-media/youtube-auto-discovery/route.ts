import { NextResponse } from 'next/server';
import { autoDiscoverExerciseYoutubeVideos } from '@/services/ejercicioMediaCatalogService';

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
            typeof autoDiscoverExerciseYoutubeVideos
          >[1]
        >
      >(
        request,
        64 * 1024,
      );

    const result = await autoDiscoverExerciseYoutubeVideos(user, {
      apply: payload.apply === true,
      limit: payload.limit,
      idiomas: payload.idiomas,
      onlyMissing: payload.onlyMissing,
      regionEs: payload.regionEs,
      regionEn: payload.regionEn,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    const authResponse =
      authorizationErrorResponse(error);

    if (authResponse) return authResponse;

    const response =
      ejercicioMediaHttpErrorResponse(
        error,
        'Error en descubrimiento automático de videos de YouTube.',
      );

    if (response.status >= 500) {
      console.error(
        'Error en descubrimiento automático YouTube por ejercicio:',
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
