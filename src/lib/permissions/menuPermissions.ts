export type AppRole = 'admin' | 'usuario' | 'socio';

export type MenuPermissionOption = {
  key: string;
  label: string;
  path: string;
  group: string;
  roles: AppRole[];
};

export const MENU_PERMISSION_GROUPS: Array<{
  group: string;
  items: MenuPermissionOption[];
}> = [
  {
    group: 'General',
    items: [
      {
        key: 'Inicio',
        label: 'Inicio',
        path: '/dashboard',
        group: 'General',
        roles: ['admin', 'usuario', 'socio'],
      },
    ],
  },
  {
    group: 'Menú personal / socio',
    items: [
      {
        key: 'Control de Asistencia',
        label: 'Control de Asistencia',
        path: '/dashboard/control-asistencia',
        group: 'Menú personal / socio',
        roles: ['socio'],
      },
      {
        key: 'Ficha Médica',
        label: 'Ficha Médica',
        path: '/dashboard/ficha-medica',
        group: 'Menú personal / socio',
        roles: ['socio'],
      },
      {
        key: 'Pagar cuota',
        label: 'Pagar cuota',
        path: '/dashboard/mi-cuenta/pagar-cuota',
        group: 'Menú personal / socio',
        roles: ['socio'],
      },
      {
        key: 'Historial de pagos',
        label: 'Historial de pagos',
        path: '/dashboard/mi-cuenta/historial-pagos',
        group: 'Menú personal / socio',
        roles: ['socio'],
      },
      {
        key: 'Evolución Física',
        label: 'Evolución Física',
        path: '/dashboard/evolucion-fisica',
        group: 'Menú personal / socio',
        roles: ['socio', 'admin'],
      },
    ],
  },
  {
    group: 'Gestión de gimnasio',
    items: [
      {
        key: 'Socios',
        label: 'Socios',
        path: '/dashboard/socios',
        group: 'Gestión de gimnasio',
        roles: ['admin', 'usuario'],
      },
      {
        key: 'Actividades',
        label: 'Actividades',
        path: '/dashboard/actividades',
        group: 'Gestión de gimnasio',
        roles: ['admin'],
      },
      {
        key: 'Entrenadores',
        label: 'Entrenadores',
        path: '/dashboard/entrenadores',
        group: 'Gestión de gimnasio',
        roles: ['admin'],
      },
      {
        key: 'Rutinas',
        label: 'Rutinas',
        path: '/dashboard/rutinas',
        group: 'Gestión de gimnasio',
        roles: ['admin', 'usuario', 'socio'],
      },
      {
        key: 'Dietas',
        label: 'Dietas',
        path: '/dashboard/dietas',
        group: 'Gestión de gimnasio',
        roles: ['admin', 'usuario', 'socio'],
      },
    ],
  },
  {
    group: 'Administración',
    items: [
      {
        key: 'Asistencias',
        label: 'Asistencias',
        path: '/dashboard/asistencias',
        group: 'Administración',
        roles: ['admin', 'usuario'],
      },
      {
        key: 'Gestión de Rutinas',
        label: 'Gestión de Rutinas',
        path: '/dashboard/gestor-rutinas',
        group: 'Administración',
        roles: ['admin'],
      },
      {
        key: 'Gestión de Dietas',
        label: 'Gestión de Dietas',
        path: '/dashboard/gestor-dietas',
        group: 'Administración',
        roles: ['admin'],
      },
      {
        key: 'Pagos',
        label: 'Pagos',
        path: '/dashboard/pagos',
        group: 'Administración',
        roles: ['admin', 'usuario'],
      },
      {
        key: 'Ventas',
        label: 'Ventas',
        path: '/dashboard/ventas',
        group: 'Administración',
        roles: ['admin', 'usuario'],
      },
      {
        key: 'Cuotas',
        label: 'Cuota - Precio',
        path: '/dashboard/cuotas',
        group: 'Administración',
        roles: ['admin'],
      },
      {
        key: 'Proveedores',
        label: 'Proveedores',
        path: '/dashboard/proveedores',
        group: 'Administración',
        roles: ['admin'],
      },
      {
        key: 'Usuarios',
        label: 'Usuarios',
        path: '/dashboard/usuarios',
        group: 'Administración',
        roles: ['admin'],
      },
      {
        key: 'Productos',
        label: 'Productos',
        path: '/dashboard/productos',
        group: 'Administración',
        roles: ['admin'],
      },
      {
        key: 'Servicios',
        label: 'Servicios',
        path: '/dashboard/servicios',
        group: 'Administración',
        roles: ['admin'],
      },
      {
        key: 'Otros gastos',
        label: 'Otros gastos',
        path: '/dashboard/otros-gastos',
        group: 'Administración',
        roles: ['admin'],
      },
      {
        key: 'Avisos',
        label: 'Avisos',
        path: '/dashboard/avisos',
        group: 'Administración',
        roles: ['admin'],
      },
      {
        key: 'Equipamientos',
        label: 'Equipamientos',
        path: '/dashboard/equipamientos',
        group: 'Administración',
        roles: ['admin'],
      },
      {
        key: 'Parametrización',
        label: 'Parametrización',
        path: '/dashboard/parametrizacion',
        group: 'Administración',
        roles: ['admin'],
      },
    ],
  },
  {
    group: 'Configuración personal',
    items: [
      {
        key: 'Perfil',
        label: 'Perfil',
        path: '/dashboard/perfil',
        group: 'Configuración personal',
        roles: ['admin', 'usuario', 'socio'],
      },
      {
        key: 'Preferencias',
        label: 'Preferencias',
        path: '/dashboard/settings/preferences',
        group: 'Configuración personal',
        roles: ['admin', 'usuario', 'socio'],
      },
    ],
  },
];

export const DEFAULT_MENU_PERMISSIONS_BY_ROLE: Record<AppRole, string[]> = {
  admin: MENU_PERMISSION_GROUPS.flatMap((group) =>
    group.items.filter((item) => item.roles.includes('admin')).map((item) => item.key)
  ),
  usuario: [
    'Inicio',
    'Asistencias',
    'Socios',
    'Pagos',
    'Ventas',
    'Rutinas',
    'Dietas',
    'Perfil',
    'Preferencias',
  ],
  socio: [
    'Inicio',
    'Control de Asistencia',
    'Ficha Médica',
    'Pagar cuota',
    'Historial de pagos',
    'Rutinas',
    'Dietas',
    'Evolución Física',
    'Perfil',
    'Preferencias',
  ],
};

export function getAvailableMenuPermissionsForRole(role?: string | null) {
  const normalizedRole = (role || 'socio') as AppRole;
  if (!['admin', 'usuario', 'socio'].includes(normalizedRole)) return [];

  return MENU_PERMISSION_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.roles.includes(normalizedRole)),
  })).filter((group) => group.items.length > 0);
}

export function sanitizeMenuPermissionsForRole(
  role: string | undefined,
  permissions?: unknown
): string[] | null {
  const normalizedRole = (role || 'socio') as AppRole;

  if (normalizedRole === 'admin') {
    return null;
  }

  const allowed = new Set(DEFAULT_MENU_PERMISSIONS_BY_ROLE[normalizedRole] ?? []);

  if (!Array.isArray(permissions)) {
    return [...allowed];
  }

  const clean = permissions
    .filter((item): item is string => typeof item === 'string')
    .filter((item) => allowed.has(item));

  return Array.from(new Set(clean));
}

export function getEffectiveMenuPermissions(
  role?: string | null,
  permissions?: string[] | null
) {
  const normalizedRole = (role || 'socio') as AppRole;

  if (normalizedRole === 'admin') {
    return DEFAULT_MENU_PERMISSIONS_BY_ROLE.admin;
  }

  if (Array.isArray(permissions)) {
    return permissions;
  }

  return DEFAULT_MENU_PERMISSIONS_BY_ROLE[normalizedRole] ?? [];
}
