export type AforoEstado = "normal" | "medio" | "alto" | "critico";
export type AsistenciaMovimientoTipo = "entrada" | "salida";

export interface AsistenciaMovimientoSocio {
  id_socio: string;
  nombre_completo: string;
  foto?: string | null;
  activo?: boolean | null;
}

export interface AsistenciaMovimientoResumen {
  id: string;
  socio_id: string;
  fecha: string;
  hora_ingreso: string;
  hora_egreso?: string | null;
  tipo_movimiento: AsistenciaMovimientoTipo;
  ultimo_movimiento: string;
  socio?: AsistenciaMovimientoSocio | null;
}

export interface AforoAsistenciaResumen {
  fecha: string;
  hora_actual: string;
  aforo_actual: number;
  capacidad_maxima: number;
  porcentaje_ocupacion: number;
  estado: AforoEstado;
  mensaje_estado: string;
  entradas_hoy: number;
  salidas_hoy: number;
  asistencias_abiertas_antiguas: number;
  socios_dentro: AsistenciaMovimientoResumen[];
  movimientos_recientes: AsistenciaMovimientoResumen[];
}

export interface RegistrarSalidaAsistenciaResponse {
  message: string;
  asistencia: AsistenciaMovimientoResumen;
  aforo?: AforoAsistenciaResumen;
}
