import {
  RagRutinasAssistantApiResponse,
  RagRutinasAssistantRequest,
} from '@/interfaces/ragRutinasAssistant.interface';
import { getToken } from './storageService';

export async function generarRutinaConAsistente(
  payload: RagRutinasAssistantRequest
): Promise<RagRutinasAssistantApiResponse> {
  const token = getToken();

  const res = await fetch('/api/rutinas/rag-assistant/generar', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));

  return {
    ok: res.ok,
    ...data,
  };
}
