import type {
  Aviso,
  CreateAvisoDto,
  UpdateAvisoDto,
} from '@/interfaces/aviso.interface';
import {
  requestDatabaseApi,
  unwrapDatabaseApiData,
} from './databaseApiClient';

export async function getAllAvisos(): Promise<Aviso[]> {
  const response = await requestDatabaseApi<
    Aviso[] | { data: Aviso[] }
  >('/api/avisos', { method: 'GET' }, 'Error al obtener avisos');
  return unwrapDatabaseApiData(response);
}

export async function createAviso(payload: CreateAvisoDto): Promise<Aviso> {
  const response = await requestDatabaseApi<
    Aviso | { data: Aviso }
  >(
    '/api/avisos',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    'Error al crear aviso'
  );
  return unwrapDatabaseApiData(response);
}

export async function updateAviso(
  id: string,
  updateData: UpdateAvisoDto
): Promise<Aviso> {
  const response = await requestDatabaseApi<
    Aviso | { data: Aviso }
  >(
    `/api/avisos/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      body: JSON.stringify(updateData),
    },
    'Error al actualizar aviso'
  );
  return unwrapDatabaseApiData(response);
}

export async function deleteAviso(id: string): Promise<Aviso> {
  const response = await requestDatabaseApi<
    Aviso | { data: Aviso }
  >(
    `/api/avisos/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
    'Error al eliminar aviso'
  );
  return unwrapDatabaseApiData(response);
}

export async function getAvisoById(id: string): Promise<Aviso> {
  const response = await requestDatabaseApi<
    Aviso | { data: Aviso }
  >(
    `/api/avisos/${encodeURIComponent(id)}`,
    { method: 'GET' },
    'Error al obtener aviso'
  );
  return unwrapDatabaseApiData(response);
}
