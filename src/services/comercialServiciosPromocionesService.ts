import type {
  ComercialCupon,
  ComercialPack,
  ComercialPromocion,
  ComercialServiciosPromocionesDashboard,
  CreateComercialCuponDTO,
  CreateComercialPackDTO,
  CreateComercialPromocionDTO,
} from '@/interfaces/comercialServiciosPromociones.interface';
import { authHeader } from './storageService';

type ActionPayload =
  | ({ action: 'crear_pack' } & CreateComercialPackDTO)
  | ({ action: 'crear_promocion' } & CreateComercialPromocionDTO)
  | ({ action: 'crear_cupon' } & CreateComercialCuponDTO);

async function request<T>(method: 'GET' | 'POST', body?: ActionPayload): Promise<T> {
  const res = await fetch('/api/comercial/servicios-promociones', {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...authHeader(),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(payload?.error || 'Error al operar servicios, packs y promociones');
  return payload?.data as T;
}

export async function getComercialServiciosPromocionesDashboard(): Promise<ComercialServiciosPromocionesDashboard> {
  return request<ComercialServiciosPromocionesDashboard>('GET');
}

export async function createComercialPack(payload: CreateComercialPackDTO): Promise<ComercialPack> {
  return request<ComercialPack>('POST', { action: 'crear_pack', ...payload });
}

export async function createComercialPromocion(payload: CreateComercialPromocionDTO): Promise<ComercialPromocion> {
  return request<ComercialPromocion>('POST', { action: 'crear_promocion', ...payload });
}

export async function createComercialCupon(payload: CreateComercialCuponDTO): Promise<ComercialCupon> {
  return request<ComercialCupon>('POST', { action: 'crear_cupon', ...payload });
}
