import type { JwtUser } from '@/interfaces/jwtUser.interface';
import {
  canAccessDashboardPath,
  type AppRole,
} from '@/lib/permissions/menuPermissions';
import {
  AuthMiddlewareError,
  authMiddleware,
} from '@/middlewares/auth.middleware';
import { noStoreJson } from '@/lib/security/httpRuntimeSecurity';

export class AuthorizationError extends Error {
  code: string;
  status: number;

  constructor(message: string, code = 'AUTH_FORBIDDEN', status = 403) {
    super(message);
    this.name = 'AuthorizationError';
    this.code = code;
    this.status = status;
  }
}

export function requireRoles(user: JwtUser, roles: AppRole[]) {
  if (!roles.includes(user.rol as AppRole)) {
    throw new AuthorizationError(
      'El usuario no tiene permisos para realizar esta operación',
      'AUTH_ROLE_FORBIDDEN',
    );
  }

  return user;
}

export function requireDashboardPermission(user: JwtUser, pathname: string) {
  const canAccess = canAccessDashboardPath(
    user.rol,
    user.permisos_menu ?? null,
    pathname,
  );

  if (!canAccess) {
    throw new AuthorizationError(
      'El usuario no tiene permisos para acceder a este módulo',
      'AUTH_PERMISSION_FORBIDDEN',
    );
  }

  return user;
}

export function requireAnyDashboardPermission(
  user: JwtUser,
  pathnames: string[],
) {
  const canAccess = pathnames.some((pathname) =>
    canAccessDashboardPath(
      user.rol,
      user.permisos_menu ?? null,
      pathname,
    ),
  );

  if (!canAccess) {
    throw new AuthorizationError(
      'El usuario no tiene permisos para acceder a este módulo',
      'AUTH_PERMISSION_FORBIDDEN',
    );
  }

  return user;
}

export async function authorizeDashboardRequest(
  req: Request,
  pathnames: string | string[],
  roles: AppRole[],
) {
  const { user } = await authMiddleware(req);
  requireRoles(user, roles);

  if (Array.isArray(pathnames)) {
    requireAnyDashboardPermission(user, pathnames);
  } else {
    requireDashboardPermission(user, pathnames);
  }

  return user;
}

export async function authorizePersonalOrDashboardRequest(
  req: Request,
  pathnames: string | string[],
  elevatedRoles: AppRole[] = ['admin', 'usuario'],
  personalRoles: AppRole[] = ['socio'],
) {
  const { user } = await authMiddleware(req);

  if (personalRoles.includes(user.rol as AppRole)) {
    return user;
  }

  requireRoles(user, elevatedRoles);

  if (Array.isArray(pathnames)) {
    requireAnyDashboardPermission(user, pathnames);
  } else {
    requireDashboardPermission(user, pathnames);
  }

  return user;
}

export function requireOwnUserOrRoles(
  user: JwtUser,
  userId: string,
  elevatedRoles: AppRole[] = ['admin'],
) {
  if (user.id === userId) {
    return user;
  }

  if (!elevatedRoles.includes(user.rol as AppRole)) {
    throw new AuthorizationError(
      'El usuario no puede consultar el perfil de otra cuenta',
      'AUTH_USER_SCOPE_FORBIDDEN',
    );
  }

  return user;
}

export async function authorizeOwnUserOrDashboardRequest(
  req: Request,
  userId: string,
  pathname: string,
  elevatedRoles: AppRole[] = ['admin'],
) {
  const { user } = await authMiddleware(req);

  if (user.id === userId) {
    return user;
  }

  requireRoles(user, elevatedRoles);
  requireDashboardPermission(user, pathname);
  return user;
}

export function requireOwnSocioOrRoles(
  user: JwtUser,
  socioId: string,
  elevatedRoles: AppRole[] = ['admin', 'usuario'],
) {
  if (elevatedRoles.includes(user.rol as AppRole)) {
    return user;
  }

  if (user.rol !== 'socio' || !user.id_socio || user.id_socio !== socioId) {
    throw new AuthorizationError(
      'El usuario no puede consultar información de otro socio',
      'AUTH_SOCIO_SCOPE_FORBIDDEN',
    );
  }

  return user;
}

export function authorizationErrorResponse(error: unknown) {
  if (error instanceof AuthMiddlewareError || error instanceof AuthorizationError) {
    const isServerFailure = error.status >= 500;

    if (isServerFailure) {
      console.error('Authorization runtime failure:', {
        code: error.code,
        status: error.status,
      });
    }

    return noStoreJson(
      {
        error: isServerFailure
          ? 'No se pudo validar la autorización de la solicitud'
          : error.message,
        error_code: error.code,
      },
      error.status,
    );
  }

  return null;
}
