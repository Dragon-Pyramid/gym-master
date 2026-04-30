import { GeneracionRutina, Rutina } from "@/interfaces/rutina.interface";
import { getSupabaseClient } from "./supabaseClient";
import { JwtUser } from "@/interfaces/jwtUser.interface";

const isValidUUID = (value?: string | null): boolean => {
  if (!value) return false;

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(
    value
  );
};

const isAdmin = (rol?: string | null): boolean => {
  const normalizedRol = rol?.trim().toLowerCase();

  return normalizedRol === "admin" || normalizedRol === "administrador";
};

type RutinaAdminRow = Omit<Rutina, "socio"> & {
  socio?: Rutina["socio"] | Rutina["socio"][];
};

// Funciones para métricas de rutinas IA
export const dataAdherenciaMensualRutinas = async (user: JwtUser) => {
  const supabase = getSupabaseClient(user.dbName);

  const { data, error } = await supabase.rpc("sp_adherencia_mensual_rutinas");

  if (error) throw new Error(error.message);

  return data;
};

export const dataEvolucionPromedioPorObjetivo = async (user: JwtUser) => {
  const supabase = getSupabaseClient(user.dbName);

  const { data, error } = await supabase.rpc(
    "sp_evolucion_promedio_por_objetivo"
  );

  if (error) throw new Error(error.message);

  return data;
};

export const dataGeneracionRutina = async (
  user: JwtUser,
  rutina: GeneracionRutina
) => {
  const supabase = getSupabaseClient(user.dbName);

  if (!isValidUUID(user.id_socio)) {
    throw new Error("El usuario no tiene un id_socio válido para generar rutina");
  }

  const { data, error } = await supabase
    .rpc("generar_rutina_socio", {
      p_id_socio: user.id_socio,
      p_id_objetivo: rutina.objetivo,
      p_id_nivel: rutina.nivel,
      p_dias: rutina.dias,
    })
    .single();

  if (error) {
    console.log("Error en la generación de rutina:", error);
    throw new Error(error.message);
  }

  return data;
};

export const dataGeneracionRutinaPersonalizada = async (
  user: JwtUser,
  rutina: {
    nivel: number;
    objetivo: number;
    dias: number;
  }
) => {
  const supabase = getSupabaseClient(user.dbName);

  const { data, error } = await supabase.rpc(
    "sp_generar_rutina_personalizada",
    {
      p_nivel: rutina.nivel,
      p_objetivo: rutina.objetivo,
      p_dias: rutina.dias,
    }
  );

  console.log("Datos de generación de sp_generar_rutina_personalizada:", rutina);
  console.log(data);

  if (error) throw new Error(error.message);

  return data;
};

export const historialRutinasAdmin = async (
  user: JwtUser
): Promise<Rutina[]> => {
  const supabase = getSupabaseClient(user.dbName);

  const { data, error } = await supabase
    .from("rutina")
    .select(
      `
      id_rutina,
      id_socio,
      rutina_desc,
      contenido,
      semana,
      nombre,
      creado_en,
      actualizado_en,
      socio!rutina_id_socio_fkey (
        id_socio,
        nombre_completo,
        dni,
        email,
        nivel,
        objetivo,
        dias_por_semana
      )
    `
    )
    .order("creado_en", { ascending: false });

  if (error) {
    console.log("Error al obtener rutinas del administrador:", error.message);
    throw new Error("Error al obtener las rutinas asignadas a socios");
  }

  const rutinas = (data ?? []) as RutinaAdminRow[];

  return rutinas.map((rutina) => {
    const socio = Array.isArray(rutina.socio)
      ? rutina.socio[0] ?? null
      : rutina.socio ?? null;

    return {
      ...rutina,
      socio,
    };
  });
};

export const historialRutinaSocioLogueado = async (
  user: JwtUser
): Promise<Rutina[]> => {
  if (isAdmin(user.rol)) {
    return historialRutinasAdmin(user);
  }

  const supabase = getSupabaseClient(user.dbName);

  if (!isValidUUID(user.id_socio)) {
    console.warn(
      "No se consultó historial de rutinas porque el usuario no tiene un id_socio válido:",
      user.id_socio
    );

    return [];
  }

  const { data, error } = await supabase
    .from("rutina")
    .select("*")
    .eq("id_socio", user.id_socio)
    .order("creado_en", { ascending: false });

  if (error) {
    console.log("Error al obtener el historial de rutinas:", error.message);
    throw new Error("Error al obtener el historial de rutinas del socio");
  }

  return (data ?? []) as Rutina[];
};

export const historialRutinaSocio = async (
  user: JwtUser,
  id_socio: string
): Promise<Rutina[]> => {
  const supabase = getSupabaseClient(user.dbName);

  if (!isValidUUID(id_socio)) {
    console.warn(
      "No se consultó historial de rutinas porque el id_socio no es válido:",
      id_socio
    );

    return [];
  }

  const { data, error } = await supabase
    .from("rutina")
    .select("*")
    .eq("id_socio", id_socio)
    .order("creado_en", { ascending: false });

  if (error) {
    console.log("Error al obtener el historial de rutinas:", error.message);
    throw new Error("Error al obtener el historial de rutinas del socio");
  }

  return (data ?? []) as Rutina[];
};

export const dataRetencionPorCombinacion = async (user: JwtUser) => {
  const supabase = getSupabaseClient(user.dbName);

  const { data, error } = await supabase.rpc(
    "calcular_retencion_por_combinacion"
  );

  if (error) {
    console.log("Error en la obtención de retención por combinación:", error.message);
    throw new Error(error.message);
  }

  return data;
};