import { supabase } from "./supabaseClient";
import { Servicio, CreateServicioDto, UpdateServicioDto } from "../interfaces/servicio.interface";

const normalizeServicioPayload = <T extends CreateServicioDto | UpdateServicioDto>(payload: T): T => ({
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
});

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
  if (error) throw new Error(error.message);
  return data as Servicio;
};

export const updateServicio = async (id: string, updateData: UpdateServicioDto): Promise<Servicio> => {
  const { data, error } = await supabase
    .from("servicio")
    .update(normalizeServicioPayload(updateData))
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
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
