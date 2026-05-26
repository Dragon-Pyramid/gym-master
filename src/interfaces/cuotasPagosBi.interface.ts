export type EstadoCuota = "al_dia" | "vencido" | "sin_pagos" | string;

export interface CuotaEstadoSocioBi {
  id_socio: string;
  nombre_completo: string;
  activo: boolean;
  ultimo_pago: string | null;
  ultimo_vencimiento: string | null;
  periodo_hasta: string | null;
  estado_cuota: EstadoCuota;
  dias_vencido: number;
  metodo_pago: string | null;
  meses_cubiertos: number | null;
}

export interface ResumenEstadoCuotaBi {
  estado_cuota: EstadoCuota;
  cantidad_socios: number;
}

export interface ResumenMetodoPagoBi {
  metodo_pago: string;
  estado: string;
  cantidad_pagos: number;
  total_pagado: number;
}

export interface EvolucionPrecioCuotaBi {
  periodo: string;
  anio: number;
  mes: number;
  monto: number;
}

export interface PagoRecienteBi {
  id: string;
  socio_id: string;
  nombre_completo: string;
  fecha_pago: string;
  periodo_desde: string | null;
  periodo_hasta: string | null;
  meses_cubiertos: number | null;
  metodo_pago: string | null;
  estado: string | null;
  monto_pagado: number;
  descuento_monto?: number | null;
  descuento_porcentaje?: number | null;
}

export interface CuotasPagosDashboardBiResponse {
  generated_at: string;
  resumen_estados: ResumenEstadoCuotaBi[];
  resumen_metodos_pago: ResumenMetodoPagoBi[];
  evolucion_precio_cuota: EvolucionPrecioCuotaBi[];
  pagos_recientes: PagoRecienteBi[];
  socios_vencidos: CuotaEstadoSocioBi[];
  socios_sin_pagos: CuotaEstadoSocioBi[];
  kpis: {
    socios_al_dia: number;
    socios_vencidos: number;
    socios_sin_pagos: number;
    total_pagado: number;
    total_efectivo: number;
    total_stripe: number;
    cantidad_pagos: number;
  };
}
