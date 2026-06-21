import type { Producto } from './producto.interface';
import type { Servicio } from './servicio.interface';

export type ComercialPackItemTipo = 'producto' | 'servicio';
export type ComercialPromocionTipo = 'descuento_porcentaje' | 'descuento_fijo' | 'combo' | 'beneficio';

export interface ComercialCanalVenta {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
  orden: number;
}

export interface ComercialGrupoCliente {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
  orden: number;
}

export interface ComercialPackItem {
  id: string;
  pack_id: string;
  item_tipo: ComercialPackItemTipo;
  producto_id?: string | null;
  servicio_id?: string | null;
  cantidad: number;
  precio_referencia: number;
  producto?: Pick<Producto, 'id' | 'nombre' | 'precio' | 'stock'> | null;
  servicio?: Pick<Servicio, 'id' | 'nombre' | 'precio' | 'categoria'> | null;
}

export interface ComercialPack {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  vigencia_dias?: number | null;
  canal_venta_id?: string | null;
  grupo_cliente_id?: string | null;
  activo: boolean;
  disponible_pos: boolean;
  disponible_online: boolean;
  creado_en?: string | null;
  actualizado_en?: string | null;
  canal?: ComercialCanalVenta | null;
  grupo_cliente?: ComercialGrupoCliente | null;
  items?: ComercialPackItem[];
  comercial_pack_item?: ComercialPackItem[];
}

export interface ComercialPromocion {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  tipo: ComercialPromocionTipo;
  valor: number;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  canal_venta_id?: string | null;
  grupo_cliente_id?: string | null;
  activo: boolean;
  acumulable: boolean;
  max_usos?: number | null;
  creado_en?: string | null;
  actualizado_en?: string | null;
  canal?: ComercialCanalVenta | null;
  grupo_cliente?: ComercialGrupoCliente | null;
}

export interface ComercialCupon {
  id: string;
  promocion_id: string;
  codigo: string;
  max_usos?: number | null;
  usos_actuales: number;
  fecha_expiracion?: string | null;
  activo: boolean;
  promocion?: Pick<ComercialPromocion, 'id' | 'codigo' | 'nombre' | 'tipo' | 'valor'> | null;
}

export interface ComercialItemUnificado {
  source_id: string;
  item_tipo: 'producto' | 'servicio' | 'pack';
  nombre: string;
  descripcion?: string | null;
  precio: number;
  costo: number;
  stock?: number | null;
  activo: boolean;
  disponible_pos: boolean;
  disponible_online: boolean;
}

export interface ComercialServiciosPromocionesDashboard {
  productos: Producto[];
  servicios: Servicio[];
  canales: ComercialCanalVenta[];
  grupos: ComercialGrupoCliente[];
  packs: ComercialPack[];
  promociones: ComercialPromocion[];
  cupones: ComercialCupon[];
  items: ComercialItemUnificado[];
  metricas: {
    serviciosActivos: number;
    packsActivos: number;
    promocionesActivas: number;
    cuponesActivos: number;
    itemsVendibles: number;
  };
}

export interface CreateComercialPackItemDTO {
  item_tipo: ComercialPackItemTipo;
  producto_id?: string | null;
  servicio_id?: string | null;
  cantidad: number;
  precio_referencia?: number | null;
}

export interface CreateComercialPackDTO {
  codigo?: string | null;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  vigencia_dias?: number | null;
  canal_venta_id?: string | null;
  grupo_cliente_id?: string | null;
  disponible_pos?: boolean | null;
  disponible_online?: boolean | null;
  items: CreateComercialPackItemDTO[];
}

export interface CreateComercialPromocionDTO {
  codigo?: string | null;
  nombre: string;
  descripcion?: string | null;
  tipo: ComercialPromocionTipo;
  valor: number;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  canal_venta_id?: string | null;
  grupo_cliente_id?: string | null;
  acumulable?: boolean | null;
  max_usos?: number | null;
}

export interface CreateComercialCuponDTO {
  promocion_id: string;
  codigo: string;
  max_usos?: number | null;
  fecha_expiracion?: string | null;
}
