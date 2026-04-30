import { supabase } from "./supabaseClient";

export const fetchAllActividades = async ()=>{
    const {data, error} = await supabase
    .from("actividad")
    .select()
    if(error) throw new Error(error.message);
    return data;
}
export const createActividad = async (payload:{
    nombre_actividad:string;
})=>{
    const {data, error} = await supabase
    .from("actividad")
    .insert(payload)
    if(error) throw new Error(error.message);
    return data;
}
export const updateActividad = async (id:string,updateData:{
    nombre_actividad?:string;
} ) =>{
    console.log(updateData);
    

    const {data,error} = await supabase
    .from("actividad")
    .update(updateData)
    .eq("id",id)
    .select();
    if(error) throw new Error(error.message);
    if(!data) throw new Error("No se encontro actividad con ese id");
    return data;

}

export const deleteActividad = async (id: string) => {
  const { data, error } = await supabase
    .from('actividad')
    .delete()
    .eq('id', id)
    .select()

  if (error) throw new Error(error.message)
  if (!data || data.length === 0) throw new Error('No se encontró la actividad con ese ID')
}

export const getActividadById = async (id: string): Promise<any> => {
  const { data, error } = await supabase
    .from("actividad")
    .select()
    .eq("id", id)
    .single();
  if (error) {
    console.log(error.message);
    throw new Error("No se encontró la actividad con ese id");
  }
  return data;
};