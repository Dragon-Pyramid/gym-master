import { getToken } from './storageService';
import type {
  RagCoachChatApiResponse,
  RagCoachChatRequest,
} from '@/interfaces/ragCoachChat.interface';

export async function enviarMensajeCoachIa(
  body: RagCoachChatRequest,
): Promise<RagCoachChatApiResponse> {
  const token = getToken();
  const res = await fetch('/api/rag/coach/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, ...data } as RagCoachChatApiResponse;
}
