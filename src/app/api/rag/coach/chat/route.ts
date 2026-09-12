import { NextResponse } from 'next/server';
import type { RagCoachChatRequest } from '@/interfaces/ragCoachChat.interface';
import { handleUnifiedRagCoachChat } from '@/services/server/ragCoachUnifiedChatService';
import { aiGeneratedContentTx, normalizeAiGeneratedContentLocale } from '@/utils/aiGeneratedContentI18n';

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

export async function POST(req: Request) {
  try {
    const user = await authorizeDashboardRequest(req, '/dashboard/coach', ['admin', 'socio']);
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body =
      await readJsonBody<
        Partial<RagCoachChatRequest>
      >(
        req,
        64 * 1024,
      );
    const message = typeof body.message === 'string' ? body.message : '';
    const rawBody = body as Partial<RagCoachChatRequest> & { idioma?: unknown };
    const locale = normalizeAiGeneratedContentLocale(rawBody.locale ?? rawBody.idioma);

    const data = await handleUnifiedRagCoachChat(user, {
      message,
      socio_id: typeof body.socio_id === 'string' ? body.socio_id : undefined,
      locale,
      conversationContext: body.conversationContext,
    });

    return NextResponse.json(
      {
        ok: true,
        message: aiGeneratedContentTx(locale, 'Respuesta generada correctamente por Coach IA.', 'Response generated successfully by AI Coach.'),
        data,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    const authResponse =
      authorizationErrorResponse(error);

    if (authResponse) return authResponse;

    const response =
      ragHttpErrorResponse(
        error,
        'No se pudo procesar el mensaje del Coach IA.',
        [
          {
            message:
              'El mensaje debe tener al menos 2 caracteres.',
            status: 400,
          },
          {
            message:
              'The message must be at least 2 characters long.',
            status: 400,
          },
        ],
      );

    if (response.status >= 500) {
      console.error(
        'Error en chat unificado RAG Coach:',
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
