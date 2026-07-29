import { authHeader } from '@/services/storageService';

export type DatabaseApiEnvelope<T> = {
  data: T;
  message?: string;
};

function mergeHeaders(init?: RequestInit): Headers {
  const headers = new Headers(init?.headers ?? undefined);

  for (const [key, value] of Object.entries(authHeader())) {
    headers.set(key, value);
  }

  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return headers;
}

export async function requestDatabaseApi<T>(
  input: string,
  init: RequestInit = {},
  fallbackMessage = 'Error al operar la base mediante la API segura'
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: mergeHeaders(init),
    cache: init.cache ?? 'no-store',
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      payload?.error ||
        payload?.message ||
        fallbackMessage
    );
  }

  return payload as T;
}

export function unwrapDatabaseApiData<T>(
  payload: T | DatabaseApiEnvelope<T>
): T {
  if (
    payload &&
    typeof payload === 'object' &&
    Object.prototype.hasOwnProperty.call(payload, 'data')
  ) {
    return (payload as DatabaseApiEnvelope<T>).data;
  }

  return payload as T;
}
