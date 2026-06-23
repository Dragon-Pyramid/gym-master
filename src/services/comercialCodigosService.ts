import { getToken } from './storageService';
import type { ComercialCodigosLabelsDashboard, GenerateComercialQrCodeDTO } from '@/interfaces/comercialCodigos.interface';

async function requestJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.error || payload?.message || 'Error de comunicación con Gym Master');
  }
  return payload as T;
}

export async function getComercialCodigosLabelsDashboardClient(): Promise<ComercialCodigosLabelsDashboard> {
  const payload = await requestJson<{ data: ComercialCodigosLabelsDashboard }>('/api/comercial/codigos/labels');
  return payload.data;
}

export async function generateComercialQrCodeClient(payload: GenerateComercialQrCodeDTO) {
  const response = await requestJson<{ data: any; message?: string }>('/api/comercial/codigos/qr', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return response.data;
}
