import {
  CreateVentaDetalleDto,
  VentaDetalle,
} from './venta_detalle.interface';

export type VentaClienteTipo = 'socio' | 'consumidor_final' | 'visitante';
export type VentaEstado = 'pagada' | 'pendiente' | 'anulada';
export type VentaMetodoPago =
  | 'efectivo'
  | 'transferencia'
  | 'debito'
  | 'credito'
  | 'mercado_pago'
  | 'stripe'
  | 'otro';

export interface VentaSocioResumen {
  socio_id?: string;
  id_socio?: string;
  nombre_completo: string;
}

export interface Venta {
  id: string;
  socio_id?: string | null;
  cliente_tipo?: VentaClienteTipo;
  cliente_nombre?: string | null;
  cliente_documento?: string | null;
  metodo_pago?: VentaMetodoPago;
  estado?: VentaEstado;
  total: number;
  fecha: string;
  activo?: boolean;
  observaciones?: string | null;
  comprobante_codigo?: string | null;
  id_venta_detalle?: string | null;
  venta_detalle?: VentaDetalle[];
  detalles?: VentaDetalle[];
  socio?: VentaSocioResumen | null;
}

export interface CreateVentaDto {
  socio_id?: string | null;
  cliente_tipo: VentaClienteTipo;
  cliente_nombre?: string | null;
  cliente_documento?: string | null;
  fecha?: string;
  metodo_pago?: VentaMetodoPago;
  observaciones?: string | null;
}

export interface CreateVentaConDetalleDto {
  venta: CreateVentaDto;
  venta_detalle?: CreateVentaDetalleDto;
  detalles?: CreateVentaDetalleDto[];
}

export interface UpdateVentaDto {
  socio_id?: string | null;
  cliente_tipo?: VentaClienteTipo;
  cliente_nombre?: string | null;
  cliente_documento?: string | null;
  total?: number;
  fecha?: string;
  metodo_pago?: VentaMetodoPago;
  estado?: VentaEstado;
  activo?: boolean;
  observaciones?: string | null;
  id_venta_detalle?: string | null;
}

export interface ResponseVenta extends Venta {
  venta_detalle: VentaDetalle[];
  socio: VentaSocioResumen | null;
}
