import * as jwt from 'jsonwebtoken';

import type { JwtUser } from '@/interfaces/jwtUser.interface';
import { canAccessDashboardPath } from '@/lib/permissions/menuPermissions';
import { noStoreJson } from '@/lib/security/httpRuntimeSecurity';

export const dynamic = 'force-dynamic';

// AUTH POLICY: TERMINAL_BEARER_REFRESH

type TerminalSessionPayload = JwtUser & {
  terminal_session?: boolean;
  terminal_issued_at?: string;
};

function getBearerToken(req: Request) {
  const authorization = req.headers.get('authorization')?.trim() ?? '';
  const [scheme, token, ...rest] = authorization.split(/\s+/);

  if (scheme?.toLowerCase() !== 'bearer' || !token || rest.length > 0) {
    return '';
  }

  return token;
}

function getTerminalJwtExpiresIn() {
  return (process.env.JWT_TERMINAL_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];
}

export async function POST(req: Request) {
  try {
    const token = getBearerToken(req);

    if (!token) {
      return noStoreJson(
        {
          error: 'Token no proporcionado',
          error_code: 'TERMINAL_SESSION_TOKEN_MISSING',
        },
        401,
      );
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET no está configurado para renovar Terminal.');
      return noStoreJson(
        {
          error: 'No se pudo renovar la sesión de Terminal.',
          error_code: 'TERMINAL_SESSION_CONFIGURATION_ERROR',
        },
        500,
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || typeof decoded === 'string') {
      return noStoreJson(
        {
          error: 'Token inválido',
          error_code: 'TERMINAL_SESSION_TOKEN_INVALID',
        },
        401,
      );
    }

    const user = decoded as TerminalSessionPayload;

    if (user.must_change_password) {
      return noStoreJson(
        {
          error: 'El usuario debe cambiar su contraseña antes de abrir la Terminal.',
          error_code: 'TERMINAL_SESSION_PASSWORD_CHANGE_REQUIRED',
        },
        403,
      );
    }

    const canAccessTerminal = canAccessDashboardPath(
      user.rol,
      user.permisos_menu ?? null,
      '/dashboard/asistencias/terminal',
    );

    if (!canAccessTerminal) {
      return noStoreJson(
        {
          error: 'El usuario no tiene permisos para renovar la sesión de Terminal.',
          error_code: 'TERMINAL_SESSION_FORBIDDEN',
        },
        403,
      );
    }

    const payload: TerminalSessionPayload = {
      sub: user.sub || user.id,
      id: user.id,
      id_socio: user.id_socio ?? '',
      email: user.email,
      rol: user.rol,
      nombre: user.nombre,
      foto: user.foto ?? null,
      permisos_menu: user.permisos_menu ?? null,
      must_change_password: Boolean(user.must_change_password),
      terminal_session: true,
      terminal_issued_at: new Date().toISOString(),
    };

    const refreshedToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: getTerminalJwtExpiresIn(),
    });

    const refreshedDecoded = jwt.decode(refreshedToken) as TerminalSessionPayload | null;

    return noStoreJson(
      {
        token: refreshedToken,
        expires_at: refreshedDecoded?.exp
          ? new Date(refreshedDecoded.exp * 1000).toISOString()
          : null,
      },
      200,
    );
  } catch (error) {
    const isExpired = error instanceof jwt.TokenExpiredError;

    return noStoreJson(
      {
        error: isExpired
          ? 'La sesión de Terminal expiró. Iniciá sesión nuevamente para reactivar la pantalla.'
          : 'No se pudo renovar la sesión de Terminal.',
        error_code: isExpired
          ? 'TERMINAL_SESSION_EXPIRED'
          : 'TERMINAL_SESSION_REFRESH_ERROR',
      },
      401,
    );
  }
}
