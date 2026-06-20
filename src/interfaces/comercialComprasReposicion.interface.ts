import type { Producto } from './producto.interface';
import type { Proveedor } from './proveedor.interface';
import type { ComercialUbicacionStock } from './comercialStockLedger.interface';

export type ComercialOrdenCompraEstado = 'borrador' | 'pedida' | 'parcial' | 'recibida' | 'anulada';

export interface ComercialProveedorProducto {
  id: string;
  producto_id: string;
  proveedor_id: string;
  sku_proveedor?: string | null;
  costo_unitario: number;
  moneda: 'ARS' | 'USD';
  compra_minima: number;
  lead_time_dias: number;
  principal: boolean;
  activo: boolean;
  notas?: string | null;
  creado_en?: string | null;
  actualizado_en?: string | null;
  producto?: Pick<Producto, 'id' | 'nombre' | 'sku' | 'codigo_barras' | 'costo' | 'precio' | 'stock'> | null;
  proveedor?: Pick<Proveedor, 'id' | 'nombre' | 'razon_social' | 'estado'> | null;
}

export interface ComercialReposicionSugeridaItem {
  producto_id: string;
  producto_nombre: string;
  sku?: string | null;
  codigo_barras?: string | null;
  precio: number;
  costo_actual: number;
  stock_total: number;
  stock_minimo: number;
  stock_objetivo: number;
  cantidad_sugerida: number;
  proveedor_sugerido_id?: string | null;
  proveedor_sugerido_nombre?: string | null;
  costo_sugerido: number;
  compra_minima: number;
  lead_time_dias: number;
  costo_estimado_reposicion: number;
  estado_stock: 'sin_stock' | 'critico' | 'bajo_minimo' | 'ok';
}

export interface ComercialOrdenCompraDetalle {
  id: string;
  orden_compra_id: string;
  producto_id: string;
  cantidad_solicitada: number;
  cantidad_recibida: number;
  costo_unitario: number;
  subtotal_estimado: number;
  creado_en?: string | null;
  actualizado_en?: string | null;
  producto?: Pick<Producto, 'id' | 'nombre' | 'sku' | 'codigo_barras' | 'costo' | 'precio' | 'stock'> | null;
}

export interface ComercialOrdenCompra {
  id: string;
  proveedor_id: string;
  numero_orden: string;
  estado: ComercialOrdenCompraEstado;
  fecha_orden: string;
  fecha_estimada_recepcion?: string | null;
  ubicacion_destino_id?: string | null;
  observaciones?: string | null;
  total_estimado: number;
  creado_por?: string | null;
  recibido_por?: string | null;
  recibido_en?: string | null;
  creado_en?: string | null;
  actualizado_en?: string | null;
  proveedor?: Pick<Proveedor, 'id' | 'nombre' | 'razon_social' | 'estado'> | null;
  ubicacion_destino?: ComercialUbicacionStock | null;
  detalles?: ComercialOrdenCompraDetalle[];
  comercial_orden_compra_detalle?: ComercialOrdenCompraDetalle[];
}

export interface ComercialComprasReposicionMetricas {
  productosAReponer: number;
  costoReposicionSugerida: number;
  ordenesAbiertas: number;
  ordenesParciales: number;
  proveedoresActivos: number;
}

export interface ComercialComprasReposicionDashboard {
  proveedores: Proveedor[];
  productos: Producto[];
  ubicaciones: ComercialUbicacionStock[];
  relaciones: ComercialProveedorProducto[];
  reposicionSugerida: ComercialReposicionSugeridaItem[];
  ordenes: ComercialOrdenCompra[];
  metricas: ComercialComprasReposicionMetricas;
}

export interface UpsertProveedorProductoDTO {
  producto_id: string;
  proveedor_id: string;
  costo_unitario: number;
  sku_proveedor?: string | null;
  compra_minima?: number | null;
  lead_time_dias?: number | null;
  principal?: boolean | null;
  notas?: string | null;
}

export interface CreateOrdenCompraDetalleDTO {
  producto_id: string;
  cantidad_solicitada: number;
  costo_unitario: number;
}

export interface CreateOrdenCompraDTO {
  proveedor_id: string;
  fecha_orden?: string | null;
  fecha_estimada_recepcion?: string | null;
  ubicacion_destino_id?: string | null;
  observaciones?: string | null;
  detalles: CreateOrdenCompraDetalleDTO[];
}

export interface RecibirOrdenCompraDetalleDTO {
  detalle_id: string;
  cantidad_recibir: number;
}

export interface RecibirOrdenCompraDTO {
  orden_compra_id: string;
  ubicacion_destino_id?: string | null;
  observaciones?: string | null;
  detalles: RecibirOrdenCompraDetalleDTO[];
}
