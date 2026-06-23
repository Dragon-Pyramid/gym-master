import { supabase } from "./supabaseClient";
import { Servicio, CreateServicioDto, UpdateServicioDto } from "../interfaces/servicio.interface";

function normalizeServicioCode(value: unknown) {
  const text = String(value ?? '').trim();
  if (!text) return null;
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

const normalizeServicioPayload = <T extends CreateServicioDto | UpdateServicioDto>(payload: T): T => {
  const normalized: Record<string, any> = {
    ...payload,
    nombre: typeof payload.nombre === "string" ? payload.nombre.trim() : payload.nombre,
    descripcion: typeof payload.descripcion === "string" ? payload.descripcion.trim() : payload.descripcion,
    categoria: payload.categoria || "otro",
    modalidad: payload.modalidad || "presencial",
    precio: payload.precio !== undefined ? Number(payload.precio) : payload.precio,
    duracion_minutos:
      payload.duracion_minutos === undefined || payload.duracion_minutos === null
        ? null
        : Number(payload.duracion_minutos),
    cupo_maximo:
      payload.cupo_maximo === undefined || payload.cupo_maximo === null
        ? null
        : Number(payload.cupo_maximo),
  };

  if (Object.prototype.hasOwnProperty.call(payload, "codigo")) {
    normalized.codigo = normalizeServicioCode(payload.codigo);
  }

  return normalized as T;
};

export const getAllServicios = async (): Promise<Servicio[]> => {
  const { data, error } = await supabase
    .from("servicio")
    .select()
    .order("activo", { ascending: false })
    .order("nombre", { ascending: true });
  if (error) throw new Error(error.message);
  return data as Servicio[];
};

export const createServicio = async (payload: CreateServicioDto): Promise<Servicio> => {
  const { data, error } = await supabase
    .from("servicio")
    .insert(normalizeServicioPayload(payload))
    .select()
    .single();
  if (error) {
    if (error.message?.includes('servicio_codigo_unique')) {
      throw new Error('El código del servicio ya está asociado a otro servicio.');
    }
    throw new Error(error.message);
  }
  return data as Servicio;
};

export const updateServicio = async (id: string, updateData: UpdateServicioDto): Promise<Servicio> => {
  const { data, error } = await supabase
    .from("servicio")
    .update(normalizeServicioPayload(updateData))
    .eq("id", id)
    .select()
    .single();
  if (error) {
    if (error.message?.includes('servicio_codigo_unique')) {
      throw new Error('El código del servicio ya está asociado a otro servicio.');
    }
    throw new Error(error.message);
  }
  if (!data) throw new Error("No se encontró servicio con ese id");
  return data as Servicio;
};

export const deleteServicio = async (id: string): Promise<Servicio[]> => {
  const current = await getServicioById(id);
  const { data, error } = await supabase
    .from("servicio")
    .update({ activo: !current.activo })
    .eq('id', id)
    .select();
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    throw new Error('No se encontró el servicio con ese ID');
  }

  return data as Servicio[];
};

export const getServicioById = async (id: string): Promise<Servicio> => {
  const { data, error } = await supabase
    .from("servicio")
    .select()
    .eq("id", id)
    .single();
  if (error) {
    console.log(error.message);
    throw new Error("No se encontró el servicio con ese id");
  }
  return data as Servicio;
};
