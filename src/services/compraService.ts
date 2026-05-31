import { CreateCompraDto, Compra, UpdateCompraDto } from '@/interfaces/compra.interface';
import { authHeader } from './storageService';

async function requestCompras<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  body?: unknown,
  id?: string
): Promise<T> {
  const res = await fetch(id ? `/api/compras/${id}` : '/api/compras', {
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
    throw new Error(payload?.error || 'Error al operar compras');
  }

  return payload?.data as T;
}

export async function getAllCompras(): Promise<Compra[]> {
  return requestCompras<Compra[]>('GET');
}

export async function createCompra(payload: CreateCompraDto): Promise<Compra> {
  return requestCompras<Compra>('POST', payload);
}

export async function updateCompra(id: string, payload: UpdateCompraDto): Promise<Compra> {
  return requestCompras<Compra>('PATCH', payload, id);
}

export async function anularCompra(id: string): Promise<Compra> {
  return requestCompras<Compra>('DELETE', undefined, id);
}
