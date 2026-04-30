export interface Cuota {
  id: string;
  descripcion: string;
  monto: number;
  periodo: string;
  fecha_inicio: string;
  fecha_fin: string;
  activo:boolean;
}

export interface CreateCuotaDto {
  descripcion: string;
  monto: number;
  periodo: string;
  fecha_inicio: string;
  fecha_fin: string;
}

export interface UpdateCuotaDto {
  descripcion?: string;
  monto?: number;
  periodo?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  activo:boolean;
}
