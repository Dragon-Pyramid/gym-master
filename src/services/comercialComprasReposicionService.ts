import type {
  ComercialComprasReposicionDashboard,
  ComercialOrdenCompra,
  ComercialProveedorProducto,
  CreateOrdenCompraDTO,
  RecibirOrdenCompraDTO,
  UpsertProveedorProductoDTO,
} from '@/interfaces/comercialComprasReposicion.interface';
import { authHeader } from './storageService';

type ActionPayload =
  | ({ action: 'proveedor_producto' } & UpsertProveedorProductoDTO)
  | ({ action: 'crear_orden' } & CreateOrdenCompraDTO)
  | ({ action: 'recibir_orden' } & RecibirOrdenCompraDTO);

async function request<T>(method: 'GET' | 'POST', body?: ActionPayload): Promise<T> {
  const res = await fetch('/api/comercial/compras-reposicion', {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...authHeader(),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.error || 'Error al operar compras y reposición');
  }

  return payload?.data as T;
}

export async function getComercialComprasReposicionDashboard(): Promise<ComercialComprasReposicionDashboard> {
  return request<ComercialComprasReposicionDashboard>('GET');
}

export async function upsertComercialProveedorProducto(
  payload: UpsertProveedorProductoDTO
): Promise<ComercialProveedorProducto> {
  return request<ComercialProveedorProducto>('POST', { action: 'proveedor_producto', ...payload });
}

export async function createComercialOrdenCompra(payload: CreateOrdenCompraDTO): Promise<ComercialOrdenCompra> {
  return request<ComercialOrdenCompra>('POST', { action: 'crear_orden', ...payload });
}

export async function recibirComercialOrdenCompra(payload: RecibirOrdenCompraDTO): Promise<ComercialOrdenCompra> {
  return request<ComercialOrdenCompra>('POST', { action: 'recibir_orden', ...payload });
}
