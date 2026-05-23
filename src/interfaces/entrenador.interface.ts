import { CreateEntrenadorHorarioDTO } from "./entrenadorHorario.interface";

export interface Entrenador {
  id: string;
  nombre_completo: string;
  dni: string;
  id_tipo_empleado?: string | null;
  fecha_alta: string;
  activo: boolean;
  horarios_texto: string;
}

export interface CreateEntrenadorDTO {
  nombre_completo: string;
  dni: string;
  id_tipo_empleado?: string | null;
  horarios: CreateEntrenadorHorarioDTO[];
}

export interface UpdateEntrenadorDTO {
  nombre_completo?: string;
  dni?: string;
  id_tipo_empleado?: string | null;
  horarios?: CreateEntrenadorHorarioDTO[];
  horarios_texto?: string;
}
