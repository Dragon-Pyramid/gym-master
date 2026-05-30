export type VentaDetalleItemTipo = 'producto' | 'servicio';

export interface VentaDetalleItemResumen {
  id: string;
  nombre: string;
}

export interface VentaDetalle {
  id: string;
  venta_id: string;
  item_tipo: VentaDetalleItemTipo;
  producto_id?: string | null;
  servicio_id?: string | null;
  cantidad: number;
  precio_unitario: number;
  descuento?: number | null;
  subtotal: number;
  total_linea?: number | null;
  producto?: VentaDetalleItemResumen | null;
  servicio?: VentaDetalleItemResumen | null;
}

export interface CreateVentaDetalleDto {
  item_tipo?: VentaDetalleItemTipo;
  producto_id?: string | null;
  servicio_id?: string | null;
  cantidad: number;
  precio_unitario?: number;
  descuento?: number;
}

export interface UpdateVentaDetalleDto {
  venta_id?: string;
  item_tipo?: VentaDetalleItemTipo;
  producto_id?: string | null;
  servicio_id?: string | null;
  cantidad?: number;
  precio_unitario?: number;
  descuento?: number;
}
