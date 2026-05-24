import { SignInDto } from '@/interfaces/credentials.interface';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { getSocioByIdUsuario } from './socioService';
import { JwtUser } from '@/interfaces/jwtUser.interface';
import { conexionBD } from '@/middlewares/conexionBd.middleware';
import { sanitizeMenuPermissionsForRole } from '@/lib/permissions/menuPermissions';

const DIAS_TOLERANCIA_MORA = 7;

type EstadoCuotaLogin = {
  estado_cuota: string | null;
  dias_vencido: number;
  periodo_hasta: string | null;
  ultimo_vencimiento: string | null;
};

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

function toNumber(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeEstadoCuotaLogin(row: any): EstadoCuotaLogin | null {
  if (!row) return null;

  return {
    estado_cuota: row.estado_cuota ?? null,
    dias_vencido: toNumber(row.dias_vencido),
    periodo_hasta: row.periodo_hasta ?? null,
    ultimo_vencimiento: row.ultimo_vencimiento ?? null,
  };
}

async function getEstadoCuotaParaLogin(
  supabase: ReturnType<typeof conexionBD>,
  socioId: string
): Promise<EstadoCuotaLogin | null> {
  const { data, error } = await supabase.rpc('obtener_estado_cuota_socio', {
    p_id_socio: socioId,
  });

  if (error) {
    console.warn(
      'No se pudo consultar estado de cuota durante login:',
      error.message
    );
    return null;
  }

  const row = Array.isArray(data) ? data[0] : data;
  return normalizeEstadoCuotaLogin(row);
}

function buildMensajeDesactivacionMora(estado: EstadoCuotaLogin | null) {
  if (estado?.estado_cuota === 'sin_pagos') {
    return 'Usted fue desactivado del sistema porque no registra pagos activos. Diríjase a administración para regularizar su situación.';
  }

  const dias = Math.max(estado?.dias_vencido ?? 0, DIAS_TOLERANCIA_MORA + 1);

  return `Usted fue desactivado del sistema porque pasaron ${dias} días desde el vencimiento de su cuota. Diríjase a administración para regularizar su situación.`;
}

async function desactivarSocioPorMora(
  supabase: ReturnType<typeof conexionBD>,
  socioId: string
) {
  const today = new Date().toISOString().slice(0, 10);

  const { error } = await supabase
    .from('socio')
    .update({
      activo: false,
      fecha_baja: today,
    })
    .eq('id_socio', socioId);

  if (error) {
    throw new Error(`No se pudo desactivar al socio por mora: ${error.message}`);
  }
}

function debeBloquearLoginSocioPorMora(estado: EstadoCuotaLogin | null) {
  if (!estado?.estado_cuota) return false;

  if (estado.estado_cuota === 'sin_pagos') {
    return true;
  }

  return (
    estado.estado_cuota === 'vencido' &&
    toNumber(estado.dias_vencido) > DIAS_TOLERANCIA_MORA
  );
}

export const signIn = async (login: SignInDto) => {
  const { email, password, rol } = login;

  // Modo single-tenant: este deployment apunta a una única base de datos.
  const supabase = conexionBD();
  //BUSCO EN ESA BD, EL USUARIO
  const { data, error } = await supabase
    .from('usuario')
    .select('id,nombre,email,password_hash,rol,activo,foto,permisos_menu')
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

    const estadoCuota = await getEstadoCuotaParaLogin(supabase, socio.id_socio);
    const debeDesactivarsePorMora = debeBloquearLoginSocioPorMora(estadoCuota);

    if (debeDesactivarsePorMora && socio.activo) {
      await desactivarSocioPorMora(supabase, socio.id_socio);
      console.log(
        `Socio ${socio.id_socio} desactivado por morosidad (${estadoCuota?.estado_cuota}, ${estadoCuota?.dias_vencido} días vencido).`
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

  const payload = basePayload;
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET no está definido en las variables de entorno');
  }
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '3h' });
  return token;
};

export { LoginBusinessError };
