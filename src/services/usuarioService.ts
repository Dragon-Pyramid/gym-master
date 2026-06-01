import bcrypt from 'bcryptjs';
import { Usuario, CreateUsuarioDto, UpdateUsuarioDto, ResponseUsuario } from "../interfaces/usuario.interface";
import { JwtUser } from '@/interfaces/jwtUser.interface';
import { conexionBD } from '@/middlewares/conexionBd.middleware';
import { updateFotoSocioById } from './socioService';
import { sanitizeMenuPermissionsForRole } from '@/lib/permissions/menuPermissions';
import { buildInitialPasswordFromDni } from '@/utils/passwordPolicy';

export const fetchUsuarios = async (_user?: JwtUser): Promise<ResponseUsuario[]> => {
  const supabase = conexionBD();

  const { data, error } = await supabase
    .from('usuario')
    .select('*');
  if (error) throw new Error(error.message);
  const response = responseUsuario(data);
  return response; 
};

const responseUsuario = (data : Usuario[]) : ResponseUsuario[]=>{
  return data.map (usuario => ({
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
    activo: usuario.activo,
    foto: usuario.foto,
    dni: usuario.dni ?? null,
    permisos_menu: usuario.permisos_menu ?? null,
    must_change_password: Boolean(usuario.must_change_password),
    password_actualizado_en: usuario.password_actualizado_en ?? null,
    primer_login_en: usuario.primer_login_en ?? null,
    ultimo_login_en: usuario.ultimo_login_en ?? null,
  }))
}

export const createUsuarios = async (_user: JwtUser | undefined, payload: CreateUsuarioDto): Promise<Usuario> => {
  const supabase = conexionBD();

  const rol = payload.rol || 'socio';

  const dni = payload.dni?.trim() ?? '';
  const useInitialPassword = payload.use_initial_password ?? true;

  if ((rol === 'socio' || useInitialPassword) && !dni) {
    throw new Error('El DNI es obligatorio para generar la contraseña inicial.');
  }

  const plainPassword = useInitialPassword ? buildInitialPasswordFromDni(dni) : payload.password?.trim();

  if (!plainPassword) {
    throw new Error('La contraseña es obligatoria para crear un usuario.');
  }

  const password_hash = await bcrypt.hash(plainPassword, 10);

  const { data: usuarioCreado, error: usuarioError } = await supabase
    .from('usuario')
    .insert([{
      nombre: payload.nombre,
      email: payload.email,
      password_hash,
      rol,
      activo: true,
      foto: payload.foto ?? null,
      dni: dni || null,
      permisos_menu: sanitizeMenuPermissionsForRole(rol, payload.permisos_menu),
      must_change_password: useInitialPassword,
      password_actualizado_en: null,
    }])
    .select()
    .single();

  if (usuarioError) throw new Error(usuarioError.message);

  if (rol === 'socio') {
    const { error: socioError } = await supabase
      .from('socio')
      .insert([{
        usuario_id: usuarioCreado.id,
        nombre_completo: payload.nombre,
        dni,
        email: payload.email,
        activo: true,
        foto: payload.foto ?? null,
      }]);

    if (socioError) {
      await supabase.from('usuario').delete().eq('id', usuarioCreado.id);
      throw new Error(`Usuario creado, pero no se pudo crear el perfil de socio: ${socioError.message}`);
    }
  }

  return usuarioCreado as Usuario;
};

export const updateUsuarios = async (
  _user: JwtUser | undefined,
  id: string,
  updateData: UpdateUsuarioDto
): Promise<Usuario> => {

  const supabase = conexionBD();

  const payload: Record<string, unknown> = { ...updateData };

  if (typeof updateData.rol === 'string' || 'permisos_menu' in updateData) {
    payload.permisos_menu = sanitizeMenuPermissionsForRole(updateData.rol, updateData.permisos_menu);
  }

  if (updateData.password) {
    payload.password_hash = await bcrypt.hash(updateData.password, 10);
    delete payload.password;
  }

  const { data, error } = await supabase
    .from('usuario')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) {
    console.log(error.message);
      throw new Error(error.message)};
  if (!data || data.length === 0) {
    throw new Error('No se encontró el usuario con ese ID');
  }
  console.log(data);
  
  return data as Usuario;
};

export const deleteUsuarios = async (_user: JwtUser | undefined, id: string): Promise<Usuario[]> => {
  const supabase = conexionBD();
  const { data, error } = await supabase
    .from('usuario')
    .update({ activo: false })
    .eq('id', id)
    .select();
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    throw new Error('No se encontró el usuario con ese ID');
  }
  return data as Usuario[];
};

export const getUsuarioById = async(_user: JwtUser | undefined, id:string): Promise <ResponseUsuario> => {
  const supabase = conexionBD();
  const{data,error} = await supabase
  .from("usuario")
  .select()
  .eq("id",id)
  .single();

if(error) {
  console.log(error.message);
  throw new Error ("Hubo un error al obtener el usuario")
};
const response : ResponseUsuario = {
  id: data.id,
  nombre: data.nombre,
  email: data.email,
  rol: data.rol,
  activo: data.activo,
  foto: data.foto ? data.foto : "https://res.cloudinary.com/dxt4qdckz/image/upload/v1754954109/gym_master/socio/profile/1754954108698_imagen-generica.jpeg.jpg",
  permisos_menu: data.permisos_menu ?? null,
}
return response;
} 

export const updateFotoUsuarioById = async (user: JwtUser, url: string): Promise<Usuario> => {
const supabase = conexionBD();

  const { data, error } = await supabase
    .from('usuario')
    .update({ foto: url })
    .eq('id', user.id)
    .select()
    .single();
  if (error) {
    console.log(error.message);
    throw new Error(error.message);
  }
  if (!data || data.length === 0) {
    throw new Error('No se encontró el usuario con ese ID');
  }

  if (user.rol === 'socio' && user.id_socio) {
    await updateFotoSocioById(user.id_socio, url);
  }
console.log("profile_photo_updated: Foto de usuario actualizada:");

  return data;
};
