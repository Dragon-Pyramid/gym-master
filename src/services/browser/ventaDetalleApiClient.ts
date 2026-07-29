import type { JwtUser } from '@/interfaces/jwtUser.interface';
import type {
  CreateVentaDetalleDto,
  UpdateVentaDetalleDto,
  VentaDetalle,
} from '@/interfaces/venta_detalle.interface';
import {
  requestDatabaseApi,
  unwrapDatabaseApiData,
} from './databaseApiClient';

export function getVentaDetalleTotal(
  detalle: Partial<VentaDetalle>
): number {
  const totalLinea = Number(detalle.total_linea ?? Number.NaN);
  if (Number.isFinite(totalLinea)) return totalLinea;

  const subtotal = Number(detalle.subtotal ?? 0);
  const descuento = Number(detalle.descuento ?? 0);
  return Math.max(subtotal - descuento, 0);
}

export async function getAllVentaDetalles(
  _user?: JwtUser
): Promise<VentaDetalle[]> {
  const response = await requestDatabaseApi<
    VentaDetalle[] | { data: VentaDetalle[] }
  >(
    '/api/ventas_detalles',
    { method: 'GET' },
    'Error al obtener detalles de venta'
  );
  return unwrapDatabaseApiData(response);
}

export async function createVentaDetalle(
  _user: JwtUser | undefined,
  payload: CreateVentaDetalleDto,
  ventaId: string
): Promise<VentaDetalle | false> {
  const response = await requestDatabaseApi<
    VentaDetalle | { data: VentaDetalle }
  >(
    '/api/ventas_detalles',
    {
      method: 'POST',
      body: JSON.stringify({ ...payload, venta_id: ventaId }),
    },
    'Error al crear detalle de venta'
  );
  return unwrapDatabaseApiData(response);
}

export async function updateVentaDetalle(
  _user: JwtUser | undefined,
  id: string,
  updateData: UpdateVentaDetalleDto
): Promise<VentaDetalle> {
  const response = await requestDatabaseApi<
    VentaDetalle | { data: VentaDetalle }
  >(
    '/api/ventas_detalles',
    {
      method: 'PUT',
      body: JSON.stringify({ id, updateData }),
    },
    'Error al actualizar detalle de venta'
  );
  return unwrapDatabaseApiData(response);
}

export async function deleteVentaDetalle(
  _user: JwtUser | undefined,
  id: string
): Promise<VentaDetalle[]> {
  await requestDatabaseApi(
    '/api/ventas_detalles',
    {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    },
    'Error al eliminar detalle de venta'
  );
  return [];
}
