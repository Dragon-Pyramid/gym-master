import type {
  ComercialCajaActionDTO,
  ComercialCajaDashboard,
} from '@/interfaces/comercialCaja.interface';
import { getToken } from './storageService';

function buildHeaders(hasBody = false): HeadersInit {
  const token = getToken();
  return {
    ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseResponse<T>(res: Response, fallback: string): Promise<T> {
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(payload?.error || fallback);
  return payload?.data as T;
}

export async function getComercialCajaDashboard(): Promise<ComercialCajaDashboard> {
  const res = await fetch('/api/comercial/caja', {
    method: 'GET',
    headers: buildHeaders(false),
    cache: 'no-store',
  });
  return parseResponse<ComercialCajaDashboard>(res, 'Error al obtener caja comercial');
}

export async function ejecutarComercialCajaAction(
  payload: ComercialCajaActionDTO
): Promise<ComercialCajaDashboard> {
  const res = await fetch('/api/comercial/caja', {
    method: 'POST',
    headers: buildHeaders(true),
    body: JSON.stringify(payload),
  });
  return parseResponse<ComercialCajaDashboard>(res, 'Error al operar caja comercial');
}
