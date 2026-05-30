import { supabase } from "./supabaseClient";

import {
  Proveedor,
  ProveedorEstado,
  CreateProveedorDto,
  UpdateProveedorDto,
} from "../interfaces/proveedor.interface";

type ProveedorPayload = Partial<Record<keyof CreateProveedorDto, string | null>>;

const nullableString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeEstado = (value: unknown): ProveedorEstado => {
  if (value === "inactivo" || value === "discontinuado") return value;
  return "activo";
};

const normalizeCreatePayload = (payload: CreateProveedorDto): ProveedorPayload => {
  return {
    nombre: nullableString(payload.nombre) ?? "",
    contacto: nullableString(payload.contacto),
    telefono: nullableString(payload.telefono),
    direccion: nullableString(payload.direccion),
    razon_social: nullableString(payload.razon_social),
    identificacion_fiscal: nullableString(payload.identificacion_fiscal),
    condicion_fiscal: nullableString(payload.condicion_fiscal),
    email: nullableString(payload.email),
    whatsapp: nullableString(payload.whatsapp),
    ciudad: nullableString(payload.ciudad),
    provincia: nullableString(payload.provincia),
    pais: nullableString(payload.pais) ?? "Argentina",
    rubro: nullableString(payload.rubro),
    observaciones: nullableString(payload.observaciones),
    estado: normalizeEstado(payload.estado),
    banco: nullableString(payload.banco),
    alias_cbu: nullableString(payload.alias_cbu),
    cbu_cvu: nullableString(payload.cbu_cvu),
    titular_cuenta: nullableString(payload.titular_cuenta),
  };
};

const normalizeUpdatePayload = (payload: UpdateProveedorDto): ProveedorPayload => {
  const normalized: ProveedorPayload = {};
  const entries = Object.entries(payload) as Array<[keyof UpdateProveedorDto, unknown]>;

  for (const [key, value] of entries) {
    if (value === undefined) continue;

    if (key === "estado") {
      normalized.estado = normalizeEstado(value);
      continue;
    }

    if (key === "nombre") {
      normalized.nombre = nullableString(value) ?? "";
      continue;
    }

    normalized[key] = nullableString(value);
  }

  return normalized;
};

export const getAllProveedores = async (): Promise<Proveedor[]> => {
  const { data, error } = await supabase
    .from("proveedor")
    .select("*")
    .order("estado", { ascending: true, nullsFirst: false })
    .order("nombre", { ascending: true });

  if (error) throw new Error(error.message);
  return data as Proveedor[];
};

export const createProveedor = async (payload: CreateProveedorDto): Promise<Proveedor> => {
  const normalizedPayload = normalizeCreatePayload(payload);

  if (!normalizedPayload.nombre) {
    throw new Error("El nombre comercial del proveedor es obligatorio");
  }

  const { data, error } = await supabase
    .from("proveedor")
    .insert(normalizedPayload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Proveedor;
};

export const updateProveedor = async (id: string, updateData: UpdateProveedorDto): Promise<Proveedor> => {
  const normalizedPayload = normalizeUpdatePayload(updateData);

  if (Object.prototype.hasOwnProperty.call(normalizedPayload, "nombre") && !normalizedPayload.nombre) {
    throw new Error("El nombre comercial del proveedor es obligatorio");
  }

  const { data, error } = await supabase
    .from("proveedor")
    .update(normalizedPayload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("No se encontró proveedor con ese id");
  return data as Proveedor;
};

export const deleteProveedor = async (id: string): Promise<Proveedor> => {
  const { data, error } = await supabase
    .from("proveedor")
    .update({ estado: "inactivo" })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("No se encontró proveedor con ese id");
  return data as Proveedor;
};

export const existeProveedor = async (id: string) => {
  const { data, error } = await supabase
    .from("proveedor")
    .select("id, estado")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return false;
  return data.estado !== "inactivo" && data.estado !== "discontinuado";
};

export const getProveedorById = async (id: string): Promise<Proveedor> => {
  const { data, error } = await supabase
    .from("proveedor")
    .select()
    .eq("id", id)
    .single();

  if (error) {
    console.log(error.message);
    throw new Error("No se encontró el proveedor con ese id");
  }

  return data as Proveedor;
};
