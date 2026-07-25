import { NextResponse } from 'next/server';

import {
  noStoreJson,
  readJsonBody,
  runtimeErrorResponse,
} from '@/lib/security/httpRuntimeSecurity';
import { signIn } from '@/services/loginService';

export const dynamic = 'force-dynamic';

// AUTH POLICY: PUBLIC_LOGIN

const LOGIN_BODY_MAX_BYTES = 8 * 1024;
const LOGIN_ROLES = new Set(['admin', 'usuario', 'socio']);

type LoginBody = {
  email?: unknown;
  password?: unknown;
  rol?: unknown;
};

type LoginError = Error & {
  code?: string;
  status?: number;
  details?: Record<string, unknown>;
};

function getLoginStatus(error: LoginError) {
  if (error.status) return error.status;
  if (error.message?.includes('contraseña')) return 401;
  if (error.message?.includes('inactivo')) return 403;
  if (error.message?.includes('desactiv')) return 403;
  return 500;
}

export async function POST(req: Request) {
  try {
    const body = await readJsonBody<LoginBody>(req, LOGIN_BODY_MAX_BYTES);
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const rol = typeof body.rol === 'string' ? body.rol.trim().toLowerCase() : '';

    if (!email || !password || !rol) {
      return noStoreJson(
        {
          message: 'Faltan datos',
          error_code: 'LOGIN_MISSING_FIELDS',
        },
        400,
      );
    }

    if (email.length > 254 || password.length > 256 || !LOGIN_ROLES.has(rol)) {
      return noStoreJson(
        {
          message: 'Credenciales inválidas',
          error_code: 'LOGIN_INVALID_INPUT',
        },
        400,
      );
    }

    const loginSignin = await signIn({ email, password, rol });

    return noStoreJson(
      {
        message: 'Logueado con exito',
        token: loginSignin,
      },
      200,
    );
  } catch (error) {
    const loginError = error as LoginError;
    const status = getLoginStatus(loginError);

    if (status >= 500) {
      console.error('Error en el inicio de sesión:', {
        code: loginError.code || 'LOGIN_ERROR',
        status,
      });

      return runtimeErrorResponse(
        error,
        'No se pudo iniciar sesión',
      );
    }

    return noStoreJson(
      {
        message: loginError.message || 'No se pudo iniciar sesión',
        error_code: loginError.code || 'LOGIN_ERROR',
        details: loginError.details ?? null,
      },
      status,
    );
  }
}
