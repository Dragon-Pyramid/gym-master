export interface ComercialPackVentaComponente {
  item_tipo: 'producto' | 'servicio';
  producto_id?: string | null;
  servicio_id?: string | null;
  nombre: string;
  cantidad: number;
  precio_referencia?: number | null;
}

export interface ComercialPackVentaRegistro {
  id: string;
  venta_id: string;
  pack_id?: string | null;
  pack_codigo: string;
  pack_nombre: string;
  cantidad: number;
  precio_unitario: number;
  descuento_pack: number;
  total_pack: number;
  cupon_id?: string | null;
  cupon_codigo?: string | null;
  promocion_id?: string | null;
  promocion_nombre?: string | null;
  descuento_cupon_estimado: number;
  componentes: ComercialPackVentaComponente[];
  creado_en?: string | null;
  actualizado_en?: string | null;
  venta?: {
    id: string;
    fecha?: string | null;
    total?: number | null;
    estado?: string | null;
    activo?: boolean | null;
    cliente_tipo?: string | null;
    cliente_nombre?: string | null;
    cliente_documento?: string | null;
    metodo_pago?: string | null;
    comprobante_codigo?: string | null;
    creado_en?: string | null;
  } | null;
}

export interface ComercialPackAnalyticsTopPack {
  pack_id?: string | null;
  pack_codigo: string;
  pack_nombre: string;
  cantidad_vendida: number;
  ventas: number;
  ingreso_total: number;
  descuento_cupon_estimado: number;
  ultima_venta?: string | null;
}

export interface ComercialPackAnalyticsCuponUso {
  cupon_id?: string | null;
  cupon_codigo: string;
  promocion_id?: string | null;
  promocion_nombre?: string | null;
  usos: number;
  packs_vendidos: number;
  descuento_estimado: number;
  ingreso_asociado: number;
}

export interface ComercialPackAnalyticsMes {
  periodo: string;
  packs_vendidos: number;
  ventas: number;
  ingreso_total: number;
  descuento_cupon_estimado: number;
}

export interface ComercialPackAnalyticsDashboard {
  registros: ComercialPackVentaRegistro[];
  topPacks: ComercialPackAnalyticsTopPack[];
  cupones: ComercialPackAnalyticsCuponUso[];
  mensual: ComercialPackAnalyticsMes[];
  metricas: {
    ventasConPack: number;
    packsVendidos: number;
    ingresoPacks: number;
    ticketPromedioPack: number;
    descuentoCuponEstimado: number;
    packsDistintos: number;
    cuponesUsados: number;
  };
  filtros: {
    desde?: string | null;
    hasta?: string | null;
  };
}
