export interface EquipamientoMantenimientoResumen {
  total_equipos: number;
  operativos: number;
  en_mantenimiento: number;
  fuera_de_servicio: number;
  vencidos: number;
  proximos_30_dias: number;
  sin_fecha_revision: number;
  mantenimientos_total: number;
  costo_total_mantenimiento: number;
  costo_ultimos_90_dias: number;
  preventivos_90_dias: number;
  correctivos_90_dias: number;
  equipos_revisar_reemplazo: number;
}

export interface EquipamientoMantenimientoBucket {
  label: string;
  total: number;
  costo?: number;
}

export interface EquipamientoMantenimientoSerieMensual {
  periodo: string;
  costo: number;
  mantenimientos: number;
  correctivos: number;
  preventivos: number;
}

export interface EquipamientoMantenimientoRankingItem {
  id_equipamiento: string;
  nombre: string;
  tipo?: string | null;
  ubicacion?: string | null;
  estado?: string | null;
  total_mantenimientos: number;
  correctivos_180_dias: number;
  costo_total: number;
  costo_180_dias: number;
  ultima_revision?: string | null;
  proxima_revision?: string | null;
  score_reemplazo: number;
  recomendacion: string;
}

export interface EquipamientoMantenimientoReciente {
  id: string;
  id_equipamiento?: string | null;
  equipo_nombre: string;
  equipo_tipo?: string | null;
  equipo_ubicacion?: string | null;
  tipo_mantenimiento?: string | null;
  fecha_mantenimiento?: string | null;
  tecnico_responsable?: string | null;
  costo: number;
  estado?: string | null;
  descripcion?: string | null;
  observaciones?: string | null;
}

export interface EquipamientoMantenimientoBiResponse {
  generated_at: string;
  resumen: EquipamientoMantenimientoResumen;
  por_estado: EquipamientoMantenimientoBucket[];
  por_tipo: EquipamientoMantenimientoBucket[];
  por_ubicacion: EquipamientoMantenimientoBucket[];
  costo_mensual: EquipamientoMantenimientoSerieMensual[];
  top_costo: EquipamientoMantenimientoRankingItem[];
  top_frecuencia: EquipamientoMantenimientoRankingItem[];
  recomendaciones_reemplazo: EquipamientoMantenimientoRankingItem[];
  mantenimientos_recientes: EquipamientoMantenimientoReciente[];
}
