export type ActividadTurnoEstado = "activo" | "pausado" | "cancelado";

export type ActividadInscripcionEstado =
  | "inscripto"
  | "lista_espera"
  | "asistio"
  | "ausente"
  | "cancelado";

export interface ActividadBaseOption {
  id: string;
  nombre_actividad: string;
  creado_en?: string | null;
  actualizado_en?: string | null;
}

export interface ActividadSocioOption {
  id_socio: string;
  nombre_completo: string;
  dni?: string | null;
  activo?: boolean | null;
}

export interface ActividadEmpleadoOption {
  id: string;
  nombre_completo: string;
  puesto?: string | null;
  area?: string | null;
  activo?: boolean | null;
}

export interface ActividadUbicacionOption {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  activo?: boolean | null;
  orden?: number | null;
}

export interface ActividadTurno {
  id: string;
  actividad_id: string;
  nombre_turno: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  cupo_maximo: number;
  cupo_minimo?: number | null;
  instructor_id?: string | null;
  ubicacion?: string | null;
  estado: ActividadTurnoEstado;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  observaciones?: string | null;
  creado_en?: string | null;
  actualizado_en?: string | null;
  actividad_nombre?: string | null;
  instructor_nombre?: string | null;
  inscriptos: number;
  lista_espera: number;
  asistencias: number;
  ausencias: number;
  cupos_disponibles: number;
  ocupacion_porcentaje: number;
}

export interface ActividadTurnoInscripcion {
  id: string;
  turno_id: string;
  socio_id: string;
  estado: ActividadInscripcionEstado;
  fecha_inscripcion?: string | null;
  fecha_cancelacion?: string | null;
  fecha_asistencia?: string | null;
  observaciones?: string | null;
  creado_en?: string | null;
  actualizado_en?: string | null;
  turno_nombre?: string | null;
  actividad_nombre?: string | null;
  socio_nombre?: string | null;
  socio_dni?: string | null;
}

export interface ActividadTurnosCuposKpis {
  total_actividades: number;
  total_turnos: number;
  turnos_activos: number;
  cupos_totales: number;
  inscriptos: number;
  lista_espera: number;
  cupos_disponibles: number;
  ocupacion_promedio: number;
  asistencias: number;
  ausencias: number;
}

export interface ActividadChartItem {
  label: string;
  total: number;
}

export interface ActividadTurnosCuposDashboard {
  generated_at: string;
  schema_ready: boolean;
  warnings: string[];
  actividades: ActividadBaseOption[];
  socios: ActividadSocioOption[];
  empleados: ActividadEmpleadoOption[];
  ubicaciones: ActividadUbicacionOption[];
  turnos: ActividadTurno[];
  inscripciones: ActividadTurnoInscripcion[];
  kpis: ActividadTurnosCuposKpis;
  por_dia: ActividadChartItem[];
  por_actividad: ActividadChartItem[];
  por_estado_inscripcion: ActividadChartItem[];
}

export interface ActividadTurnoPayload {
  actividad_id: string;
  nombre_turno: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  cupo_maximo: number;
  cupo_minimo?: number | null;
  instructor_id?: string | null;
  ubicacion?: string | null;
  estado?: ActividadTurnoEstado;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  observaciones?: string | null;
}

export interface ActividadInscripcionPayload {
  turno_id: string;
  socio_id: string;
  estado?: ActividadInscripcionEstado;
  observaciones?: string | null;
}
