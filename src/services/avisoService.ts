import 'server-only';

import { getSupabaseServerClient } from "./supabaseServerClient";
import { Aviso, CreateAvisoDto, UpdateAvisoDto } from "../interfaces/aviso.interface";

const AVISO_NOT_FOUND_ERROR = "No se encontró el aviso con ese id";


export const getAllAvisos = async (): Promise<Aviso[]> => {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("avisos").select();
  if (error) throw new Error(error.message);
  return data as Aviso[];
};

export const createAviso = async (payload: CreateAvisoDto): Promise<Aviso> => {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase.from("avisos").insert({ ...payload, activo: true }).select().single();
  if (error) throw new Error(error.message);
  return data as Aviso;
};

export const updateAviso = async (id: string, updateData: UpdateAvisoDto): Promise<Aviso> => {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("avisos").update(updateData).eq("id", id).select().maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error(AVISO_NOT_FOUND_ERROR);
  return data as Aviso;
};

export const deleteAviso = async (id: string): Promise<Aviso> => {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("avisos").update({ activo: false }).eq("id", id).select().maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error(AVISO_NOT_FOUND_ERROR);
  return data as Aviso;
};

export const getAvisoById = async (id: string): Promise<Aviso> => {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("avisos")
    .select()
    .eq("id", id)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    throw new Error(AVISO_NOT_FOUND_ERROR);
  }
  return data as Aviso;
};
