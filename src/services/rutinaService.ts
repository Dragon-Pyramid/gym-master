import { getSupabaseClient } from "./supabaseClient";

// Funciones para métricas de rutinas IA
export const dataAdherenciaMensualRutinas = async (user: any) => {
    const supabase = getSupabaseClient(user.dbName);
    const { data, error } = await supabase
        .rpc('sp_adherencia_mensual_rutinas');
    if (error) throw new Error(error.message);
    return data;
}

export const dataEvolucionPromedioPorObjetivo = async (user: any) => {
    const supabase = getSupabaseClient(user.dbName);
    const { data, error } = await supabase
        .rpc('sp_evolucion_promedio_por_objetivo');
    if (error) throw new Error(error.message);
    return data;
}

export const dataGeneracionRutina = async (user: any,rutina:{ 
    nivel: number,
    objetivo:number,
    dias :number}) => {
    const supabase = getSupabaseClient(user.dbName);


    const { data, error } = await supabase.rpc('generar_rutina_socio', {
    p_id_socio: user.id_socio,
    p_id_objetivo: rutina.objetivo,
    p_id_nivel: rutina.nivel,
    p_dias: rutina.dias,
  })
  .single();

  if (error) {
    console.log("Error en la generación de rutina:", error);
    
    throw new Error(error.message)
  };
  return data;
}


export const dataGeneracionRutinaPersonalizada = async (user: any,rutina:{ 
    nivel: number,
    objetivo:number,
    dias :number}) => {
    const supabase = getSupabaseClient(user.dbName);

  const { data, error } = await supabase.rpc('sp_generar_rutina_personalizada', {
    p_nivel: rutina.nivel,
    p_objetivo: rutina.objetivo,
    p_dias: rutina.dias
  });

  console.log("Datos de generación de sp_generar_rutina_personalizada:", rutina);
  console.log(data);

  //TODO RETORNA UN ARRAY VACIO
  //TODO DEBERIA DEVOLVER UN JSON CON LA ESTRUCTURA DE LA RUTINA GENERADA ASI LA GUARDO EN LA BD
  
   if (error) throw new Error(error.message);
  return data;
}