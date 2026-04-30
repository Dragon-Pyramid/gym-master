import { supabase } from "./supabaseClient";
import { Aviso, CreateAvisoDto, UpdateAvisoDto } from "../interfaces/aviso.interface";

export const getAllAvisos = async (): Promise<Aviso[]> => {
  const { data, error } = await supabase.from("avisos").select();
  if (error) throw new Error(error.message);
  return data as Aviso[];
};

export const createAviso = async (payload: CreateAvisoDto): Promise<Aviso> => {

  const { data, error } = await supabase.from("avisos").insert({ ...payload, activo: true }).select().single();
  if (error) throw new Error(error.message);
  return data as Aviso;
};

export const updateAviso = async (id: string, updateData: UpdateAvisoDto): Promise<Aviso> => {
  const { data, error } = await supabase.from("avisos").update(updateData).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("No se encontró aviso con ese id");
  return data as Aviso;
};

export const deleteAviso = async (id: string): Promise<Aviso> => {
  const { data, error } = await supabase.from("avisos").update({ activo: false }).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("No se encontró aviso con ese id");
  return data as Aviso;
};

export const getAvisoById = async (id: string): Promise<Aviso> => {
  const { data, error } = await supabase
    .from("avisos")
    .select()
    .eq("id", id)
    .single();
  if (error) {
    console.log(error.message);
    throw new Error("No se encontró el aviso con ese id");
  }
  return data as Aviso;
};
