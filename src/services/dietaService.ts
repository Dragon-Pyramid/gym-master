import { CreateDietaDto, Dieta } from '@/interfaces/dieta.interface';
import { JwtUser } from '@/interfaces/jwtUser.interface';
import { AuthorizationError } from '@/lib/auth/serverAuthorization';
import { conexionBD } from '@/middlewares/conexionBd.middleware';

const isManager = (role?: string | null) =>
  role === 'admin' || role === 'usuario';

async function resolveOwnSocioId(user: JwtUser): Promise<string> {
  if (user.rol !== 'socio') {
    throw new AuthorizationError('No autorizado: la identidad no corresponde a un socio', 'AUTH_ROLE_FORBIDDEN');
  }

  if (user.id_socio) return user.id_socio;

  const supabase = conexionBD();
  const { data, error } = await supabase
    .from('socio')
    .select('id_socio')
    .eq('usuario_id', user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data?.id_socio) {
    throw new Error('No se pudo identificar el socio asociado al usuario');
  }

  return data.id_socio as string;
}

async function authorizeSocioTarget(user: JwtUser, requestedSocioId: string) {
  if (isManager(user.rol)) return requestedSocioId;

  const ownSocioId = await resolveOwnSocioId(user);
  if (requestedSocioId !== ownSocioId) {
    throw new AuthorizationError('No autorizado para consultar o modificar dietas de otro socio', 'AUTH_SOCIO_SCOPE_FORBIDDEN');
  }

  return ownSocioId;
}

export const createDietaSocio = async (
  createDieta: CreateDietaDto,
  user: JwtUser
) => {
  const socioId = await authorizeSocioTarget(user, createDieta.socio_id);
  const supabase = conexionBD();

  const { error } = await supabase.rpc('genera_dieta_socio', {
    p_socio_id: socioId,
    p_objetivo_id: createDieta.objetivo,
    p_fecha_inicio: createDieta.fecha_inicio,
    p_fecha_fin: createDieta.fecha_fin,
    p_usuario: user.id,
  });

  if (error) {
    console.log('Error al generar la dieta:', error.message);
    throw new Error('Error al generar la dieta: ' + error.message);
  }

  return getUltimaDietaSocio(socioId, user);
};

export const getAllDietasSocio = async (
  id: string,
  user: JwtUser
): Promise<Dieta[]> => {
  const socioId = await authorizeSocioTarget(user, id);
  const supabase = conexionBD();
  const { data, error } = await supabase
    .from('dieta')
    .select('*')
    .eq('socio_id', socioId)
    .order('created_at', { ascending: false });

  if (error) {
    console.log('Error al obtener las dietas:', error.message);
    throw new Error('Error al obtener las dietas: ' + error.message);
  }

  return data ?? [];
};

export const getAllDietas = async (user: JwtUser): Promise<Dieta[]> => {
  if (!isManager(user.rol)) {
    throw new AuthorizationError('No autorizado para consultar todas las dietas', 'AUTH_ROLE_FORBIDDEN');
  }

  const supabase = conexionBD();
  const { data, error } = await supabase
    .from('dieta')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.log('Error al obtener las dietas:', error.message);
    throw new Error('Error al obtener las dietas: ' + error.message);
  }

  return data ?? [];
};

export const getDietaById = async (
  id: string,
  user: JwtUser
): Promise<Dieta | null> => {
  const supabase = conexionBD();
  const { data, error } = await supabase
    .from('dieta')
    .select(`
      *,
      socio:socio_id (
        nombre_completo,
        dni,
        email
      )
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.log('Error al obtener la dieta:', error.message);
    throw new Error('Error al obtener la dieta: ' + error.message);
  }

  if (!data) return null;
  await authorizeSocioTarget(user, String(data.socio_id));
  return data as Dieta;
};

export const getUltimaDietaSocio = async (
  id: string,
  user: JwtUser
): Promise<Dieta> => {
  const socioId = await authorizeSocioTarget(user, id);
  const supabase = conexionBD();
  const { data, error } = await supabase
    .from('dieta')
    .select('*')
    .eq('socio_id', socioId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    throw new Error('Error al consultar la última dieta: ' + error.message);
  }

  return data as Dieta;
};
