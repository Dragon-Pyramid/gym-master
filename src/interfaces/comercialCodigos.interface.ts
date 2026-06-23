export type ComercialCodigoTargetType = 'producto' | 'servicio' | 'pack';

export interface ComercialCodigoLabelItem {
  id: string;
  target_type: ComercialCodigoTargetType;
  nombre: string;
  descripcion?: string | null;
  precio?: number | null;
  codigo_principal?: string | null;
  sku?: string | null;
  codigo_barras?: string | null;
  qr_codigo?: string | null;
  qr_id?: string | null;
  activo?: boolean | null;
  subtitulo?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface ComercialCodigosLabelsDashboard {
  generated_at: string;
  productos: ComercialCodigoLabelItem[];
  servicios: ComercialCodigoLabelItem[];
  packs: ComercialCodigoLabelItem[];
  qrCodes: Array<{
    id: string;
    codigo: string;
    target_type: string;
    target_id: string;
    titulo: string;
    route: string;
    metadata?: Record<string, unknown> | null;
    activo: boolean;
  }>;
  metricas: {
    productosConCodigo: number;
    productosSinCodigo: number;
    serviciosConCodigo: number;
    serviciosSinCodigo: number;
    packsConCodigo: number;
    etiquetasQrGeneradas: number;
  };
}

export interface GenerateComercialQrCodeDTO {
  target_type: ComercialCodigoTargetType;
  target_id: string;
  codigo?: string | null;
  titulo?: string | null;
}
