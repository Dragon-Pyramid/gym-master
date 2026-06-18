import type { Equipamento } from '@/interfaces/equipamiento.interface';

export type EquipamientoOrdenTecnicaTipo =
  | 'preventivo'
  | 'correctivo'
  | 'inspeccion'
  | 'reparacion'
  | 'calibracion'
  | 'limpieza_tecnica'
  | 'cambio_pieza';

export type EquipamientoOrdenTecnicaEstado =
  | 'abierta'
  | 'en_progreso'
  | 'completada'
  | 'cancelada'
  | 'vencida';

export type EquipamientoOrdenTecnicaPrioridad = 'baja' | 'media' | 'alta' | 'critica';

export interface EquipamientoPlanPreventivo {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  tipo_equipamiento?: string | null;
  id_tipo_equipamiento?: string | null;
  frecuencia_dias: number;
  criticidad: EquipamientoOrdenTecnicaPrioridad | string;
  activo: boolean;
  creado_en?: string;
  actualizado_en?: string;
  tareas?: EquipamientoPlanTarea[];
}

export interface EquipamientoPlanTarea {
  id: string;
  plan_id: string;
  descripcion: string;
  orden: number;
  requerido: boolean;
  activo: boolean;
}

export interface EquipamientoOrdenTecnica {
  id: string;
  id_equipamiento: string;
  plan_id?: string | null;
  tipo_orden: EquipamientoOrdenTecnicaTipo | string;
  prioridad: EquipamientoOrdenTecnicaPrioridad | string;
  estado: EquipamientoOrdenTecnicaEstado | string;
  titulo: string;
  descripcion?: string | null;
  fecha_programada?: string | null;
  fecha_vencimiento?: string | null;
  fecha_inicio?: string | null;
  fecha_cierre?: string | null;
  tecnico_responsable?: string | null;
  costo_estimado?: number | null;
  costo_real?: number | null;
  resultado?: string | null;
  observaciones?: string | null;
  fotos_antes_urls?: string[] | null;
  fotos_despues_urls?: string[] | null;
  downtime_inicio?: string | null;
  downtime_fin?: string | null;
  registrado_por?: string | null;
  activo: boolean;
  creado_en?: string;
  actualizado_en?: string;
  equipamiento?: Equipamento | null;
  plan?: EquipamientoPlanPreventivo | null;
  tareas?: EquipamientoOrdenTarea[];
}

export interface EquipamientoOrdenTarea {
  id: string;
  orden_id: string;
  descripcion: string;
  estado: 'pendiente' | 'ok' | 'observado' | 'critico' | string;
  observacion?: string | null;
  orden: number;
  activo: boolean;
}

export interface EquipamientoHistorialTecnico {
  id: string;
  id_equipamiento: string;
  orden_id?: string | null;
  tipo_evento: string;
  titulo: string;
  detalle?: string | null;
  costo?: number | null;
  creado_en?: string;
}

export interface EquipamientoPreventivosMetricas {
  totalPlanes: number;
  totalOrdenes: number;
  ordenesAbiertas: number;
  ordenesVencidas: number;
  equiposFueraServicio: number;
  equiposEnMantenimiento: number;
  costoTecnicoMes: number;
  downtimeAbierto: number;
}

export interface EquipamientoPreventivosDashboard {
  generated_at: string;
  equipos: Equipamento[];
  planes: EquipamientoPlanPreventivo[];
  ordenes: EquipamientoOrdenTecnica[];
  historial: EquipamientoHistorialTecnico[];
  metricas: EquipamientoPreventivosMetricas;
}

export interface CreateEquipamientoPlanPreventivoDTO {
  nombre: string;
  codigo?: string | null;
  descripcion?: string | null;
  tipo_equipamiento?: string | null;
  id_tipo_equipamiento?: string | null;
  frecuencia_dias?: number | null;
  criticidad?: EquipamientoOrdenTecnicaPrioridad | string;
  tareas?: string[];
}

export interface CreateEquipamientoOrdenTecnicaDTO {
  id_equipamiento: string;
  plan_id?: string | null;
  tipo_orden?: EquipamientoOrdenTecnicaTipo | string;
  prioridad?: EquipamientoOrdenTecnicaPrioridad | string;
  titulo: string;
  descripcion?: string | null;
  fecha_programada?: string | null;
  fecha_vencimiento?: string | null;
  tecnico_responsable?: string | null;
  costo_estimado?: number | null;
  registrado_por?: string | null;
}

export interface UpdateEquipamientoOrdenTecnicaDTO {
  estado?: EquipamientoOrdenTecnicaEstado | string;
  resultado?: string | null;
  observaciones?: string | null;
  costo_real?: number | null;
  fecha_inicio?: string | null;
  fecha_cierre?: string | null;
  fotos_antes_urls?: string[] | null;
  fotos_despues_urls?: string[] | null;
  downtime_inicio?: string | null;
  downtime_fin?: string | null;
}
