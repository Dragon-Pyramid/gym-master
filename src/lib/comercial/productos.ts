import { Producto } from '@/interfaces/producto.interface';

export const STOCK_CRITICO_DEFAULT = 5;

export type ProductoStockEstado =
  | 'sin_stock'
  | 'stock_critico'
  | 'stock_ok'
  | 'inactivo';

export function getProductoStockMinimo(producto: Producto): number {
  const stockMinimo = producto.stock_minimo ?? producto.stock_critico ?? null;
  if (typeof stockMinimo === 'number' && Number.isFinite(stockMinimo)) {
    return stockMinimo;
  }
  return STOCK_CRITICO_DEFAULT;
}

export function getProductoStockEstado(producto: Producto): ProductoStockEstado {
  if (producto.activo === false) return 'inactivo';
  if ((producto.stock ?? 0) <= 0) return 'sin_stock';
  if ((producto.stock ?? 0) <= getProductoStockMinimo(producto)) {
    return 'stock_critico';
  }
  return 'stock_ok';
}

export function getProductoStockEstadoLabel(producto: Producto): string {
  const estado = getProductoStockEstado(producto);
  const labels: Record<ProductoStockEstado, string> = {
    inactivo: 'Inactivo / discontinuado',
    sin_stock: 'Sin stock',
    stock_critico: 'Stock crítico',
    stock_ok: 'Stock OK',
  };
  return labels[estado];
}

export function isProductoStockCritico(producto: Producto): boolean {
  const estado = getProductoStockEstado(producto);
  return estado === 'stock_critico' || estado === 'sin_stock';
}

export function formatCurrencyARS(value: number | null | undefined): string {
  const numeric = Number(value ?? 0);
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(numeric) ? numeric : 0);
}

export function calcularValorInventario(productos: Producto[]): number {
  return productos.reduce((total, producto) => {
    const precio = Number(producto.precio ?? 0);
    const stock = Number(producto.stock ?? 0);
    return total + Math.max(precio, 0) * Math.max(stock, 0);
  }, 0);
}
