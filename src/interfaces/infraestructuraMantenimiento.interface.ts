export type InfraestructuraSectorTipo =
  | 'edificio'
  | 'piso'
  | 'salon'
  | 'bano'
  | 'ducha'
  | 'deposito'
  | 'recepcion'
  | 'oficina'
  | 'pasillo'
  | 'patio'
  | 'sala_maquinas'
  | 'otro';

export type InfraestructuraCriticidad = 'baja' | 'media' | 'alta' | 'critica';

export type InfraestructuraActivoEstado =
  | 'operativo'
  | 'en_mantenimiento'
  | 'fuera_de_servicio'
  | 'vencido'
  | 'dado_de_baja';

export type MantenimientoEdilicioTipoOrden =
  | 'correctivo'
  | 'preventivo'
  | 'inspeccion'
  | 'cambio'
  | 'vencimiento'
  | 'certificacion';

export type MantenimientoEdilicioEstadoOrden =
  | 'abierta'
  | 'en_progreso'
  | 'completada'
  | 'cancelada'
  | 'vencida';

export type InfraestructuraDocumentoTipo =
  | 'certificado'
  | 'garantia'
  | 'factura'
  | 'foto'
  | 'manual'
  | 'inspeccion'
  | 'otro';

export interface InfraestructuraSector {
  id: string;
  nombre: string;
  codigo?: string | null;
  tipo: InfraestructuraSectorTipo | string;
  descripcion?: string | null;
  parent_id?: string | null;
  piso?: number | null;
  superficie_m2?: number | null;
  capacidad?: number | null;
  ubicacion_referencia?: string | null;
  activo: boolean;
  creado_en?: string;
  actualizado_en?: string;
}

export interface InfraestructuraCategoriaActivo {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  tipo_general?: string | null;
  vida_util_meses?: number | null;
  frecuencia_mantenimiento_dias?: number | null;
  requiere_vencimiento?: boolean | null;
  requiere_certificado?: boolean | null;
  criticidad_sugerida?: InfraestructuraCriticidad | string | null;
  activo: boolean;
  orden?: number | null;
}

export interface InfraestructuraActivo {
  id: string;
  codigo: string;
  nombre: string;
  categoria_id?: string | null;
  sector_id?: string | null;
  descripcion?: string | null;
  marca?: string | null;
  modelo?: string | null;
  nro_serie?: string | null;
  proveedor_id?: string | null;
  fecha_adquisicion?: string | null;
  fecha_instalacion?: string | null;
  costo_adquisicion?: number | null;
  vida_util_meses?: number | null;
  valor_residual?: number | null;
  estado: InfraestructuraActivoEstado | string;
  criticidad: InfraestructuraCriticidad | string;
  fecha_ultimo_mantenimiento?: string | null;
  fecha_proximo_mantenimiento?: string | null;
  fecha_vencimiento?: string | null;
  requiere_certificado?: boolean | null;
  certificado_url?: string | null;
  imagen_url?: string | null;
  documento_url?: string | null;
  observaciones?: string | null;
  metadata?: Record<string, unknown> | null;
  activo: boolean;
  creado_en?: string;
  actualizado_en?: string;
  sector?: InfraestructuraSector | null;
  categoria?: InfraestructuraCategoriaActivo | null;
}

export interface MantenimientoEdilicioOrden {
  id: string;
  activo_id?: string | null;
  sector_id?: string | null;
  tipo_orden: MantenimientoEdilicioTipoOrden | string;
  prioridad: InfraestructuraCriticidad | string;
  estado: MantenimientoEdilicioEstadoOrden | string;
  titulo: string;
  descripcion?: string | null;
  fecha_programada?: string | null;
  fecha_vencimiento?: string | null;
  fecha_inicio?: string | null;
  fecha_cierre?: string | null;
  tecnico_responsable?: string | null;
  proveedor_id?: string | null;
  costo_estimado?: number | null;
  costo_real?: number | null;
  observaciones?: string | null;
  resultado?: string | null;
  requiere_certificado?: boolean | null;
  certificado_url?: string | null;
  fotos_antes_urls?: string[] | null;
  fotos_despues_urls?: string[] | null;
  registrado_por?: string | null;
  activo: boolean;
  creado_en?: string;
  actualizado_en?: string;
  infraestructura_activo?: InfraestructuraActivo | null;
  infraestructura_sector?: InfraestructuraSector | null;
}

export interface MantenimientoEdilicioDocumento {
  id: string;
  activo_id?: string | null;
  orden_id?: string | null;
  tipo: InfraestructuraDocumentoTipo | string;
  titulo: string;
  url: string;
  descripcion?: string | null;
  fecha_emision?: string | null;
  fecha_vencimiento?: string | null;
  emitido_por?: string | null;
  activo: boolean;
  creado_en?: string;
}


export type InfraestructuraQrTargetType =
  | 'infra_activo'
  | 'infra_sector'
  | 'edilicio_orden'
  | 'equipamiento'
  | 'producto'
  | 'servicio';

export type InfraestructuraChecklistResultado = 'ok' | 'observado' | 'critico';

export interface InfraestructuraQrCodigo {
  id: string;
  codigo: string;
  target_type: InfraestructuraQrTargetType | string;
  target_id: string;
  titulo: string;
  route: string;
  metadata?: Record<string, unknown> | null;
  activo: boolean;
  creado_en?: string;
  actualizado_en?: string;
}

export interface InfraestructuraChecklistItem {
  id: string;
  template_id: string;
  texto: string;
  tipo_respuesta: 'ok_observado_critico' | 'si_no' | 'texto' | string;
  requerido: boolean;
  orden: number;
  activo: boolean;
}

export interface InfraestructuraChecklistTemplate {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  ambito: 'activo' | 'sector' | 'categoria' | 'general' | string;
  categoria_id?: string | null;
  frecuencia_dias?: number | null;
  activo: boolean;
  orden?: number | null;
  items?: InfraestructuraChecklistItem[];
}

export interface InfraestructuraChecklistRespuesta {
  id: string;
  ejecucion_id: string;
  item_id: string;
  resultado: InfraestructuraChecklistResultado | string;
  observacion?: string | null;
  foto_url?: string | null;
  creado_en?: string;
  item?: InfraestructuraChecklistItem | null;
}

export interface InfraestructuraChecklistEjecucion {
  id: string;
  template_id: string;
  activo_id?: string | null;
  sector_id?: string | null;
  orden_id?: string | null;
  resultado_general: InfraestructuraChecklistResultado | string;
  notas?: string | null;
  foto_antes_url?: string | null;
  foto_despues_url?: string | null;
  ejecutado_por?: string | null;
  ejecutado_en?: string;
  activo: boolean;
  template?: InfraestructuraChecklistTemplate | null;
  infraestructura_activo?: InfraestructuraActivo | null;
  infraestructura_sector?: InfraestructuraSector | null;
  mantenimiento_edilicio_orden?: MantenimientoEdilicioOrden | null;
  respuestas?: InfraestructuraChecklistRespuesta[];
}

export interface InfraestructuraQrResolveResult {
  found: boolean;
  codigo?: string;
  target_type?: InfraestructuraQrTargetType | string;
  target_id?: string;
  titulo?: string;
  route?: string;
  metadata?: Record<string, unknown> | null;
}

export interface InfraestructuraMantenimientoMetricas {
  totalSectores: number;
  totalActivos: number;
  activosCriticos: number;
  activosVencidos: number;
  activosProximosVencer: number;
  ordenesAbiertas: number;
  ordenesVencidas: number;
  costoOrdenesMes: number;
}

export interface InfraestructuraMantenimientoDashboard {
  generated_at: string;
  sectores: InfraestructuraSector[];
  categorias: InfraestructuraCategoriaActivo[];
  activos: InfraestructuraActivo[];
  ordenes: MantenimientoEdilicioOrden[];
  alertas: InfraestructuraActivo[];
  checklists: InfraestructuraChecklistTemplate[];
  checklistEjecuciones: InfraestructuraChecklistEjecucion[];
  qrCodes: InfraestructuraQrCodigo[];
  metricas: InfraestructuraMantenimientoMetricas;
}

export interface CreateInfraestructuraSectorDTO {
  nombre: string;
  codigo?: string | null;
  tipo?: InfraestructuraSectorTipo | string;
  descripcion?: string | null;
  parent_id?: string | null;
  piso?: number | null;
  superficie_m2?: number | null;
  capacidad?: number | null;
  ubicacion_referencia?: string | null;
}

export interface CreateInfraestructuraActivoDTO {
  nombre: string;
  codigo?: string | null;
  categoria_id?: string | null;
  sector_id?: string | null;
  descripcion?: string | null;
  marca?: string | null;
  modelo?: string | null;
  nro_serie?: string | null;
  fecha_adquisicion?: string | null;
  fecha_instalacion?: string | null;
  costo_adquisicion?: number | null;
  vida_util_meses?: number | null;
  valor_residual?: number | null;
  estado?: InfraestructuraActivoEstado | string;
  criticidad?: InfraestructuraCriticidad | string;
  fecha_proximo_mantenimiento?: string | null;
  fecha_vencimiento?: string | null;
  requiere_certificado?: boolean | null;
  certificado_url?: string | null;
  imagen_url?: string | null;
  documento_url?: string | null;
  observaciones?: string | null;
}

export interface CreateMantenimientoEdilicioOrdenDTO {
  activo_id?: string | null;
  sector_id?: string | null;
  tipo_orden?: MantenimientoEdilicioTipoOrden | string;
  prioridad?: InfraestructuraCriticidad | string;
  titulo: string;
  descripcion?: string | null;
  fecha_programada?: string | null;
  fecha_vencimiento?: string | null;
  tecnico_responsable?: string | null;
  proveedor_id?: string | null;
  costo_estimado?: number | null;
  observaciones?: string | null;
  requiere_certificado?: boolean | null;
  registrado_por?: string | null;
}

export interface UpdateMantenimientoEdilicioOrdenDTO {
  estado?: MantenimientoEdilicioEstadoOrden | string;
  fecha_inicio?: string | null;
  fecha_cierre?: string | null;
  costo_real?: number | null;
  resultado?: string | null;
  observaciones?: string | null;
  certificado_url?: string | null;
}


export interface CreateInfraestructuraQrDTO {
  target_type: InfraestructuraQrTargetType | string;
  target_id: string;
  titulo?: string | null;
  codigo?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface ResolveInfraestructuraQrResponse {
  message?: string;
  data: InfraestructuraQrResolveResult;
}

export interface CreateInfraestructuraChecklistRespuestaDTO {
  item_id: string;
  resultado?: InfraestructuraChecklistResultado | string;
  observacion?: string | null;
  foto_url?: string | null;
}

export interface CreateInfraestructuraChecklistEjecucionDTO {
  template_id: string;
  activo_id?: string | null;
  sector_id?: string | null;
  orden_id?: string | null;
  resultado_general?: InfraestructuraChecklistResultado | string;
  notas?: string | null;
  foto_antes_url?: string | null;
  foto_despues_url?: string | null;
  ejecutado_por?: string | null;
  respuestas?: CreateInfraestructuraChecklistRespuestaDTO[];
}
