export type OtrosGastosEstado = 'pendiente' | 'pagado' | 'vencido' | 'anulado';
export type OtrosGastosMedioPago =
  | 'efectivo'
  | 'transferencia'
  | 'tarjeta_debito'
  | 'tarjeta_credito'
  | 'mercado_pago'
  | 'stripe'
  | 'otro';

export interface TipoGastoLite {
  id: string;
  codigo?: string | null;
  nombre: string;
  descripcion?: string | null;
  activo?: boolean | null;
}

export interface OtrosGastos {
  id: string;
  descripcion: string;
  monto: number;
  fecha: string;
  activo: boolean;
  id_tipo_gasto?: string | null;
  estado?: OtrosGastosEstado | null;
  medio_pago?: OtrosGastosMedioPago | null;
  proveedor_nombre?: string | null;
  entidad?: string | null;
  numero_comprobante?: string | null;
  comprobante_url?: string | null;
  comprobante_nombre?: string | null;
  comprobante_mime_type?: string | null;
  fecha_vencimiento?: string | null;
  fecha_pago?: string | null;
  periodo_desde?: string | null;
  periodo_hasta?: string | null;
  observaciones?: string | null;
  registrado_por?: string | null;
  creado_en?: string | null;
  actualizado_en?: string | null;
  tipo_gasto?: TipoGastoLite | null;
}

export interface CreateOtrosGastosDto {
  descripcion: string;
  monto: number;
  fecha: string;
  id_tipo_gasto?: string | null;
  estado?: OtrosGastosEstado;
  medio_pago?: OtrosGastosMedioPago;
  proveedor_nombre?: string | null;
  entidad?: string | null;
  numero_comprobante?: string | null;
  comprobante_url?: string | null;
  comprobante_nombre?: string | null;
  comprobante_mime_type?: string | null;
  fecha_vencimiento?: string | null;
  fecha_pago?: string | null;
  periodo_desde?: string | null;
  periodo_hasta?: string | null;
  observaciones?: string | null;
}

export interface UpdateOtrosGastosDto extends Partial<CreateOtrosGastosDto> {
  activo?: boolean;
}

export interface OtrosGastosComprobanteUploadResponse {
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
}
