import { NextResponse } from 'next/server';
import { vectorizePendingRagChunks } from '@/services/server/ragCoachIngestionService';

import {
  authorizeDashboardRequest,
  authorizationErrorResponse,
} from '@/lib/auth/serverAuthorization';
import {
  ragHttpErrorResponse,
} from '@/lib/rag/ragHttpBoundary';
import {
  readJsonBody,
} from '@/lib/security/httpRuntimeSecurity';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const user = await authorizeDashboardRequest(request, '/dashboard/rag-corpus', ['admin']);
    const payload =
      await readJsonBody<
        Parameters<typeof vectorizePendingRagChunks>[1]
      >(
        request,
        64 * 1024,
      );
    const result = await vectorizePendingRagChunks(user, payload);
    return NextResponse.json(result, { status: result.ok ? 200 : 207 });
  } catch (error: unknown) {
    const authResponse =
      authorizationErrorResponse(error);

    if (authResponse) return authResponse;

    const response =
      ragHttpErrorResponse(
        error,
        'Error al vectorizar chunks RAG pendientes.',
        [
          {
            message:
              'No autorizado para administrar la ingesta RAG.',
            status: 403,
          },
        ],
      );

    if (response.status >= 500) {
      console.error(
        'Error al vectorizar chunks RAG pendientes:',
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
