import type {
  Cuota,
  CreateCuotaDto,
  UpdateCuotaDto,
} from '@/interfaces/cuota.interface';
import {
  requestDatabaseApi,
  unwrapDatabaseApiData,
} from './databaseApiClient';

export async function getAllCuotas(): Promise<Cuota[]> {
  const response = await requestDatabaseApi<
    Cuota[] | { data: Cuota[] }
  >('/api/cuota', { method: 'GET' }, 'Error al obtener cuotas');
  return unwrapDatabaseApiData(response);
}

export async function createCuota(payload: CreateCuotaDto): Promise<Cuota> {
  const response = await requestDatabaseApi<
    Cuota | { data: Cuota }
  >(
    '/api/cuota',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    'Error al crear cuota'
  );
  return unwrapDatabaseApiData(response);
}

export async function updateCuota(
  id: string,
  updateData: UpdateCuotaDto
): Promise<Cuota> {
  const response = await requestDatabaseApi<
    Cuota | { data: Cuota }
  >(
    '/api/cuota',
    {
      method: 'PUT',
      body: JSON.stringify({ id, updateData }),
    },
    'Error al actualizar cuota'
  );
  return unwrapDatabaseApiData(response);
}

export async function deleteCuota(id: string): Promise<Cuota> {
  await requestDatabaseApi(
    '/api/cuota',
    {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    },
    'Error al eliminar cuota'
  );
  return { id } as Cuota;
}

export async function getCuotaById(id: string): Promise<Cuota> {
  const response = await requestDatabaseApi<
    Cuota | { data: Cuota }
  >(
    `/api/cuota/${encodeURIComponent(id)}`,
    { method: 'GET' },
    'Error al obtener cuota'
  );
  return unwrapDatabaseApiData(response);
}
