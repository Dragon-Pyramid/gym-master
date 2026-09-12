import { NextResponse } from 'next/server';
import { searchRagKnowledge } from '@/services/server/ragCoachSearchService';

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
    const user = await authorizeDashboardRequest(request, '/dashboard/coach', ['admin', 'socio']);
    const payload =
      await readJsonBody<
        Parameters<typeof searchRagKnowledge>[1]
      >(
        request,
        64 * 1024,
      );
    const result = await searchRagKnowledge(user, payload);
    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    const authResponse =
      authorizationErrorResponse(error);

    if (authResponse) return authResponse;

    const response =
      ragHttpErrorResponse(
        error,
        'Error en búsqueda RAG.',
        [
          {
            message:
              'No autorizado para usar herramientas RAG administrativas.',
            status: 403,
          },
          {
            message:
              'La consulta RAG debe tener al menos 3 caracteres.',
            status: 400,
          },
        ],
      );

    if (response.status >= 500) {
      console.error(
        'Error en búsqueda RAG:',
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
