import bcrypt from 'bcryptjs';
import { Usuario, CreateUsuarioDto, UpdateUsuarioDto, ResponseUsuario } from "../interfaces/usuario.interface";
import { JwtUser } from '@/interfaces/jwtUser.interface';
import { supabase,getSupabaseClient } from '@/services/supabaseClient';
import { conexionBD } from '@/middlewares/conexionBd.middleware';
import { updateFotoSocioById } from './socioService';

export const fetchUsuarios = async (user: JwtUser): Promise<ResponseUsuario[]> => {
  //EXTRAIGO EL NOMBRE DE LA BASE DE DATOS DEL USUARIO LOGUEADO
const dbName = user?.dbName 
if (!dbName) {
  throw new Error("No se encontró el nombre de la base de datos en el usuario");
}
//ME CONECTO A LA BD DEL USUARIO LOGUEADO
  const supabase = getSupabaseClient(dbName);
  if (!supabase) {
    throw new Error(`No se pudo obtener el cliente de Supabase para la base de datos: ${dbName}`);
  }

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
  const password_hash = await bcrypt.hash(payload.password, 10);
  const { data, error } = await supabase
    .from('usuario')
    .insert([{ nombre: payload.nombre, email: payload.email, password_hash, rol:'socio', activo: true }])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Usuario;
};

export const updateUsuarios = async (
  id: string,
  updateData: UpdateUsuarioDto
): Promise<Usuario> => {
  
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

export const deleteUsuarios = async (id: string): Promise<Usuario[]> => {
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

export const getUsuarioById = async(id:string): Promise <ResponseUsuario> => {
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

export const updateFotoUsuarioById = async (user: JwtUser, url: string): Promise<Usuario> => {
const supabase = conexionBD(user.dbName);

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

  if(user.rol === "socio"){
    await updateFotoSocioById(user.id_socio, user.dbName, url);
  }
console.log("profile_photo_updated: Foto de usuario actualizada:");

  return data;
};