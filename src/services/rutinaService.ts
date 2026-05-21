import { GeneracionRutina, Rutina } from "@/interfaces/rutina.interface";
import { getSupabaseClient } from "./supabaseClient";
import { JwtUser } from "@/interfaces/jwtUser.interface";
import { getSocioByIdUsuario } from "./socioService";

const isValidUUID = (value?: string | null): value is string => {
  if (typeof value !== "string") return false;

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value.trim()
  );
};

const isAdmin = (rol?: string | null): boolean => {
  const normalizedRol = rol?.trim().toLowerCase();

  return normalizedRol === "admin" || normalizedRol === "administrador";
};

type RutinaAdminRow = Omit<Rutina, "socio"> & {
  socio?: Rutina["socio"] | Rutina["socio"][];
};

const resolveIdSocioForRutina = async (
  user: JwtUser,
  rutina: GeneracionRutina
): Promise<string> => {
  const idSocioFromBody = rutina.id_socio ?? rutina.idSocio;

  // Caso admin o generación explícita: el endpoint puede enviar el socio destino.
  if (isValidUUID(idSocioFromBody)) {
    return idSocioFromBody.trim();
  }

  // Caso socio logueado: normalmente viene en el JWT.
  if (isValidUUID(user.id_socio)) {
    return user.id_socio.trim();
  }

  // Fallback robusto: si el token quedó viejo/incompleto, buscar el socio por usuario_id.
  if (!isAdmin(user.rol) && isValidUUID(user.id)) {
    const socio = await getSocioByIdUsuario(user.id);

    if (isValidUUID(socio?.id_socio)) {
      return socio.id_socio.trim();
    }
  }

  throw new Error(
    "No se pudo determinar el id_socio para generar rutina. El socio debe tener perfil asociado o el request debe enviar id_socio."
  );
};


const resolveIdSocioForAuthenticatedUser = async (
  user: JwtUser
): Promise<string | null> => {
  if (isValidUUID(user.id_socio)) {
    return user.id_socio.trim();
  }

  if (!isAdmin(user.rol) && isValidUUID(user.id)) {
    const socio = await getSocioByIdUsuario(user.id);

    if (isValidUUID(socio?.id_socio)) {
      return socio.id_socio.trim();
    }
  }

  return null;
};

const normalizeRutinaId = (idRutina: string | number): number => {
  const parsed = Number(idRutina);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("El id de rutina no es válido");
  }

  return parsed;
};
// Funciones para métricas de rutinas IA
export const dataAdherenciaMensualRutinas = async (user: JwtUser) => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc("sp_adherencia_mensual_rutinas");

  if (error) throw new Error(error.message);

  return data;
};

export const dataEvolucionPromedioPorObjetivo = async (user: JwtUser) => {
  const supabase = getSupabaseClient();

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
  const supabase = getSupabaseClient();

  const idSocio = await resolveIdSocioForRutina(user, rutina);

  const { data, error } = await supabase
    .rpc("generar_rutina_socio", {
      p_id_socio: idSocio,
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
  const supabase = getSupabaseClient();

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
  const supabase = getSupabaseClient();

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

  const supabase = getSupabaseClient();
  const idSocio = await resolveIdSocioForAuthenticatedUser(user);

  if (!idSocio) {
    console.warn(
      "No se consultó historial de rutinas porque el usuario no tiene un id_socio válido:",
      user.id_socio
    );

    return [];
  }

  const { data, error } = await supabase
    .from("rutina")
    .select("*")
    .eq("id_socio", idSocio)
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
  const supabase = getSupabaseClient();

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

export const eliminarRutina = async (
  user: JwtUser,
  idRutina: string | number
): Promise<{ id_rutina: number }> => {
  const supabase = getSupabaseClient();
  const rutinaId = normalizeRutinaId(idRutina);

  const { data: rutina, error: findError } = await supabase
    .from("rutina")
    .select("id_rutina, id_socio")
    .eq("id_rutina", rutinaId)
    .maybeSingle();

  if (findError) {
    console.log("Error al buscar la rutina:", findError.message);
    throw new Error("Error al buscar la rutina");
  }

  if (!rutina) {
    throw new Error("No se encontró la rutina");
  }

  if (!isAdmin(user.rol)) {
    const idSocio = await resolveIdSocioForAuthenticatedUser(user);

    if (!idSocio || rutina.id_socio !== idSocio) {
      throw new Error("No tenés permisos para eliminar esta rutina");
    }
  }

  // La tabla rutina no tiene columna activo/eliminado_en; se usa delete físico controlado.
  const { data, error } = await supabase
    .from("rutina")
    .delete()
    .eq("id_rutina", rutinaId)
    .select("id_rutina")
    .single();

  if (error) {
    console.log("Error al eliminar rutina:", error.message);
    throw new Error("Error al eliminar la rutina");
  }

  return data as { id_rutina: number };
};

export const dataRetencionPorCombinacion = async (user: JwtUser) => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc(
    "calcular_retencion_por_combinacion"
  );

  if (error) {
    console.log("Error en la obtención de retención por combinación:", error.message);
    throw new Error(error.message);
  }

  return data;
};