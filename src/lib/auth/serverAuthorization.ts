import type { JwtUser } from '@/interfaces/jwtUser.interface';
import {
  canAccessDashboardPath,
  type AppRole,
} from '@/lib/permissions/menuPermissions';

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
