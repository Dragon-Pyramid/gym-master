export type EstadoCuotaValor = 'al_dia' | 'vencido' | 'sin_pagos';

export interface EstadoCuotaSocio {
  id_socio: string;
  nombre_completo: string;
  activo: boolean;
  ultimo_pago: string | null;
  ultimo_vencimiento: string | null;
  periodo_hasta: string | null;
  estado_cuota: EstadoCuotaValor;
  dias_vencido: number;
  metodo_pago: string | null;
  meses_cubiertos: number | null;
}

export interface ResumenEstadoCuotas {
  total_socios: number;
  al_dia: number;
  vencidos: number;
  sin_pagos: number;
  proximos_a_vencer: number;
}

export interface ResumenPagoPorMetodo {
  metodo_pago: string;
  estado: string;
  cantidad: number;
  total_pagado: number;
}

export interface AdminCuotasEstadoResponse {
  resumen: ResumenEstadoCuotas;
  socios: EstadoCuotaSocio[];
  vencidos: EstadoCuotaSocio[];
  sin_pagos: EstadoCuotaSocio[];
  proximos_vencer: EstadoCuotaSocio[];
  pagos_por_metodo: ResumenPagoPorMetodo[];
}
