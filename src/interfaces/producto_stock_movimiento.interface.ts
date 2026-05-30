export type ProductoStockMovimientoTipo =
  | 'venta'
  | 'reversion_venta'
  | 'ajuste'
  | 'devolucion'
  | 'merma'
  | 'compra';

export type ProductoStockOperacionTipo =
  | 'ajuste_entrada'
  | 'ajuste_salida'
  | 'recuento'
  | 'devolucion'
  | 'merma'
  | 'compra';

export interface ProductoStockMovimientoProductoResumen {
  id: string;
  nombre: string;
  stock?: number | null;
}

export interface ProductoStockMovimiento {
  id: string;
  producto_id: string;
  venta_id?: string | null;
  venta_detalle_id?: string | null;
  tipo: ProductoStockMovimientoTipo;
  cantidad: number;
  stock_anterior: number;
  stock_nuevo: number;
  motivo?: string | null;
  creado_por?: string | null;
  creado_en?: string | null;
  producto?: ProductoStockMovimientoProductoResumen | null;
}

export interface CreateProductoStockMovimientoDto {
  producto_id: string;
  tipo_operacion: ProductoStockOperacionTipo;
  cantidad?: number | null;
  stock_real?: number | null;
  motivo: string;
  venta_id?: string | null;
  venta_detalle_id?: string | null;
}
