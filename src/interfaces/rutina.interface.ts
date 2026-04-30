export interface RutinaSocio {
  id_socio: string;
  nombre_completo: string;
  dni?: string | null;
  email?: string | null;
  nivel?: number | null;
  objetivo?: number | null;
  dias_por_semana?: number | null;
}

export interface Rutina {
  id_rutina: number;
  id_socio: string;
  rutina_desc: any;
  contenido: any | null;
  semana: number | null;
  nombre: string | null;
  creado_en?: string;
  actualizado_en?: string;
  socio?: RutinaSocio | null;
}

export interface GeneracionRutina {
  nivel: number;
  objetivo: number;
  dias: number;
}