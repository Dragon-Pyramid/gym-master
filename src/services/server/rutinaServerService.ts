import { JwtUser } from '@/interfaces/jwtUser.interface';
import { getSupabaseServerClient } from '@/services/supabaseServerClient';

const isValidUUID = (value?: string | null): value is string => {
  if (typeof value !== 'string') return false;

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value.trim()
  );
};

const isAdmin = (rol?: string | null): boolean => {
  const normalizedRol = rol?.trim().toLowerCase();

  return normalizedRol === 'admin' || normalizedRol === 'administrador';
};

const resolveUserSocioId = async (user: JwtUser): Promise<string | null> => {
  if (isValidUUID(user.id_socio)) {
    return user.id_socio.trim();
  }

  if (!isValidUUID(user.id)) {
    return null;
  }

  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from('socio')
    .select('id_socio')
    .eq('usuario_id', user.id)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo resolver el socio asociado al usuario: ${error.message}`);
  }

  return isValidUUID(data?.id_socio) ? data.id_socio : null;
};

export const deleteRutinaById = async (
  user: JwtUser,
  idRutinaParam: string
): Promise<{ id_rutina: number }> => {
  const idRutina = Number(idRutinaParam);

  if (!Number.isInteger(idRutina) || idRutina <= 0) {
    throw new Error('El id de rutina no es válido');
  }

  const supabase = getSupabaseServerClient();

  const { data: rutina, error: rutinaError } = await supabase
    .from('rutina')
    .select('id_rutina, id_socio')
    .eq('id_rutina', idRutina)
    .maybeSingle();

  if (rutinaError) {
    throw new Error(`Error al consultar la rutina: ${rutinaError.message}`);
  }

  if (!rutina) {
    throw new Error('Rutina no encontrada');
  }

  if (!isAdmin(user.rol)) {
    const idSocioUsuario = await resolveUserSocioId(user);

    if (!idSocioUsuario || idSocioUsuario !== rutina.id_socio) {
      throw new Error('No autorizado para eliminar esta rutina');
    }
  }

  const { error: deleteError } = await supabase
    .from('rutina')
    .delete()
    .eq('id_rutina', idRutina);

  if (deleteError) {
    throw new Error(`Error al eliminar la rutina: ${deleteError.message}`);
  }

  return { id_rutina: idRutina };
};
