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

export interface CreateProductoDto {
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  proveedor_id: string;
  id_categoria_producto?: string | null;
}

export interface UpdateProductoDto {
  nombre?: string;
  descripcion?: string;
  precio?: number;
  stock?: number;
  proveedor_id?: string;
  id_categoria_producto?: string | null;
  activo?: boolean;
}
