import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import type { RagCoachChatRequest } from '@/interfaces/ragCoachChat.interface';
import { handleUnifiedRagCoachChat } from '@/services/server/ragCoachUnifiedChatService';

export const dynamic = 'force-dynamic';

function getStatusFromError(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes('token') || normalized.includes('unauthorized')) return 401;
  if (normalized.includes('no autorizado')) return 403;
  if (normalized.includes('debe') || normalized.includes('mensaje')) return 400;
  return 500;
}

export async function POST(req: Request) {
  try {
    const { user } = await authMiddleware(req);
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as Partial<RagCoachChatRequest>;
    const message = typeof body.message === 'string' ? body.message : '';

    const data = await handleUnifiedRagCoachChat(user, {
      message,
      socio_id: typeof body.socio_id === 'string' ? body.socio_id : undefined,
      conversationContext: body.conversationContext,
    });

    return NextResponse.json(
      {
        ok: true,
        message: 'Respuesta generada correctamente por Coach IA.',
        data,
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado';

    console.error('Error en chat unificado RAG Coach:', error);

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: getStatusFromError(message) },
    );
  }
}
