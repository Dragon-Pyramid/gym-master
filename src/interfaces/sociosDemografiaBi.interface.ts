export type GeneroBi = 'M' | 'F' | 'sin_dato';

export interface SociosBiMetricas {
  total_socios: number;
  socios_activos: number;
  socios_inactivos: number;
  hombres: number;
  mujeres: number;
  sin_genero: number;
  porcentaje_hombres: number;
  porcentaje_mujeres: number;
  porcentaje_sin_genero: number;
  edad_promedio: number | null;
  altas_periodo: number;
  asistencias_periodo: number;
  pagos_periodo: number;
  consumo_periodo: number;
}

export interface SociosBiGeneroResumen {
  genero: GeneroBi;
  label: string;
  cantidad: number;
  porcentaje: number;
}

export interface SociosBiFranjaEtariaResumen {
  franja: string;
  orden: number;
  cantidad_socios: number;
  porcentaje_socios: number;
  edad_promedio: number | null;
  hombres: number;
  mujeres: number;
  sin_genero: number;
  altas_periodo: number;
  asistencias_periodo: number;
  pagos_periodo: number;
  consumo_periodo: number;
}

export interface SociosBiSerieAltaMensual {
  periodo: string;
  periodo_label: string;
  total: number;
  hombres: number;
  mujeres: number;
  sin_genero: number;
}

export interface SociosBiAsistenciaSegmento {
  segmento: string;
  franja: string;
  genero: GeneroBi;
  label_genero: string;
  asistencias: number;
  socios: number;
}

export interface SociosBiConsumoSegmento {
  segmento: string;
  franja: string;
  genero: GeneroBi;
  label_genero: string;
  total: number;
  cantidad_ventas: number;
}

export interface SociosBiProductoServicioRanking {
  item: string;
  tipo: 'producto' | 'servicio' | 'venta_sin_detalle';
  segmento: string;
  franja: string;
  genero: GeneroBi;
  label_genero: string;
  total: number;
  cantidad: number;
}

export interface SociosBiPromocionSugerida {
  titulo: string;
  descripcion: string;
  segmento: string;
  accion_sugerida: string;
  prioridad: 'alta' | 'media' | 'baja';
}

export interface SociosDemografiaBiResponse {
  desde: string;
  hasta: string;
  generado_en: string;
  metricas: SociosBiMetricas;
  distribucion_genero: SociosBiGeneroResumen[];
  franjas_etarias: SociosBiFranjaEtariaResumen[];
  altas_mensuales: SociosBiSerieAltaMensual[];
  asistencia_por_segmento: SociosBiAsistenciaSegmento[];
  consumo_por_segmento: SociosBiConsumoSegmento[];
  ranking_productos_servicios: SociosBiProductoServicioRanking[];
  promociones_sugeridas: SociosBiPromocionSugerida[];
}
