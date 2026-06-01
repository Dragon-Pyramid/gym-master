import { Empleado } from "@/interfaces/empleado.interface";

export type EmpleadoSueldoEstado = "pendiente" | "pagado" | "anulado";

export type EmpleadoSueldoMedioPago =
  | "efectivo"
  | "transferencia"
  | "mercado_pago"
  | "tarjeta_debito"
  | "tarjeta_credito"
  | "otro";

export interface EmpleadoSueldo {
  id: string;
  empleado_id: string;
  empleado?: Empleado | null;
  periodo: string;
  concepto: string;
  sueldo_base: number;
  bonos: number;
  descuentos: number;
  monto_neto: number;
  estado: EmpleadoSueldoEstado;
  medio_pago?: EmpleadoSueldoMedioPago | null;
  fecha_pago?: string | null;
  comprobante_url?: string | null;
  observaciones?: string | null;
  registrado_por?: string | null;
  creado_en?: string | null;
  actualizado_en?: string | null;
}

export interface CreateEmpleadoSueldoDto {
  empleado_id: string;
  periodo: string;
  concepto?: string | null;
  sueldo_base?: number | string | null;
  bonos?: number | string | null;
  descuentos?: number | string | null;
  monto_neto?: number | string | null;
  estado?: EmpleadoSueldoEstado;
  medio_pago?: EmpleadoSueldoMedioPago | null;
  fecha_pago?: string | null;
  comprobante_url?: string | null;
  observaciones?: string | null;
}

export type UpdateEmpleadoSueldoDto = Partial<CreateEmpleadoSueldoDto>;
