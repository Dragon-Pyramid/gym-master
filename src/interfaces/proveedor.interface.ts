export type ProveedorEstado = "activo" | "inactivo" | "discontinuado";

export interface Proveedor {
  id: string;
  nombre: string;
  contacto?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  razon_social?: string | null;
  identificacion_fiscal?: string | null;
  condicion_fiscal?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  ciudad?: string | null;
  provincia?: string | null;
  pais?: string | null;
  rubro?: string | null;
  observaciones?: string | null;
  estado?: ProveedorEstado | null;
  banco?: string | null;
  alias_cbu?: string | null;
  cbu_cvu?: string | null;
  titular_cuenta?: string | null;
  creado_en?: string | null;
  actualizado_en?: string | null;
}

export interface CreateProveedorDto {
  nombre: string;
  contacto?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  razon_social?: string | null;
  identificacion_fiscal?: string | null;
  condicion_fiscal?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  ciudad?: string | null;
  provincia?: string | null;
  pais?: string | null;
  rubro?: string | null;
  observaciones?: string | null;
  estado?: ProveedorEstado | null;
  banco?: string | null;
  alias_cbu?: string | null;
  cbu_cvu?: string | null;
  titular_cuenta?: string | null;
}

export interface UpdateProveedorDto {
  nombre?: string;
  contacto?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  razon_social?: string | null;
  identificacion_fiscal?: string | null;
  condicion_fiscal?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  ciudad?: string | null;
  provincia?: string | null;
  pais?: string | null;
  rubro?: string | null;
  observaciones?: string | null;
  estado?: ProveedorEstado | null;
  banco?: string | null;
  alias_cbu?: string | null;
  cbu_cvu?: string | null;
  titular_cuenta?: string | null;
}

export const PROVEEDOR_ESTADOS: Array<{
  value: ProveedorEstado;
  label: string;
}> = [
  { value: "activo", label: "Activo" },
  { value: "inactivo", label: "Inactivo" },
  { value: "discontinuado", label: "Discontinuado" },
];
