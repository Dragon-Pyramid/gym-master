export interface FichaMedica {
  id: string;
  id_socio: string;
  altura: number;
  peso: number;
  imc: number;
  grupo_sanguineo: string;
  presion_arterial: string;
  frecuencia_cardiaca: number;
  problemas_cardiacos: boolean;
  problemas_respiratorios: boolean;
  aprobacion_medica: boolean;
  archivo_aprobacion?: string | null;
  alergias?: string | null;
  medicacion?: string | null;
  lesiones_previas?: string | null;
  enfermedades_cronicas?: string | null;
  cirugias_previas?: string | null;
  fecha_ultimo_control?: Date | string | null;
  observaciones_entrenador?: string | null;
  observaciones_medico?: string | null;
  archivos_adjuntos?: string[] | null;
  proxima_revision?: Date | string | null;
}

export interface CreateFichaMedicaDto {
  altura: number;
  peso: number;
  grupo_sanguineo: string;
  presion_arterial: string;
  frecuencia_cardiaca: number;
  problemas_cardiacos: boolean;
  problemas_respiratorios: boolean;
  aprobacion_medica: boolean;
  archivo_aprobacion?: string | null;
  alergias?: string | null;
  medicacion?: string | null;
  lesiones_previas?: string | null;
  enfermedades_cronicas?: string | null;
  cirugias_previas?: string | null;
  fecha_ultimo_control?: Date | string | null;
  observaciones_entrenador?: string | null;
  observaciones_medico?: string | null;
  archivos_adjuntos?: string[] | null;
  proxima_revision?: Date | string | null;
}
