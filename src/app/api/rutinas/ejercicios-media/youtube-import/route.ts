import { NextResponse } from 'next/server';
import { importExerciseYoutubeVideos } from '@/services/ejercicioMediaCatalogService';

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
        Parameters<
          typeof importExerciseYoutubeVideos
        >[1]
      >(
        request,
        64 * 1024,
      );

    if (!Array.isArray(payload?.items)) {
      return NextResponse.json(
        { error: 'Debe enviar items como arreglo de ejercicios/videos a importar.' },
        { status: 400 }
      );
    }

    const result = await importExerciseYoutubeVideos(user, {
      apply: payload.apply === true,
      items: payload.items,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    const authResponse =
      authorizationErrorResponse(error);

    if (authResponse) return authResponse;

    const response =
      ejercicioMediaHttpErrorResponse(
        error,
        'Error en importación masiva de videos de YouTube.',
      );

    if (response.status >= 500) {
      console.error(
        'Error en importación masiva de YouTube por ejercicio:',
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
