export interface OtrosGastos {
  id: string;
  descripcion: string;
  monto: number;
  fecha: string;
  activo: boolean;
}

export interface CreateOtrosGastosDto {
  descripcion: string;
  monto: number;
  fecha: string;
}

export interface UpdateOtrosGastosDto {
  descripcion?: string;
  monto?: number;
  fecha?: string;
  activo?: boolean;
}
