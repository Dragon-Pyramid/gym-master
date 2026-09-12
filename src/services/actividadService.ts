import 'server-only';

import { getSupabaseServerClient } from "./supabaseServerClient";

const ACTIVIDAD_NOT_FOUND_ERROR = "No se encontró la actividad con ese id";

export const fetchAllActividades = async ()=>{
    const supabase = getSupabaseServerClient();
    const {data, error} = await supabase
    .from("actividad")
    .select()
    if(error) throw new Error(error.message);
    return data;
}
export const createActividad = async (payload:{
    nombre_actividad:string;
})=>{
    const supabase = getSupabaseServerClient();
    const {data, error} = await supabase
    .from("actividad")
    .insert(payload)
    if(error) throw new Error(error.message);
    return data;
}
export const updateActividad = async (id:string,updateData:{
    nombre_actividad?:string;
} ) =>{
    const supabase = getSupabaseServerClient();
    

    const {data,error} = await supabase
    .from("actividad")
    .update(updateData)
    .eq("id",id)
    .select();
    if(error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error(ACTIVIDAD_NOT_FOUND_ERROR);
    return data;

}

export const deleteActividad = async (id: string) => {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('actividad')
    .delete()
    .eq('id', id)
    .select()

  if (error) throw new Error(error.message)
  if (!data || data.length === 0) throw new Error(ACTIVIDAD_NOT_FOUND_ERROR);
}

export const getActividadById = async (id: string): Promise<any> => {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("actividad")
    .select()
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(ACTIVIDAD_NOT_FOUND_ERROR);
  }

  return data;
};