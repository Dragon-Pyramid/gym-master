import type {
  ComercialStockLedgerDashboard,
  ComercialStockMovimiento,
  CreateComercialStockMovimientoDTO,
} from '@/interfaces/comercialStockLedger.interface';
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

export async function getComercialStockLedgerDashboard(): Promise<ComercialStockLedgerDashboard> {
  const res = await fetch('/api/comercial/stock-ledger', {
    method: 'GET',
    headers: buildHeaders(false),
    cache: 'no-store',
  });

  return parseResponse<ComercialStockLedgerDashboard>(res, 'Error al obtener stock ledger');
}

export async function createComercialStockMovimiento(
  payload: CreateComercialStockMovimientoDTO
): Promise<ComercialStockMovimiento> {
  const res = await fetch('/api/comercial/stock-ledger', {
    method: 'POST',
    headers: buildHeaders(true),
    body: JSON.stringify(payload),
  });

  return parseResponse<ComercialStockMovimiento>(res, 'Error al registrar movimiento comercial');
}
