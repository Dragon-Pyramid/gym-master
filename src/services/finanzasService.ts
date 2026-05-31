import { FinanzasDashboardResponse } from '@/interfaces/finanzas.interface';
import { authHeader } from './storageService';

export interface FinanzasDashboardQuery {
  desde?: string;
  hasta?: string;
}

export async function getFinanzasDashboardBi(
  query: FinanzasDashboardQuery = {}
): Promise<FinanzasDashboardResponse> {
  const searchParams = new URLSearchParams();

  if (query.desde) searchParams.set('desde', query.desde);
  if (query.hasta) searchParams.set('hasta', query.hasta);

  const queryString = searchParams.toString();
  const response = await fetch(
    `/api/finanzas/dashboard-bi${queryString ? `?${queryString}` : ''}`,
    {
      method: 'GET',
      headers: authHeader(),
      cache: 'no-store',
    }
  );

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.error || 'Error al obtener BI financiero');
  }

  return payload?.data as FinanzasDashboardResponse;
}
