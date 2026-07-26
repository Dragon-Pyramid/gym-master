import type {
  CreateProveedorDto,
  Proveedor,
  UpdateProveedorDto,
} from '@/interfaces/proveedor.interface';
import {
  requestDatabaseApi,
  unwrapDatabaseApiData,
} from './databaseApiClient';

export async function getAllProveedores(): Promise<Proveedor[]> {
  const response = await requestDatabaseApi<
    Proveedor[] | { data: Proveedor[] }
  >(
    '/api/proveedores',
    { method: 'GET' },
    'Error al obtener proveedores'
  );
  return unwrapDatabaseApiData(response);
}

export async function createProveedor(
  payload: CreateProveedorDto
): Promise<Proveedor> {
  const response = await requestDatabaseApi<
    Proveedor | { data: Proveedor }
  >(
    '/api/proveedores',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    'Error al crear proveedor'
  );
  return unwrapDatabaseApiData(response);
}

export async function updateProveedor(
  id: string,
  updateData: UpdateProveedorDto
): Promise<Proveedor> {
  const response = await requestDatabaseApi<
    Proveedor | { data: Proveedor }
  >(
    '/api/proveedores',
    {
      method: 'PUT',
      body: JSON.stringify({ id, updateData }),
    },
    'Error al actualizar proveedor'
  );
  return unwrapDatabaseApiData(response);
}

export async function deleteProveedor(id: string): Promise<Proveedor> {
  await requestDatabaseApi(
    '/api/proveedores',
    {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    },
    'Error al desactivar proveedor'
  );
  return { id } as Proveedor;
}

export async function getProveedorById(id: string): Promise<Proveedor> {
  const response = await requestDatabaseApi<
    Proveedor | { data: Proveedor }
  >(
    `/api/proveedores/${encodeURIComponent(id)}`,
    { method: 'GET' },
    'Error al obtener proveedor'
  );
  return unwrapDatabaseApiData(response);
}
