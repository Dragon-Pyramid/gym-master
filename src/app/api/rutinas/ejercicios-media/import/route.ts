import { NextResponse } from 'next/server';
import { importExerciseMediaFromRemoteUrl } from '@/services/ejercicioMediaCatalogService';

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
          typeof importExerciseMediaFromRemoteUrl
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

    const imported = await importExerciseMediaFromRemoteUrl(user, {
      ...payload,
      id_ejercicio: Number(payload.id_ejercicio),
    });

    return NextResponse.json(
      {
        message: 'Media importada correctamente a Cloudinary.',
        ...imported,
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
        'Error al importar media remota de ejercicio.',
        {
          allowImportValidation: true,
        },
      );

    if (response.status >= 500) {
      console.error(
        'Error al importar media remota de ejercicio:',
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
