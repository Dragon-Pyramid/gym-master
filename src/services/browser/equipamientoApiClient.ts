import type {
  CreateEquipamentoDTO,
  Equipamento,
  UpdateEquipamentoDTO,
} from '@/interfaces/equipamiento.interface';
import type { AlertasMantenimientoEquipamientoResponse } from '@/interfaces/equipamientoAlertas.interface';
import type { EquipamientoMantenimientoBiResponse } from '@/interfaces/equipamientoMantenimientoBi.interface';
import {
  requestDatabaseApi,
  unwrapDatabaseApiData,
} from './databaseApiClient';

export async function getAllEquipamientos(): Promise<Equipamento[]> {
  const response = await requestDatabaseApi<
    Equipamento[] | { data: Equipamento[] }
  >(
    '/api/equipamientos',
    { method: 'GET' },
    'Error al obtener equipamientos'
  );
  return unwrapDatabaseApiData(response);
}

export async function createEquipamiento(
  payload: CreateEquipamentoDTO
): Promise<Equipamento> {
  const response = await requestDatabaseApi<
    Equipamento | { data: Equipamento }
  >(
    '/api/equipamientos',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    'Error al crear equipamiento'
  );
  return unwrapDatabaseApiData(response);
}

export async function updateEquipamiento(
  id: string,
  updateData: UpdateEquipamentoDTO
): Promise<Equipamento> {
  const response = await requestDatabaseApi<
    Equipamento | { data: Equipamento }
  >(
    `/api/equipamientos/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      body: JSON.stringify({ updateData }),
    },
    'Error al actualizar equipamiento'
  );
  return unwrapDatabaseApiData(response);
}

export async function deleteEquipamiento(
  id: string
): Promise<Equipamento> {
  const response = await requestDatabaseApi<
    Equipamento | { data: Equipamento }
  >(
    `/api/equipamientos/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
    'Error al eliminar equipamiento'
  );
  return unwrapDatabaseApiData(response);
}

export async function getOneEquipamientoById(
  id: string
): Promise<Equipamento> {
  const response = await requestDatabaseApi<
    Equipamento | { data: Equipamento }
  >(
    `/api/equipamientos/${encodeURIComponent(id)}`,
    { method: 'GET' },
    'Error al obtener equipamiento'
  );
  return unwrapDatabaseApiData(response);
}

export async function getAlertasMantenimientoEquipamientos(
  umbralDias = 5
): Promise<AlertasMantenimientoEquipamientoResponse> {
  return requestDatabaseApi<AlertasMantenimientoEquipamientoResponse>(
    `/api/equipamientos/alertas-mantenimiento?umbralDias=${encodeURIComponent(
      String(umbralDias)
    )}`,
    { method: 'GET' },
    'Error al obtener alertas de mantenimiento'
  );
}

export async function getEquipamientoMantenimientoBi(): Promise<EquipamientoMantenimientoBiResponse> {
  return requestDatabaseApi<EquipamientoMantenimientoBiResponse>(
    '/api/equipamientos/mantenimiento-bi',
    { method: 'GET' },
    'Error al obtener BI de mantenimiento de equipamiento'
  );
}
