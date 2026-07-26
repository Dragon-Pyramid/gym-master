import type {
  Asistencia,
  CreateAsistenciaDto,
  UpdateAsistenciaDto,
} from '@/interfaces/asistencia.interface';
import type { JwtUser } from '@/interfaces/jwtUser.interface';
import {
  requestDatabaseApi,
  unwrapDatabaseApiData,
} from './databaseApiClient';

export async function getAllAsistencias(
  _user?: JwtUser
): Promise<Asistencia[]> {
  const payload = await requestDatabaseApi<
    Asistencia[] | { data: Asistencia[] }
  >(
    '/api/asistencias',
    { method: 'GET' },
    'Error al obtener asistencias'
  );
  return unwrapDatabaseApiData(payload);
}

export async function createAsistencia(
  _user: JwtUser | undefined,
  payload: CreateAsistenciaDto
): Promise<Asistencia> {
  const response = await requestDatabaseApi<
    Asistencia | { data: Asistencia }
  >(
    '/api/asistencias',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    'Error al registrar asistencia'
  );
  return unwrapDatabaseApiData(response);
}

export async function updateAsistencia(
  _user: JwtUser | undefined,
  id: string,
  updateData: UpdateAsistenciaDto
): Promise<Asistencia> {
  const response = await requestDatabaseApi<
    Asistencia | { data: Asistencia }
  >(
    '/api/asistencias',
    {
      method: 'PUT',
      body: JSON.stringify({ id, updateData }),
    },
    'Error al actualizar asistencia'
  );
  return unwrapDatabaseApiData(response);
}

export async function deleteAsistencia(
  _user: JwtUser | undefined,
  id: string
): Promise<Asistencia[]> {
  await requestDatabaseApi(
    '/api/asistencias',
    {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    },
    'Error al eliminar asistencia'
  );
  return [];
}
