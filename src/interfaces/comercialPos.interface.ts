import type { VentaClienteTipo, VentaMetodoPago } from './venta.interface';

export interface ComercialPosUbicacion {
  id: string;
  codigo: string;
  nombre: string;
  tipo?: string | null;
  activo?: boolean | null;
}

export interface ComercialPosProducto {
  producto_id: string;
  producto_nombre: string;
  sku?: string | null;
  codigo_barras?: string | null;
  precio: number;
  costo: number;
  stock_total: number;
  stock_minimo: number;
  stock_objetivo: number;
  valor_inventario: number;
  margen_unitario: number;
  estado_stock: 'sin_stock' | 'critico' | 'bajo_minimo' | 'ok';
}

export interface ComercialPosStockUbicacion {
  id: string;
  producto_id: string;
  ubicacion_id: string;
  cantidad: number;
  ubicacion?: ComercialPosUbicacion | null;
}

export interface ComercialPosVentaDetalle {
  id: string;
  item_tipo: 'producto' | 'servicio';
  producto_id?: string | null;
  servicio_id?: string | null;
  cantidad: number;
  precio_unitario: number;
  descuento: number;
  subtotal?: number | null;
  total_linea?: number | null;
  producto?: { id: string; nombre: string } | null;
  servicio?: { id: string; nombre: string } | null;
}

export interface ComercialPosVentaResumen {
  id: string;
  cliente_tipo: VentaClienteTipo;
  cliente_nombre?: string | null;
  cliente_documento?: string | null;
  metodo_pago: VentaMetodoPago;
  total: number;
  fecha: string;
  comprobante_codigo?: string | null;
  estado?: string | null;
  creado_en?: string | null;
  venta_detalle?: ComercialPosVentaDetalle[];
  detalles?: ComercialPosVentaDetalle[];
}

export interface ComercialPosDashboard {
  productos: ComercialPosProducto[];
  stockPorUbicacion: ComercialPosStockUbicacion[];
  ubicaciones: ComercialPosUbicacion[];
  ventasRecientes: ComercialPosVentaResumen[];
  ubicacionDefaultId?: string | null;
  metricas: {
    ventasHoy: number;
    totalHoy: number;
    itemsHoy: number;
    productosDisponibles: number;
    productosCriticos: number;
  };
}

export interface CreateComercialPosVentaItemDTO {
  item_tipo?: 'producto' | 'servicio';
  producto_id?: string | null;
  servicio_id?: string | null;
  cantidad: number;
  precio_unitario?: number | null;
  descuento?: number | null;
}

export interface CreateComercialPosVentaDTO {
  cliente_tipo: VentaClienteTipo;
  cliente_nombre?: string | null;
  cliente_documento?: string | null;
  metodo_pago: VentaMetodoPago;
  observaciones?: string | null;
  ubicacion_stock_id?: string | null;
  items: CreateComercialPosVentaItemDTO[];
}
