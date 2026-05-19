import { SignInDto } from '@/interfaces/credentials.interface';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { getSocioByIdUsuario } from './socioService';
import { JwtUser } from '@/interfaces/jwtUser.interface';
import { conexionBD } from '@/middlewares/conexionBd.middleware';

export const signIn = async (login: SignInDto) => {
  const { email, password, rol } = login;

  // Modo single-tenant: este deployment apunta a una única base de datos.
  const supabase = conexionBD();
  //BUSCO EN ESA BD, EL USUARIO
  const { data, error } = await supabase
    .from('usuario')
    .select()
    .eq('email', email)
    .single();

  if (error) {
    console.log('Error al obtener el usuario:', error.message);
    throw new Error('Error al obtener el usuario');
  }

  if (!data) {
    console.log('Email no encontrado');
    throw new Error('Usuario no encontrado o contraseña incorrecta');
  }

  const validatePassword = bcrypt.compareSync(password, data.password_hash);

  if (!validatePassword) {
    console.log('Contraseña incorrecta');
    throw new Error('Usuario no encontrado o contraseña incorrecta');
  }

  if (data.rol !== rol) {
    console.log('Rol no autorizado');
    throw new Error('Usuario no encontrado o contraseña incorrecta');
  }
  if (data.activo === false) {
    console.log('Usuario inactivo');
    throw new Error('Usuario inactivo');
  }

  const basePayload: JwtUser = {
    sub: data.id,
    id: data.id,
    id_socio: '',
    email: data.email,
    rol: data.rol,
    nombre: data.nombre,
    foto: data.foto ? data.foto : null,
  };

  if (rol === 'socio') {
    const socio = await getSocioByIdUsuario(data.id);
    
    // const socio = await getSocioByIdUsuario(data.id);

    if (!socio) {
      console.log('No se encontró el socio asociado al usuario');
      throw new Error('No se encontró el socio asociado al usuario');
    }
    basePayload.id_socio = socio.id_socio;
  }

  const payload = basePayload;
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET no está definido en las variables de entorno');
  }
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '3h' });
  return token;
};
