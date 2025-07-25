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
    id_socio:string,
    nivel: number,
    objetivo:number,
    dias :number,
    nombre:string,
    semana:number}) => {
    const supabase = getSupabaseClient(user.dbName);

  const { data, error } = await supabase.rpc('sp_generar_guardar_rutina_json', {
    p_id_socio: rutina.id_socio,
    p_nivel: rutina.nivel,
    p_objetivo: rutina.objetivo,
    p_dias: rutina.dias,
    p_nombre: rutina.nombre ?? 'Rutina personalizada'
  });

  console.log("Datos de generación de rutina:", rutina);
  console.log(data);

  //TODO RETORNA UN JSON SOLO CON UN OBJETO SEMANA, QUE CONTIENE LOS DIAS CON ARRAY VACIO
  //TODO DEBERIA DEVOLVER UN JSON CON LA ESTRUCTURA DE LA RUTINA GENERADA ASI LA GUARDO EN LA BD
  
  if (error) throw new Error(error.message);
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