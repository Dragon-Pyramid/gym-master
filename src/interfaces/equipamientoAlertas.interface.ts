export type EstadoAlertaMantenimiento =
  | "vencido"
  | "proximo"
  | "ok"
  | "sin_fecha"
  | "en_mantenimiento"
  | "fuera_de_servicio";

export type SeveridadAlertaMantenimiento = "critica" | "alta" | "media" | "baja" | "ok";

export interface AlertaMantenimientoEquipamiento {
  id: string;
  nombre: string;
  tipo: string | null;
  ubicacion: string | null;
  estado: string | null;
  proxima_revision: string | null;
  dias_para_revision: number | null;
  estado_alerta: EstadoAlertaMantenimiento;
  severidad: SeveridadAlertaMantenimiento;
  mensaje: string;
}

export interface AlertasMantenimientoEquipamientoResumen {
  total: number;
  vencidos: number;
  proximos: number;
  ok: number;
  sin_fecha: number;
  en_mantenimiento: number;
  fuera_de_servicio: number;
}

export interface AlertasMantenimientoEquipamientoResponse {
  generated_at: string;
  umbral_dias: number;
  resumen: AlertasMantenimientoEquipamientoResumen;
  alertas: AlertaMantenimientoEquipamiento[];
  alertas_operativas: AlertaMantenimientoEquipamiento[];
}
