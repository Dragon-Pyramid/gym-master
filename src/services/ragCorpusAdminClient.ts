import type { RagCorpusBatchRequest, RagCorpusBatchResponse, RagCorpusStatusResponse } from '@/interfaces/ragCorpus.interface';
import { getToken } from './storageService';

function authHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getRagCorpusStatusClient(): Promise<RagCorpusStatusResponse> {
  const res = await fetch('/api/rag/coach/corpus/status', {
    method: 'GET',
    headers: authHeaders(),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'No se pudo consultar estado del corpus RAG.');
  return data as RagCorpusStatusResponse;
}

export async function runRagCorpusBatchClient(payload: RagCorpusBatchRequest): Promise<RagCorpusBatchResponse> {
  const res = await fetch('/api/rag/coach/corpus/run', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok && res.status !== 207) throw new Error(data.error || 'No se pudo ejecutar tanda de corpus RAG.');
  return data as RagCorpusBatchResponse;
}
