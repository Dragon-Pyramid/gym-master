export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  proveedor_id: string;
  id_categoria_producto?: string | null;
  activo: boolean;
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
