import type {
  CreateServicioDto,
  Servicio,
  UpdateServicioDto,
} from '@/interfaces/servicio.interface';
import {
  requestDatabaseApi,
  unwrapDatabaseApiData,
} from './databaseApiClient';

export async function getAllServicios(): Promise<Servicio[]> {
  const response = await requestDatabaseApi<
    Servicio[] | { data: Servicio[] }
  >('/api/servicios', { method: 'GET' }, 'Error al obtener servicios');
  return unwrapDatabaseApiData(response);
}

export async function createServicio(
  payload: CreateServicioDto
): Promise<Servicio> {
  const response = await requestDatabaseApi<
    Servicio | { data: Servicio }
  >(
    '/api/servicios',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    'Error al crear servicio'
  );
  return unwrapDatabaseApiData(response);
}

export async function updateServicio(
  id: string,
  updateData: UpdateServicioDto
): Promise<Servicio> {
  const response = await requestDatabaseApi<
    Servicio | { data: Servicio }
  >(
    '/api/servicios',
    {
      method: 'PUT',
      body: JSON.stringify({ id, updateData }),
    },
    'Error al actualizar servicio'
  );
  return unwrapDatabaseApiData(response);
}

export async function deleteServicio(id: string): Promise<Servicio[]> {
  await requestDatabaseApi(
    '/api/servicios',
    {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    },
    'Error al actualizar estado del servicio'
  );
  return [];
}

export async function getServicioById(id: string): Promise<Servicio> {
  const response = await requestDatabaseApi<
    Servicio | { data: Servicio }
  >(
    `/api/servicios/${encodeURIComponent(id)}`,
    { method: 'GET' },
    'Error al obtener servicio'
  );
  return unwrapDatabaseApiData(response);
}
