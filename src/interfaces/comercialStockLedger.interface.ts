export type ComercialStockMovimientoTipo =
  | 'compra'
  | 'venta'
  | 'ajuste_entrada'
  | 'ajuste_salida'
  | 'transferencia'
  | 'devolucion'
  | 'merma'
  | 'vencimiento'
  | 'conteo_fisico'
  | 'uso_interno';

export type ComercialStockLedgerTab = 'resumen' | 'movimientos' | 'ubicaciones';

export interface ComercialUbicacionStock {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  tipo?: string | null;
  activo: boolean;
  orden: number;
  creado_en?: string | null;
  actualizado_en?: string | null;
}

export interface ComercialProductoStockUbicacion {
  id: string;
  producto_id: string;
  ubicacion_id: string;
  cantidad: number;
  stock_minimo?: number | null;
  stock_objetivo?: number | null;
  actualizado_en?: string | null;
  producto?: {
    id: string;
    nombre: string;
    sku?: string | null;
    codigo_barras?: string | null;
    precio?: number | null;
    costo?: number | null;
    stock?: number | null;
    activo?: boolean | null;
  } | null;
  ubicacion?: ComercialUbicacionStock | null;
}

export interface ComercialStockMovimiento {
  id: string;
  producto_id: string;
  tipo: ComercialStockMovimientoTipo;
  cantidad: number;
  ubicacion_origen_id?: string | null;
  ubicacion_destino_id?: string | null;
  stock_anterior_total: number;
  stock_nuevo_total: number;
  costo_unitario?: number | null;
  precio_unitario?: number | null;
  motivo?: string | null;
  referencia_tipo?: string | null;
  referencia_id?: string | null;
  creado_por?: string | null;
  creado_en?: string | null;
  producto?: {
    id: string;
    nombre: string;
    sku?: string | null;
    codigo_barras?: string | null;
  } | null;
  ubicacion_origen?: ComercialUbicacionStock | null;
  ubicacion_destino?: ComercialUbicacionStock | null;
}

export interface ComercialStockResumenItem {
  producto_id: string;
  producto_nombre: string;
  sku?: string | null;
  codigo_barras?: string | null;
  precio: number;
  costo: number;
  stock_total: number;
  stock_minimo: number;
  stock_objetivo: number;
  ubicaciones_count: number;
  valor_inventario: number;
  margen_unitario: number;
  estado_stock: 'sin_stock' | 'critico' | 'bajo_minimo' | 'ok';
}

export interface ComercialStockLedgerDashboard {
  ubicaciones: ComercialUbicacionStock[];
  stockPorUbicacion: ComercialProductoStockUbicacion[];
  movimientos: ComercialStockMovimiento[];
  resumen: ComercialStockResumenItem[];
  metricas: {
    productos: number;
    productosSinStock: number;
    productosCriticos: number;
    stockTotal: number;
    valorInventario: number;
    movimientos: number;
    ubicacionesActivas: number;
  };
}

export interface CreateComercialStockMovimientoDTO {
  producto_id: string;
  tipo: ComercialStockMovimientoTipo;
  cantidad?: number | null;
  stock_real?: number | null;
  ubicacion_origen_id?: string | null;
  ubicacion_destino_id?: string | null;
  motivo: string;
  costo_unitario?: number | null;
  precio_unitario?: number | null;
  referencia_tipo?: string | null;
  referencia_id?: string | null;
}
