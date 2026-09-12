import { NextResponse } from 'next/server';
import { getRagHealth } from '@/services/server/ragCoachSearchService';

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
    const user = await authorizeDashboardRequest(request, '/dashboard/coach', ['admin', 'socio']);
    const status = await getRagHealth(user);
    return NextResponse.json(status, { status: 200 });
  } catch (error: unknown) {
    const authResponse =
      authorizationErrorResponse(error);

    if (authResponse) return authResponse;

    const response =
      ragHttpErrorResponse(
        error,
        'Error al consultar estado RAG.',
        [
          {
            message:
              'No autorizado para usar herramientas RAG administrativas.',
            status: 403,
          },
        ],
      );

    if (response.status >= 500) {
      console.error(
        'Error al consultar estado RAG:',
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
