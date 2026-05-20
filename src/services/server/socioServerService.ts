import { CreateSocioDto, Socio, UpdateSocioDto } from '@/interfaces/socio.interface';
import { JwtUser } from '@/interfaces/jwtUser.interface';
import { getSupabaseServerClient } from '@/services/supabaseServerClient';

const allowedManagerRoles = new Set(['admin', 'usuario']);

function assertCanManageSocios(user: JwtUser) {
  if (!allowedManagerRoles.has(user.rol)) {
    throw new Error('No autorizado para administrar socios');
  }
}

function normalizeSocioPayload<T extends Record<string, unknown>>(payload: T): T {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== '')
  ) as T;
}

export const fetchSociosServer = async (user: JwtUser): Promise<Socio[]> => {
  assertCanManageSocios(user);
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from('socio')
    .select('*')
    .order('creado_en', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Socio[];
};

export const createSocioServer = async (
  user: JwtUser,
  payload: CreateSocioDto
): Promise<Socio> => {
  assertCanManageSocios(user);
  const supabase = getSupabaseServerClient();
  const sanitizedPayload = normalizeSocioPayload({ ...payload });

  if (!sanitizedPayload.nombre_completo || !sanitizedPayload.dni) {
    throw new Error('Nombre completo y DNI son obligatorios');
  }

  if (sanitizedPayload.usuario_id) {
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuario')
      .select('id')
      .eq('id', sanitizedPayload.usuario_id)
      .single();

    if (usuarioError || !usuario) {
      throw new Error('usuario_id no existe en la base de datos');
    }
  }

  const { data, error } = await supabase
    .from('socio')
    .insert(sanitizedPayload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Socio;
};

export const updateSocioServer = async (
  user: JwtUser,
  id_socio: string,
  updateData: UpdateSocioDto
): Promise<Socio> => {
  assertCanManageSocios(user);
  const supabase = getSupabaseServerClient();
  const sanitizedPayload = normalizeSocioPayload({ ...updateData });

  const { data, error } = await supabase
    .from('socio')
    .update(sanitizedPayload)
    .eq('id_socio', id_socio)
    .select()
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('No se encontró el socio con ese ID');

  return data as Socio;
};

export const setSocioActivoServer = async (
  user: JwtUser,
  id_socio: string,
  activo: boolean
): Promise<Socio> => {
  assertCanManageSocios(user);
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from('socio')
    .update({ activo })
    .eq('id_socio', id_socio)
    .select()
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('No se encontró el socio con ese ID');

  return data as Socio;
};

export const deactivateSocioServer = async (
  user: JwtUser,
  id_socio: string
): Promise<Socio> => setSocioActivoServer(user, id_socio, false);

export const getSocioByIdServer = async (
  user: JwtUser,
  id_socio: string
): Promise<Socio> => {
  if (user.rol === 'socio' && user.id_socio !== id_socio) {
    throw new Error('No autorizado para consultar este socio');
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('socio')
    .select(
      `
      *,
      usuario_id (
        foto,
        nombre
      )
    `
    )
    .eq('id_socio', id_socio)
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('No se encontró el socio con ese ID');

  return data as Socio;
};
