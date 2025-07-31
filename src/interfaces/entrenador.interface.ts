export interface Entrenador {
  id: string;
  nombre_completo: string;
  dni: string;
  fecha_alta: string;
  horarios_texto: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEntrenadorDto {
  nombre_completo: string;
  dni: string;
  horarios: DiaHorario[];
}

export interface UpdateEntrenadorDto {
  nombre_completo?: string;
  dni?: string;
  horarios?: DiaHorario[];
}

export interface DiaHorario {
  dia: string;
  bloques: BloqueHorario[];
}

export interface BloqueHorario {
  hora_desde: string;
  hora_hasta: string;
}
