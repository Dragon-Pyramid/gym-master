import { SociosDemografiaBiResponse } from '@/interfaces/sociosDemografiaBi.interface';
import { authHeader } from './storageService';

export interface SociosDemografiaBiQuery {
  desde?: string;
  hasta?: string;
}

export async function getSociosDemografiaPromocionesBi(
  query: SociosDemografiaBiQuery = {}
): Promise<SociosDemografiaBiResponse> {
  const searchParams = new URLSearchParams();

  if (query.desde) searchParams.set('desde', query.desde);
  if (query.hasta) searchParams.set('hasta', query.hasta);

  const queryString = searchParams.toString();
  const response = await fetch(
    `/api/socios/demografia-promociones-bi${queryString ? `?${queryString}` : ''}`,
    {
      method: 'GET',
      headers: authHeader(),
      cache: 'no-store',
    }
  );

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.error || 'Error al obtener BI demográfico de socios');
  }

  return payload?.data as SociosDemografiaBiResponse;
}
