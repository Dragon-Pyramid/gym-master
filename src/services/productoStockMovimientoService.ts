import {
  CreateProductoStockMovimientoDto,
  ProductoStockMovimiento,
} from '@/interfaces/producto_stock_movimiento.interface';

function getBrowserAuthToken(): string | null {
  if (typeof window === 'undefined') return null;

  const cookieToken = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith('token='))
    ?.split('=')[1];

  if (cookieToken) return decodeURIComponent(cookieToken);

  try {
    const rawAuthStorage = window.localStorage.getItem('auth-storage');
    if (!rawAuthStorage) return null;

    const parsed = JSON.parse(rawAuthStorage);
    const token = parsed?.state?.token;
    return typeof token === 'string' && token.trim().length > 0 ? token : null;
  } catch {
    return null;
  }
}

async function requestStockMovimientosApi<T>(
  method: 'GET' | 'POST',
  body?: unknown,
  query?: Record<string, string | number | null | undefined>
): Promise<T> {
  const token = getBrowserAuthToken();
  const params = new URLSearchParams();

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim().length > 0) {
        params.set(key, String(value));
      }
    });
  }

  const url = params.toString()
    ? `/api/productos/stock-movimientos?${params.toString()}`
    : '/api/productos/stock-movimientos';

  const res = await fetch(url, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.error || 'Error al operar movimientos de stock');
  }

  return payload?.data as T;
}

export async function getProductoStockMovimientos(
  productoId?: string,
  limit = 25
): Promise<ProductoStockMovimiento[]> {
  return requestStockMovimientosApi<ProductoStockMovimiento[]>('GET', undefined, {
    producto_id: productoId,
    limit,
  });
}

export async function createProductoStockMovimiento(
  payload: CreateProductoStockMovimientoDto
): Promise<ProductoStockMovimiento> {
  return requestStockMovimientosApi<ProductoStockMovimiento>('POST', payload);
}
