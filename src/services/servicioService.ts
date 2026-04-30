import { supabase } from "./supabaseClient";
import { Servicio, CreateServicioDto, UpdateServicioDto } from "../interfaces/servicio.interface";

export const getAllServicios = async (): Promise<Servicio[]> => {
  const { data, error } = await supabase.from("servicio").select();
  if (error) throw new Error(error.message);
  return data as Servicio[];
};

export const createServicio = async (payload: CreateServicioDto): Promise<Servicio> => {
  const { data, error } = await supabase.from("servicio").insert(payload).select().single();
  if (error) throw new Error(error.message);
  return data as Servicio;
};

export const updateServicio = async (id: string, updateData: UpdateServicioDto): Promise<Servicio> => {
  const { data, error } = await supabase.from("servicio").update(updateData).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("No se encontró servicio con ese id");
  return data as Servicio;
};

export const deleteServicio = async (id: string): Promise<Servicio[]> => {
  const { data, error } = await supabase.from("servicio")
    .update({ activo: false })
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
