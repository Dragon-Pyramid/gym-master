import { getSupabaseClient } from "@/services/supabaseClient";

export function conexionBD(dbName: string){
if (!dbName) {
  throw new Error("No se encontró el nombre de la base de datos en el usuario");
}
//ME CONECTO A LA BD DEL USUARIO LOGUEADO
  const supabase = getSupabaseClient(dbName);
  if (!supabase) {
    throw new Error(`No se pudo obtener el cliente de Supabase para la base de datos: ${dbName}`);
  } 
  return supabase;
}