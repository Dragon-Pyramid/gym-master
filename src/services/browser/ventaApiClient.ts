import type { JwtUser } from '@/interfaces/jwtUser.interface';
import type {
  CreateVentaConDetalleDto,
  ResponseVenta,
  UpdateVentaDto,
  Venta,
} from '@/interfaces/venta.interface';
import {
  requestDatabaseApi,
  unwrapDatabaseApiData,
} from './databaseApiClient';

export async function getAllVentas(
  _user?: JwtUser
): Promise<ResponseVenta[]> {
  const response = await requestDatabaseApi<
    ResponseVenta[] | { data: ResponseVenta[] }
  >('/api/ventas', { method: 'GET' }, 'Error al obtener ventas');
  return unwrapDatabaseApiData(response);
}

export async function createVenta(
  _user: JwtUser | undefined,
  payload: CreateVentaConDetalleDto
): Promise<ResponseVenta> {
  const response = await requestDatabaseApi<
    ResponseVenta | { data: ResponseVenta }
  >(
    '/api/ventas',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    'Error al registrar venta'
  );
  return unwrapDatabaseApiData(response);
}

export async function updateVenta(
  _user: JwtUser | undefined,
  id: string,
  updateData: UpdateVentaDto
): Promise<Venta> {
  const response = await requestDatabaseApi<
    Venta | { data: Venta }
  >(
    '/api/ventas',
    {
      method: 'PUT',
      body: JSON.stringify({ id, updateData }),
    },
    'Error al actualizar venta'
  );
  return unwrapDatabaseApiData(response);
}

export async function deleteVenta(
  _user: JwtUser | undefined,
  id: string
): Promise<Venta> {
  await requestDatabaseApi(
    '/api/ventas',
    {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    },
    'Error al anular venta'
  );
  return { id } as Venta;
}

export async function getVentaById(
  _user: JwtUser | undefined,
  id: string
): Promise<ResponseVenta> {
  const response = await requestDatabaseApi<
    ResponseVenta | { data: ResponseVenta }
  >(
    `/api/ventas/${encodeURIComponent(id)}`,
    { method: 'GET' },
    'Error al obtener venta'
  );
  return unwrapDatabaseApiData(response);
}
