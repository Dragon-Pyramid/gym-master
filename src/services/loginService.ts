import { SignInDto } from '@/interfaces/credentials.interface';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { getSocioByIdUsuario } from './socioService';
import { JwtUser } from '@/interfaces/jwtUser.interface';
import { conexionBD } from '@/middlewares/conexionBd.middleware';
import { sanitizeMenuPermissionsForRole } from '@/lib/permissions/menuPermissions';
import {
  buildMensajeDesactivacionMora,
  debeBloquearAccesoPorMorosidad,
  getEstadoCuotaMorosidad,
  registrarDesactivacionPorMorosidad,
  reactivarSocioPorPago,
} from './morosidadService';

class LoginBusinessError extends Error {
  code: string;
  status: number;
  details?: Record<string, unknown>;

  constructor(
    message: string,
    options?: {
      code?: string;
      status?: number;
      details?: Record<string, unknown>;
    }
  ) {
    super(message);
    this.name = 'LoginBusinessError';
    this.code = options?.code ?? 'LOGIN_ERROR';
    this.status = options?.status ?? 400;
    this.details = options?.details;
  }
}

export const signIn = async (login: SignInDto) => {
  const { email, password, rol } = login;

  // Modo single-tenant: este deployment apunta a una única base de datos.
  const supabase = conexionBD();
  //BUSCO EN ESA BD, EL USUARIO
  const { data, error } = await supabase
    .from('usuario')
    .select('id,nombre,email,password_hash,rol,activo,foto,permisos_menu,must_change_password')
    .eq('email', email)
    .single();

  if (error) {
    console.log('Error al obtener el usuario:', error.message);
    throw new LoginBusinessError('Error al obtener el usuario', {
      code: 'LOGIN_USER_QUERY_ERROR',
      status: 500,
    });
  }

  if (!data) {
    console.log('Email no encontrado');
    throw new LoginBusinessError(
      'Usuario no encontrado o contraseña incorrecta',
      {
        code: 'LOGIN_INVALID_CREDENTIALS',
        status: 401,
      }
    );
  }

  const validatePassword = bcrypt.compareSync(password, data.password_hash);

  if (!validatePassword) {
    console.log('Contraseña incorrecta');
    throw new LoginBusinessError(
      'Usuario no encontrado o contraseña incorrecta',
      {
        code: 'LOGIN_INVALID_CREDENTIALS',
        status: 401,
      }
    );
  }

  if (data.rol !== rol) {
    console.log('Rol no autorizado');
    throw new LoginBusinessError(
      'Usuario no encontrado o contraseña incorrecta',
      {
        code: 'LOGIN_INVALID_ROLE',
        status: 401,
      }
    );
  }
  if (data.activo === false) {
    console.log('Usuario inactivo');
    throw new LoginBusinessError('Usuario inactivo', {
      code: 'LOGIN_USER_INACTIVE',
      status: 403,
    });
  }

  const basePayload: JwtUser = {
    sub: data.id,
    id: data.id,
    id_socio: '',
    email: data.email,
    rol: data.rol,
    nombre: data.nombre,
    foto: data.foto ? data.foto : null,
    permisos_menu: sanitizeMenuPermissionsForRole(data.rol, data.permisos_menu),
    must_change_password: Boolean(data.must_change_password),
  };

  if (rol === 'socio') {
    const socio = await getSocioByIdUsuario(data.id);

    if (!socio) {
      console.log('No se encontró el socio asociado al usuario');
      throw new LoginBusinessError('No se encontró el socio asociado al usuario', {
        code: 'LOGIN_SOCIO_NOT_FOUND',
        status: 404,
      });
    }

    const estadoCuota = await getEstadoCuotaMorosidad(supabase, socio.id_socio);
    const debeDesactivarsePorMora = debeBloquearAccesoPorMorosidad(estadoCuota);

    if (debeDesactivarsePorMora && socio.activo) {
      await registrarDesactivacionPorMorosidad(
        supabase,
        socio.id_socio,
        'login',
        data.id
      );
      socio.activo = false;
      console.log(
        `Socio ${socio.id_socio} desactivado por morosidad (${estadoCuota?.estado_cuota}, ${estadoCuota?.dias_vencido} días vencido).`
      );
    }

    if (!debeDesactivarsePorMora && !socio.activo && estadoCuota?.estado_cuota === 'al_dia') {
      await reactivarSocioPorPago(
        supabase,
        socio.id_socio,
        null,
        'login',
        data.id
      );
      socio.activo = true;
      console.log(
        `Socio ${socio.id_socio} reactivado en login porque registra cuota al día.`
      );
    }

    if (!socio.activo || debeDesactivarsePorMora) {
      const message = debeDesactivarsePorMora
        ? buildMensajeDesactivacionMora(estadoCuota)
        : 'Su cuenta de socio se encuentra desactivada. Diríjase a administración para regularizar su situación.';

      throw new LoginBusinessError(message, {
        code: debeDesactivarsePorMora
          ? 'LOGIN_SOCIO_DESACTIVADO_MORA'
          : 'LOGIN_SOCIO_INACTIVE',
        status: 403,
        details: {
          id_socio: socio.id_socio,
          estado_cuota: estadoCuota?.estado_cuota ?? null,
          dias_vencido: estadoCuota?.dias_vencido ?? null,
          periodo_hasta: estadoCuota?.periodo_hasta ?? null,
          ultimo_vencimiento: estadoCuota?.ultimo_vencimiento ?? null,
        },
      });
    }

    basePayload.id_socio = socio.id_socio;
  }

  await supabase
    .from('usuario')
    .update({ ultimo_login_en: new Date().toISOString() })
    .eq('id', data.id);

  const payload = basePayload;
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET no está definido en las variables de entorno');
  }
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '3h' });
  return token;
};

export { LoginBusinessError };
