export type EmpleadoEstado = "activo" | "inactivo";

export interface EmpleadoTipo {
  id: string;
  codigo: string;
  nombre: string;
}

export interface Empleado {
  id: string;
  nombre_completo: string;
  dni: string;
  email?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  fecha_nacimiento?: string | null;
  fecha_alta: string;
  id_tipo_empleado?: string | null;
  tipo_empleado?: EmpleadoTipo | null;
  puesto?: string | null;
  area?: string | null;
  tipo_contratacion?: string | null;
  turno?: string | null;
  sueldo_base?: number | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  horarios_texto?: string | null;
  observaciones?: string | null;
  usuario_id?: string | null;
  activo: boolean;
  creado_en?: string | null;
  actualizado_en?: string | null;
}

export interface CreateEmpleadoDto {
  nombre_completo: string;
  dni: string;
  email?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  fecha_nacimiento?: string | null;
  fecha_alta?: string | null;
  id_tipo_empleado?: string | null;
  puesto?: string | null;
  area?: string | null;
  tipo_contratacion?: string | null;
  turno?: string | null;
  sueldo_base?: number | string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  horarios_texto?: string | null;
  observaciones?: string | null;
  usuario_id?: string | null;
  activo?: boolean;
}

export type UpdateEmpleadoDto = Partial<CreateEmpleadoDto>;
