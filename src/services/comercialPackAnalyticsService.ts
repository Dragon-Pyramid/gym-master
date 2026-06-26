import type { ComercialPackAnalyticsDashboard } from '@/interfaces/comercialPackAnalytics.interface';
import { getToken } from './storageService';

function buildHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getComercialPackAnalytics(params?: {
  desde?: string | null;
  hasta?: string | null;
}): Promise<ComercialPackAnalyticsDashboard> {
  const search = new URLSearchParams();
  if (params?.desde) search.set('desde', params.desde);
  if (params?.hasta) search.set('hasta', params.hasta);

  const res = await fetch(`/api/comercial/pack-analytics${search.toString() ? `?${search.toString()}` : ''}`, {
    method: 'GET',
    headers: buildHeaders(),
    cache: 'no-store',
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.error || 'No se pudo obtener analítica de packs');
  }

  return payload.data as ComercialPackAnalyticsDashboard;
}
