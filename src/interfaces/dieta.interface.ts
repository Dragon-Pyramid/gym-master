export interface Dieta {
  id: string;
  socio_id: string;
  socio?: {
    nombre_completo?: string;
    dni?: string;
    email?: string;
  } | null;
  nombre_plan: string;
  objetivo: string;
  observaciones: string;
  fecha_inicio: string;
  fecha_fin: string;
  creado_por: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateDietaDto {
  socio_id: string;
  objetivo: string;
  fecha_inicio: string;
  fecha_fin: string;
}
