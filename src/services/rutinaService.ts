import { GeneracionRutina, Rutina } from "@/interfaces/rutina.interface";
import { getSupabaseClient } from "./supabaseClient";
import { JwtUser } from "@/interfaces/jwtUser.interface";

// Funciones para métricas de rutinas IA
export const dataAdherenciaMensualRutinas = async (user: JwtUser) => {
    const supabase = getSupabaseClient(user.dbName);
    const { data, error } = await supabase
        .rpc('sp_adherencia_mensual_rutinas');
    if (error) throw new Error(error.message);
    return data;
}

export const dataEvolucionPromedioPorObjetivo = async (user: JwtUser) => {
    const supabase = getSupabaseClient(user.dbName);
    const { data, error } = await supabase
        .rpc('sp_evolucion_promedio_por_objetivo');
    if (error) throw new Error(error.message);
    return data;
}

export const dataGeneracionRutina = async (user: JwtUser,rutina: GeneracionRutina) => {
    const supabase = getSupabaseClient(user.dbName);
    
  // Llamada al procedimiento almacenado para generar la rutina
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


export const dataGeneracionRutinaPersonalizada = async (user: JwtUser,rutina:{ 
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

export const historialRutinaSocioLogueado = async (user: JwtUser) : Promise<Rutina[]>  => {
    const supabase = getSupabaseClient(user.dbName);
    const { data, error } = await supabase
        .from('rutina')
        .select()
        .eq('id_socio', user.id_socio)
        .order('creado_en', { ascending: false });

    if (error) {
      console.log("Error al obtener el historial de rutinas: ", error.message);
      throw new Error("Error al obtener el historial de rutinas del socio")
    };

    return data;

}

export const historialRutinaSocio = async (user: JwtUser,id_socio: string) : Promise<Rutina[]>  => {
    const supabase = getSupabaseClient(user.dbName);
    const { data, error } = await supabase
        .from('rutina')
        .select()
        .eq('id_socio', id_socio)
        .order('creado_en', { ascending: false });

    if (error) {
      console.log("Error al obtener el historial de rutinas: ", error.message);
      throw new Error("Error al obtener el historial de rutinas del socio")
    };

    return data;

}

export const dataRetencionPorCombinacion = async (user: any) => {
    const supabase = getSupabaseClient(user.dbName);
    const { data, error } = await supabase
        .rpc('calcular_retencion_por_combinacion');

    if (error) {
        console.log("Error en la obtención de retención por combinación:", error.message);
        throw new Error(error.message);
    }

    return data;
}