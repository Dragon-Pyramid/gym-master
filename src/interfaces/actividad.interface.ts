export interface Actividad {
  id: string;
  nombre_actividad: string;
  creado_en: string;
  actualizado_en: string;
}

export interface CreateActividadDto {
  nombre_actividad: string;
}

export interface UpdateActividadDto {
  nombre_actividad?: string;
  actualizado_en?: string;
}
