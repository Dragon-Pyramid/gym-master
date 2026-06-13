export interface SocioRankingBonificacionItem {
  socio_id: string;
  nombre_completo: string;
  dni?: string | null;
  email?: string | null;
  activo: boolean;
  fecha_alta?: string | null;
  asistencias: number;
  cuota_al_dia: boolean;
  ultimo_periodo_hasta?: string | null;
  score: number;
  ranking: number;
  bonificado: boolean;
  descuento_porcentaje: number;
  motivo?: string | null;
  observaciones?: string | null;
  generado_en?: string | null;
  bonificacion_bloqueada: boolean;
  bloqueo_motivo?: string | null;
}

export interface SociosRankingBonificacionKpis {
  socios_activos: number;
  socios_con_asistencia: number;
  socios_cuota_al_dia: number;
  bonificados: number;
  asistencia_total: number;
  asistencia_promedio: number;
}

export interface SociosRankingBonificacionResponse {
  generated_at: string;
  anio: number;
  mes: number;
  periodo_desde: string;
  periodo_hasta: string;
  schema_ready: boolean;
  warnings: string[];
  kpis: SociosRankingBonificacionKpis;
  ranking: SocioRankingBonificacionItem[];
  reglas: string[];
}

export interface SocioRankingBonificacionMutationPayload {
  socio_id: string;
  anio: number;
  mes: number;
  bonificado: boolean;
  descuento_porcentaje?: number;
  motivo?: string | null;
  observaciones?: string | null;
}
