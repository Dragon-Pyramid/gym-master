export interface FinanzasResumenMetricas {
  ingresos_cuotas: number;
  ingresos_ventas: number;
  ingresos_servicios: number;
  ingresos_total: number;
  egresos_compras: number;
  egresos_gastos: number;
  egresos_total: number;
  resultado_neto: number;
  margen_resultado_porcentaje: number | null;
  compromisos_pendientes: number;
  compras_pendientes: number;
  gastos_pendientes: number;
  cantidad_pagos: number;
  cantidad_ventas: number;
  cantidad_compras: number;
  cantidad_gastos: number;
}

export interface FinanzasSerieMensual {
  periodo: string;
  periodo_label: string;
  ingresos_cuotas: number;
  ingresos_ventas: number;
  ingresos_servicios: number;
  ingresos_total: number;
  egresos_compras: number;
  egresos_gastos: number;
  egresos_total: number;
  resultado_neto: number;
}

export interface FinanzasCategoriaResumen {
  categoria: string;
  total: number;
  cantidad: number;
  tipo: 'ingreso' | 'egreso' | 'pendiente';
}

export interface FinanzasDashboardResponse {
  desde: string;
  hasta: string;
  generado_en: string;
  metricas: FinanzasResumenMetricas;
  serie_mensual: FinanzasSerieMensual[];
  ingresos_por_categoria: FinanzasCategoriaResumen[];
  egresos_por_categoria: FinanzasCategoriaResumen[];
  compromisos_por_categoria: FinanzasCategoriaResumen[];
}
