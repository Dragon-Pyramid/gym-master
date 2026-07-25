import { JwtUser } from '@/interfaces/jwtUser.interface';
import * as jwt from 'jsonwebtoken';

const APP_ROLES = new Set(['admin', 'usuario', 'socio', 'masteradmin']);

export type AuthMiddlewareOptions = {
  allowTerminalSession?: boolean;
};

export class AuthMiddlewareError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status = 401) {
    super(message);
    this.name = 'AuthMiddlewareError';
    this.code = code;
    this.status = status;
  }
}

function getBearerToken(req: Request) {
  const authorization = req.headers.get('authorization')?.trim() ?? '';
  const [scheme, token, ...rest] = authorization.split(/\s+/);

  if (scheme?.toLowerCase() !== 'bearer' || !token || rest.length > 0) {
    return '';
  }

  return token;
}

function isValidJwtUser(value: unknown): value is JwtUser {
  if (!value || typeof value !== 'object') return false;

  const user = value as Partial<JwtUser>;

  return Boolean(
    typeof user.id === 'string' &&
      user.id.trim().length > 0 &&
      typeof user.email === 'string' &&
      user.email.trim().length > 0 &&
      typeof user.rol === 'string' &&
      APP_ROLES.has(user.rol),
  );
}

export async function authMiddleware(
  req: Request,
  options: AuthMiddlewareOptions = {},
): Promise<{ user: JwtUser }> {
  const token = getBearerToken(req);

  if (!token) {
    throw new AuthMiddlewareError(
      'Token no proporcionado',
      'AUTH_TOKEN_MISSING',
    );
  }

  if (!process.env.JWT_SECRET) {
    throw new AuthMiddlewareError(
      'JWT_SECRET no está definido en las variables de entorno',
      'AUTH_JWT_SECRET_MISSING',
      500,
    );
  }

  let decoded: string | jwt.JwtPayload;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthMiddlewareError(
        'Token expirado',
        'AUTH_TOKEN_EXPIRED',
      );
    }

    throw new AuthMiddlewareError(
      'Token inválido',
      'AUTH_TOKEN_INVALID',
    );
  }

  if (typeof decoded === 'string' || !isValidJwtUser(decoded)) {
    throw new AuthMiddlewareError(
      'Token inválido',
      'AUTH_TOKEN_INVALID',
    );
  }

  const user = decoded as JwtUser;

  if (user.terminal_session && !options.allowTerminalSession) {
    throw new AuthMiddlewareError(
      'No autorizado: la sesión de Terminal no puede utilizarse en este endpoint',
      'AUTH_TERMINAL_SCOPE_FORBIDDEN',
      403,
    );
  }

  return { user };
}
