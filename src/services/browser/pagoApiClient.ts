import {
  CreatePagoDto,
  PagoManualFormOptions,
  ResponsePago,
  UpdatePagoDto,
} from '@/interfaces/pago.interface';
import { authHeader } from '@/services/storageService';

async function parseResponse<T>(res: Response): Promise<T> {
  const payload = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(payload.error || payload.message || 'Error en la operación de pagos');
  }

  return payload as T;
}

export async function fetchPagosApi(): Promise<ResponsePago[]> {
  const res = await fetch('/api/pagos', {
    method: 'GET',
    headers: authHeader(),
  });
  const payload = await parseResponse<{ data: ResponsePago[] }>(res);
  return payload.data ?? [];
}

export async function fetchPagoFormOptionsApi(): Promise<PagoManualFormOptions> {
  const res = await fetch('/api/pagos?options=true', {
    method: 'GET',
    headers: authHeader(),
  });
  const payload = await parseResponse<{ data: PagoManualFormOptions }>(res);
  return payload.data;
}

export async function createPagoManualApi(
  payload: CreatePagoDto
): Promise<ResponsePago> {
  const res = await fetch('/api/pagos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
    },
    body: JSON.stringify(payload),
  });
  const response = await parseResponse<{ data: ResponsePago }>(res);
  return response.data;
}

export async function updatePagoApi(
  id: string,
  updateData: UpdatePagoDto
): Promise<ResponsePago> {
  const res = await fetch('/api/pagos', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
    },
    body: JSON.stringify({ id, updateData }),
  });
  const response = await parseResponse<{ data: ResponsePago }>(res);
  return response.data;
}

export async function deletePagoApi(id: string): Promise<ResponsePago> {
  const res = await fetch('/api/pagos', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
    },
    body: JSON.stringify({ id }),
  });
  const response = await parseResponse<{ data: ResponsePago }>(res);
  return response.data;
}
