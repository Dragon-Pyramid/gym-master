export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  proveedor_id: string;
  id_categoria_producto?: string | null;
  activo: boolean;

  // Campos previstos para la evolución comercial/stock.
  // Son opcionales para mantener compatibilidad con la base actual.
  stock_minimo?: number | null;
  stock_critico?: number | null;
  sku?: string | null;
  codigo_barras?: string | null;
  marca?: string | null;
  presentacion?: string | null;
  unidad_medida?: string | null;
  costo?: number | null;
  imagen_url?: string | null;
}

export interface ProductoPrecioCostoHistorial {
  id: string;
  producto_id: string;
  precio_anterior: number | null;
  precio_nuevo: number;
  costo_anterior: number | null;
  costo_nuevo: number;
  moneda: 'ARS' | 'USD';
  cotizacion_usada?: number | null;
  margen_anterior?: number | null;
  margen_nuevo?: number | null;
  margen_porcentaje_nuevo?: number | null;
  motivo?: string | null;
  fecha_vigencia?: string | null;
  usuario_responsable?: string | null;
  origen: 'manual' | 'sistema' | 'importado';
  creado_en: string;
}


export interface CreateProductoDto {
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  proveedor_id: string;
  id_categoria_producto?: string | null;
  costo?: number | null;
  stock_minimo?: number | null;
  motivo_cambio_precio?: string | null;
  moneda_historial?: 'ARS' | 'USD';
  cotizacion_usada?: number | null;
  fecha_vigencia?: string | null;
}


export interface UpdateProductoDto {
  nombre?: string;
  descripcion?: string;
  precio?: number;
  stock?: number;
  proveedor_id?: string;
  id_categoria_producto?: string | null;
  activo?: boolean;
  costo?: number | null;
  stock_minimo?: number | null;
  motivo_cambio_precio?: string | null;
  moneda_historial?: 'ARS' | 'USD';
  cotizacion_usada?: number | null;
  fecha_vigencia?: string | null;
}

