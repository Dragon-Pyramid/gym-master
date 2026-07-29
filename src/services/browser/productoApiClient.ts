import type {
  CreateProductoDto,
  Producto,
  ProductoPrecioCostoHistorial,
  UpdateProductoDto,
} from '@/interfaces/producto.interface';
import {
  requestDatabaseApi,
  unwrapDatabaseApiData,
} from './databaseApiClient';

export async function getAllProductos(): Promise<Producto[]> {
  const response = await requestDatabaseApi<
    Producto[] | { data: Producto[] }
  >('/api/productos', { method: 'GET' }, 'Error al obtener productos');
  return unwrapDatabaseApiData(response);
}

export async function getProductoHistorialPreciosCostos(
  productoId: string
): Promise<ProductoPrecioCostoHistorial[]> {
  const response = await requestDatabaseApi<
    ProductoPrecioCostoHistorial[] | { data: ProductoPrecioCostoHistorial[] }
  >(
    `/api/productos/historial-precios-costos?producto_id=${encodeURIComponent(
      productoId
    )}`,
    { method: 'GET' },
    'Error al obtener historial de precios y costos'
  );
  return unwrapDatabaseApiData(response);
}

export async function createProducto(
  payload: CreateProductoDto
): Promise<Producto> {
  const response = await requestDatabaseApi<
    Producto | { data: Producto }
  >(
    '/api/productos',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    'Error al crear producto'
  );
  return unwrapDatabaseApiData(response);
}

export async function updateProducto(
  id: string,
  updateData: UpdateProductoDto
): Promise<Producto> {
  const response = await requestDatabaseApi<
    Producto | { data: Producto }
  >(
    '/api/productos',
    {
      method: 'PUT',
      body: JSON.stringify({ id, updateData }),
    },
    'Error al actualizar producto'
  );
  return unwrapDatabaseApiData(response);
}

export async function deleteProducto(id: string): Promise<Producto> {
  await requestDatabaseApi(
    '/api/productos',
    {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    },
    'Error al eliminar producto'
  );
  return { id } as Producto;
}

export async function getProductoById(id: string): Promise<Producto> {
  const response = await requestDatabaseApi<
    Producto | { data: Producto }
  >(
    `/api/productos/${encodeURIComponent(id)}`,
    { method: 'GET' },
    'Error al obtener producto'
  );
  return unwrapDatabaseApiData(response);
}
