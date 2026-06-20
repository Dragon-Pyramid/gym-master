import type {
  ComercialPosDashboard,
  ComercialPosVentaResumen,
  CreateComercialPosVentaDTO,
} from '@/interfaces/comercialPos.interface';
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
  if (!res.ok) {
    throw new Error(payload?.error || fallback);
  }
  return payload?.data as T;
}

export async function getComercialKioscoPosDashboard(): Promise<ComercialPosDashboard> {
  const res = await fetch('/api/comercial/kiosco-pos', {
    method: 'GET',
    headers: buildHeaders(false),
    cache: 'no-store',
  });

  return parseResponse<ComercialPosDashboard>(res, 'Error al obtener POS/Kiosco');
}

export async function createComercialKioscoPosVenta(
  payload: CreateComercialPosVentaDTO
): Promise<ComercialPosVentaResumen> {
  const res = await fetch('/api/comercial/kiosco-pos', {
    method: 'POST',
    headers: buildHeaders(true),
    body: JSON.stringify(payload),
  });

  return parseResponse<ComercialPosVentaResumen>(res, 'Error al registrar venta POS/Kiosco');
}
