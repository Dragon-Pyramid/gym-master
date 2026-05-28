import { CreateDietaDto, Dieta } from '@/interfaces/dieta.interface';
import { JwtUser } from '@/interfaces/jwtUser.interface';
import { conexionBD } from '@/middlewares/conexionBd.middleware';

export const createDietaSocio = async (
  createDieta: CreateDietaDto,
  user: JwtUser
) => {
  const supabase = conexionBD();

  const { error } = await supabase.rpc('genera_dieta_socio', {
    p_socio_id: createDieta.socio_id,
    p_objetivo_id: createDieta.objetivo,
    p_fecha_inicio: createDieta.fecha_inicio,
    p_fecha_fin: createDieta.fecha_fin,
    p_usuario: user.id,
  });

  if (error) {
    console.log('Error al generar la dieta:', error.message);
    throw new Error('Error al generar la dieta: ' + error.message);
  }

  // El procedimiento almacenado genera la dieta; luego se consulta la última dieta creada.
  const ultimaDieta = await getUltimaDietaSocio(createDieta.socio_id, user);

  return ultimaDieta;
};

export const getAllDietasSocio = async (
  id: string,
  user: JwtUser
): Promise<Dieta[]> => {
  const supabase = conexionBD();
  const { data, error } = await supabase
    .from('dieta')
    .select('*')
    .eq('socio_id', id)
    .order('created_at', { ascending: false });

  if (error) {
    console.log('Error al obtener las dietas:', error.message);
    throw new Error('Error al obtener las dietas: ' + error.message);
  }

  return data ?? [];
};

export const getAllDietas = async (user: JwtUser): Promise<Dieta[]> => {
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

  return data ?? null;
};

export const getUltimaDietaSocio = async (
  id: string,
  user: JwtUser
): Promise<Dieta> => {
  const supabase = conexionBD();
  const { data: ultimaDietaData, error: ultimaDietaError } = await supabase
    .from('dieta')
    .select('*')
    .eq('socio_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (ultimaDietaError) {
    throw new Error('Error al consultar la última dieta: ' + ultimaDietaError.message);
  }

  return ultimaDietaData;
};
