export interface VentaDetalle {
  id: string;
  venta_id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface CreateVentaDetalleDto {
  producto_id: string;
  cantidad: number;
}

export interface UpdateVentaDetalleDto {
  venta_id?: string;
  producto_id?: string;
  cantidad?: number;
  precio_unitario?: number;
  subtotal?: number;
}
