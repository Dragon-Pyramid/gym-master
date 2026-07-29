import type {
  CreateMantenimientoDTO,
  Mantenimiento,
  UpdateMantenimientoDTO,
} from '@/interfaces/mantenimiento.interface';
import {
  requestDatabaseApi,
  unwrapDatabaseApiData,
} from './databaseApiClient';

export async function getMantenimientoByIdEquipamiento(
  id: string
): Promise<Mantenimiento[]> {
  const response = await requestDatabaseApi<
    Mantenimiento[] | { data: Mantenimiento[] }
  >(
    `/api/mantenimientos/${encodeURIComponent(id)}`,
    { method: 'GET' },
    'Error al obtener mantenimientos'
  );
  return unwrapDatabaseApiData(response);
}

export async function createMantenimiento(
  payload: CreateMantenimientoDTO
): Promise<Mantenimiento> {
  const response = await requestDatabaseApi<
    Mantenimiento | { data: Mantenimiento }
  >(
    '/api/mantenimientos',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    'Error al crear mantenimiento'
  );
  return unwrapDatabaseApiData(response);
}

export async function updateMantenimiento(
  id: string,
  updateData: UpdateMantenimientoDTO
): Promise<Mantenimiento> {
  const response = await requestDatabaseApi<
    Mantenimiento | { data: Mantenimiento }
  >(
    '/api/mantenimientos',
    {
      method: 'PUT',
      body: JSON.stringify({ id, updateData }),
    },
    'Error al actualizar mantenimiento'
  );
  return unwrapDatabaseApiData(response);
}

export async function getAllMantenimientos(): Promise<Mantenimiento[]> {
  const response = await requestDatabaseApi<
    Mantenimiento[] | { data: Mantenimiento[] }
  >(
    '/api/mantenimientos',
    { method: 'GET' },
    'Error al obtener mantenimientos'
  );
  return unwrapDatabaseApiData(response);
}

export async function mantenimientoCompletado(
  id: string
): Promise<Mantenimiento> {
  const response = await requestDatabaseApi<
    Mantenimiento | { data: Mantenimiento }
  >(
    `/api/mantenimientos/completado/${encodeURIComponent(id)}`,
    { method: 'PUT' },
    'Error al completar mantenimiento'
  );
  return unwrapDatabaseApiData(response);
}
