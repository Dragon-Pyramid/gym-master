import { Producto } from './producto.interface';
import { Proveedor } from './proveedor.interface';

export type CompraEstado = 'pendiente' | 'pagada' | 'anulada';
export type CompraMedioPago = 'efectivo' | 'transferencia' | 'mercado_pago' | 'stripe' | 'otro';

export interface CompraDetalle {
  id: string;
  compra_id: string;
  producto_id: string;
  cantidad: number;
  costo_unitario: number;
  subtotal: number;
  creado_en?: string | null;
  producto?: Pick<Producto, 'id' | 'nombre' | 'stock' | 'costo' | 'precio'> | null;
}

export interface Compra {
  id: string;
  proveedor_id: string;
  fecha: string;
  estado: CompraEstado;
  medio_pago: CompraMedioPago;
  numero_comprobante?: string | null;
  observaciones?: string | null;
  total: number;
  activo: boolean;
  registrado_por?: string | null;
  creado_en?: string | null;
  actualizado_en?: string | null;
  proveedor?: Pick<Proveedor, 'id' | 'nombre' | 'razon_social' | 'identificacion_fiscal' | 'estado'> | null;
  compra_detalle?: CompraDetalle[];
  detalles?: CompraDetalle[];
}

export interface CreateCompraDetalleDto {
  producto_id: string;
  cantidad: number;
  costo_unitario: number;
}

export interface CreateCompraDto {
  proveedor_id: string;
  fecha: string;
  estado?: CompraEstado;
  medio_pago?: CompraMedioPago;
  numero_comprobante?: string | null;
  observaciones?: string | null;
  detalles: CreateCompraDetalleDto[];
}

export interface UpdateCompraDto {
  estado?: CompraEstado;
  observaciones?: string | null;
}
