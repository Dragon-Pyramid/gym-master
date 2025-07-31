import bcrypt from 'bcryptjs';
import { Usuario, CreateUsuarioDto, UpdateUsuarioDto, ResponseUsuario } from "../interfaces/usuario.interface";
import { JwtUser } from '@/interfaces/jwtUser.interface';
import { conexionBD } from '@/middlewares/conexionBd.middleware';

export const fetchUsuarios = async (user:JwtUser): Promise<ResponseUsuario[]> => {

const supabase = conexionBD(user.dbName);

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
    activo: usuario.activo
  }))
}

export const createUsuarios = async (payload: CreateUsuarioDto): Promise<Usuario> => {
  const supabase = conexionBD(payload.dbName);
  const password_hash = await bcrypt.hash(payload.password, 10);
  const { data, error } = await supabase
    .from('usuario')
    .insert([{ nombre: payload.nombre, email: payload.email, password_hash, rol:'socio', activo: true, dbName: payload.dbName, sexo: payload.sexo, fecnac: payload.fecnac }])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Usuario;
};

export const updateUsuarios = async (id: string, updateData: UpdateUsuarioDto, user: JwtUser): Promise<Usuario> => {
  const supabase = conexionBD(user.dbName);

  const { data, error } = await supabase
    .from('usuario')
    .update(updateData)
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

export const deleteUsuarios = async (id: string, user: JwtUser): Promise<Usuario[]> => {
  const supabase = conexionBD(user.dbName);

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

export const getUsuarioById = async(id:string, user: JwtUser): Promise <ResponseUsuario> => {
  const supabase = conexionBD(user.dbName);
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
  activo: data.activo
} 
return response;
} 
