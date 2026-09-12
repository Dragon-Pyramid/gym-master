import { NextResponse } from 'next/server';
import { getRagCorpusStatus } from '@/services/server/ragCorpusAdminService';

import {
  authorizeDashboardRequest,
  authorizationErrorResponse,
} from '@/lib/auth/serverAuthorization';
import {
  ragHttpErrorResponse,
} from '@/lib/rag/ragHttpBoundary';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await authorizeDashboardRequest(request, '/dashboard/rag-corpus', ['admin']);
    const status = await getRagCorpusStatus(user);
    return NextResponse.json(status, { status: 200 });
  } catch (error: unknown) {
    const authResponse =
      authorizationErrorResponse(error);

    if (authResponse) return authResponse;

    const response =
      ragHttpErrorResponse(
        error,
        'Error al consultar estado del corpus RAG.',
        [
          {
            message:
              'No autorizado para administrar el corpus RAG.',
            status: 403,
          },
        ],
      );

    if (response.status >= 500) {
      console.error(
        'Error al consultar estado del corpus RAG:',
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
