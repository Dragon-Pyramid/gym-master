import { Producto } from '@/interfaces/producto.interface';
import { Proveedor } from '@/interfaces/proveedor.interface';
import { Servicio } from '@/interfaces/servicio.interface';
import { ResponseVenta } from '@/interfaces/venta.interface';
import { getToken } from './storageService';

async function fetchApiData<T>(url: string): Promise<T[]> {
  const token = getToken();
  const res = await fetch(url, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  });

  if (!res.ok) {
    return [];
  }

  const payload = await res.json();
  const data = Array.isArray(payload?.data) ? payload.data : [];
  return data as T[];
}

export async function getComercialProductos(): Promise<Producto[]> {
  return fetchApiData<Producto>('/api/productos');
}

export async function getComercialProveedores(): Promise<Proveedor[]> {
  return fetchApiData<Proveedor>('/api/proveedores');
}

export async function getComercialServicios(): Promise<Servicio[]> {
  return fetchApiData<Servicio>('/api/servicios');
}

export async function getComercialVentas(): Promise<ResponseVenta[]> {
  return fetchApiData<ResponseVenta>('/api/ventas');
}
