export type TipoCorporal = "ectomorfo" | "mesomorfo" | "endomorfo" | "mixto";
export type SexoReferencia = "masculino" | "femenino" | "otro" | "no_especificado";
export type OrigenRegistro = "manual" | "socio" | "admin" | "sistema" | "importado";

export interface EvolucionSocio {
  id?: string;
  id_evolucion?: string;
  socio_id: string;
  fecha: string;
  peso: number | null;
  altura: number | null;
  imc: number | null;
  cintura: number | null;
  pecho?: number | null;
  cadera?: number | null;
  abdomen?: number | null;
  cuello?: number | null;
  hombros?: number | null;
  antebrazo_izquierdo?: number | null;
  antebrazo_derecho?: number | null;
  biceps_izquierdo?: number | null;
  biceps_derecho?: number | null;
  triceps_izquierdo?: number | null;
  triceps_derecho?: number | null;
  muslo_izquierdo?: number | null;
  muslo_derecho?: number | null;
  pantorrilla_izquierda?: number | null;
  pantorrilla_derecha?: number | null;
  porcentaje_grasa?: number | null;
  masa_muscular?: number | null;
  tipo_corporal?: TipoCorporal | null;
  sexo_referencia?: SexoReferencia | null;
  foto_frontal_url?: string | null;
  foto_lateral_url?: string | null;
  foto_espalda_url?: string | null;
  origen_registro?: OrigenRegistro | null;
  es_registro_inicial?: boolean | null;
  observaciones?: string | null;
  actualizado_en?: string | null;

  /**
   * Campos heredados del modelo anterior.
   * Se conservan como opcionales para compatibilidad con datos viejos y exports previos.
   */
  bicep?: number | null;
  tricep?: number | null;
  pierna?: number | null;
  gluteos?: number | null;
  pantorrilla?: number | null;
}

export interface CreateEvolucionSocioDto {
  socio_id?: string;
  fecha?: string;
  peso: number;
  altura: number;
  cintura?: number | null;
  pecho?: number | null;
  cadera?: number | null;
  abdomen?: number | null;
  cuello?: number | null;
  hombros?: number | null;
  antebrazo_izquierdo?: number | null;
  antebrazo_derecho?: number | null;
  biceps_izquierdo?: number | null;
  biceps_derecho?: number | null;
  triceps_izquierdo?: number | null;
  triceps_derecho?: number | null;
  muslo_izquierdo?: number | null;
  muslo_derecho?: number | null;
  pantorrilla_izquierda?: number | null;
  pantorrilla_derecha?: number | null;
  porcentaje_grasa?: number | null;
  masa_muscular?: number | null;
  tipo_corporal?: TipoCorporal | null;
  sexo_referencia?: SexoReferencia | null;
  foto_frontal_url?: string | null;
  foto_lateral_url?: string | null;
  foto_espalda_url?: string | null;
  origen_registro?: OrigenRegistro | null;
  es_registro_inicial?: boolean | null;
  observaciones?: string | null;

  /**
   * Campos heredados que pueden existir en la tabla.
   * El service los calcula/mapea automáticamente cuando no llegan desde el frontend.
   */
  bicep?: number | null;
  tricep?: number | null;
  pierna?: number | null;
  gluteos?: number | null;
  pantorrilla?: number | null;
}

export interface EvolucionSocioResumen {
  inicial: EvolucionSocio | null;
  actual: EvolucionSocio | null;
  diferencia_peso: number | null;
  diferencia_cintura: number | null;
  diferencia_grasa: number | null;
  diferencia_masa_muscular: number | null;
}


export interface EvolucionFisicaAdminResumen {
  id_socio: string;
  nombre_completo: string;
  dni: string;
  email?: string | null;
  foto?: string | null;
  activo: boolean;
  total_registros: number;
  tiene_evolucion: boolean;
  ultima_fecha: string | null;
  ultimo_peso: number | null;
  ultima_altura: number | null;
  ultimo_imc: number | null;
  ultima_cintura: number | null;
  ultimo_porcentaje_grasa: number | null;
  ultima_masa_muscular: number | null;
  ultimo_tipo_corporal: TipoCorporal | null;
  ultimo_sexo_referencia: SexoReferencia | null;
}
