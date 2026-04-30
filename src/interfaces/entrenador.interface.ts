import { CreateEntrenadorHorarioDTO } from "./entrenadorHorario.interface";

export interface Entrenador {
  id: string;
  nombre_completo: string;
  dni: string;
  fecha_alta: string;
  activo: boolean;
  horarios_texto: string;
}

export interface CreateEntrenadorDTO {
  nombre_completo: string;
  dni: string;
  horarios: CreateEntrenadorHorarioDTO[];
}

export interface UpdateEntrenadorDTO {
  nombre_completo?: string;
  dni?: string;
  horarios?: CreateEntrenadorHorarioDTO[];
  horarios_texto?: string;
}
