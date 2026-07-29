import type { Actividad } from '@/interfaces/actividad.interface';
import {
  requestDatabaseApi,
  unwrapDatabaseApiData,
} from './databaseApiClient';

type ActividadPayload = {
  nombre_actividad: string;
};

export async function fetchAllActividades(): Promise<Actividad[]> {
  const payload = await requestDatabaseApi<Actividad[]>(
    '/api/actividades',
    { method: 'GET' },
    'Error al obtener las actividades'
  );
  return unwrapDatabaseApiData(payload);
}

export async function createActividad(
  payload: ActividadPayload
): Promise<Actividad | Actividad[]> {
  const response = await requestDatabaseApi<
    Actividad | Actividad[] | { data: Actividad | Actividad[] }
  >(
    '/api/actividades',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    'Error al crear la actividad'
  );
  return unwrapDatabaseApiData(response);
}

export async function updateActividad(
  id: string,
  updateData: Partial<ActividadPayload>
): Promise<Actividad | Actividad[]> {
  const response = await requestDatabaseApi<
    Actividad | Actividad[] | { data: Actividad | Actividad[] }
  >(
    '/api/actividades',
    {
      method: 'PUT',
      body: JSON.stringify({ id, updateData }),
    },
    'Error al actualizar la actividad'
  );
  return unwrapDatabaseApiData(response);
}

export async function deleteActividad(id: string): Promise<void> {
  await requestDatabaseApi(
    '/api/actividades',
    {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    },
    'Error al eliminar la actividad'
  );
}

export async function getActividadById(id: string): Promise<Actividad> {
  const response = await requestDatabaseApi<
    Actividad | { data: Actividad }
  >(
    `/api/actividades/${encodeURIComponent(id)}`,
    { method: 'GET' },
    'Error al obtener la actividad'
  );
  return unwrapDatabaseApiData(response);
}
