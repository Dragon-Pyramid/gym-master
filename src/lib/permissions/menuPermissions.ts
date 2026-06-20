export type AppRole = "admin" | "usuario" | "socio";

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
    group: "General",
    items: [
      {
        key: "Inicio",
        label: "Inicio",
        path: "/dashboard",
        group: "General",
        roles: ["admin", "usuario", "socio"],
      },
    ],
  },
  {
    group: "Mi Gimnasio",
    items: [
      {
        key: "Control de Asistencia",
        label: "Control de Asistencia",
        path: "/dashboard/control-asistencia",
        group: "Mi Gimnasio",
        roles: ["socio"],
      },
      {
        key: "Pagar cuota",
        label: "Pagar cuota",
        path: "/dashboard/mi-cuenta/pagar-cuota",
        group: "Mi Gimnasio",
        roles: ["socio"],
      },
      {
        key: "Historial de pagos",
        label: "Historial de pagos",
        path: "/dashboard/mi-cuenta/historial-pagos",
        group: "Mi Gimnasio",
        roles: ["socio"],
      },
    ],
  },
  {
    group: "Mi Coach",
    items: [
      {
        key: "Coach IA",
        label: "Coach IA",
        path: "/dashboard/coach",
        group: "Mi Coach",
        roles: ["socio", "admin"],
      },
      {
        key: "Asistente de Rutinas",
        label: "Asistente de Rutinas",
        path: "/dashboard/rutinas/asistente",
        group: "Mi Coach",
        roles: ["socio", "admin"],
      },
      {
        key: "Asistente de Dietas",
        label: "Asistente de Dietas",
        path: "/dashboard/dietas",
        group: "Mi Coach",
        roles: ["socio", "admin"],
      },
      {
        key: "Evolución Física",
        label: "Evolución Física",
        path: "/dashboard/evolucion-fisica",
        group: "Mi Coach",
        roles: ["socio"],
      },
    ],
  },
  {
    group: "Mi Salud",
    items: [
      {
        key: "Ficha Médica",
        label: "Ficha Médica",
        path: "/dashboard/ficha-medica",
        group: "Mi Salud",
        roles: ["socio"],
      },
    ],
  },
  {
    group: "Comunicación",
    items: [
      {
        key: "Mensajes",
        label: "Mensajes",
        path: "/dashboard/mensajes",
        group: "Comunicación",
        roles: ["socio"],
      },
    ],
  },
  {
    group: "Personal y Operaciones",
    items: [
      {
        key: "Socios",
        label: "Socios",
        path: "/dashboard/socios",
        group: "Personal y Operaciones",
        roles: ["admin", "usuario"],
      },
      {
        key: "Actividades",
        label: "Actividades",
        path: "/dashboard/actividades",
        group: "Personal y Operaciones",
        roles: ["admin", "usuario"],
      },
      {
        key: "Empleados",
        label: "Empleados",
        path: "/dashboard/empleados",
        group: "Personal y Operaciones",
        roles: ["admin", "usuario"],
      },
      {
        key: "Sueldos",
        label: "Sueldos",
        path: "/dashboard/empleados-sueldos",
        group: "Personal y Operaciones",
        roles: ["admin", "usuario"],
      },
      {
        key: "Asistencias",
        label: "Asistencias",
        path: "/dashboard/asistencias",
        group: "Personal y Operaciones",
        roles: ["admin", "usuario"],
      },
      {
        key: "Salida / Aforo",
        label: "Salida / Aforo",
        path: "/dashboard/asistencias/aforo",
        group: "Personal y Operaciones",
        roles: ["admin", "usuario"],
      },
    ],
  },
  {
    group: "Infraestructura",
    items: [
      {
        key: "Mantenimiento Edilicio",
        label: "Mantenimiento Edilicio",
        path: "/dashboard/infraestructura/mantenimiento-edilicio",
        group: "Infraestructura",
        roles: ["admin", "usuario"],
      },
      {
        key: "Lector QR/barra",
        label: "Lector QR/barra",
        path: "/dashboard/infraestructura/lector-qr-barra",
        group: "Infraestructura",
        roles: ["admin", "usuario"],
      },
      {
        key: "Etiquetas QR",
        label: "Etiquetas QR",
        path: "/dashboard/infraestructura/etiquetas-qr",
        group: "Infraestructura",
        roles: ["admin", "usuario"],
      },
      {
        key: "Equipamientos",
        label: "Equipamientos",
        path: "/dashboard/equipamientos",
        group: "Infraestructura",
        roles: ["admin", "usuario"],
      },
      {
        key: "Preventivos Equipos",
        label: "Preventivos Equipos",
        path: "/dashboard/infraestructura/equipamientos/preventivos",
        group: "Infraestructura",
        roles: ["admin", "usuario"],
      },
    ],
  },
  {
    group: "Entrenamiento y Salud",
    items: [
      {
        key: "Gestión de Rutinas",
        label: "Gestión de Rutinas",
        path: "/dashboard/gestor-rutinas",
        group: "Entrenamiento y Salud",
        roles: ["admin", "usuario"],
      },
      {
        key: "Gestión de Dietas",
        label: "Gestión de Dietas",
        path: "/dashboard/gestor-dietas",
        group: "Entrenamiento y Salud",
        roles: ["admin", "usuario"],
      },
      {
        key: "Gestión Evolución Física",
        label: "Gestión Evolución Física",
        path: "/dashboard/gestor-evolucion-fisica",
        group: "Entrenamiento y Salud",
        roles: ["admin", "usuario"],
      },
      {
        key: "Media de Ejercicios",
        label: "Media de Ejercicios",
        path: "/dashboard/rutinas/media",
        group: "Entrenamiento y Salud",
        roles: ["admin", "usuario"],
      },
    ],
  },
  {
    group: "Comercial y Stock",
    items: [
      {
        key: "Comercial / Kiosco",
        label: "Comercial / Kiosco",
        path: "/dashboard/comercial",
        group: "Comercial y Stock",
        roles: ["admin", "usuario"],
      },
      {
        key: "POS / Kiosco",
        label: "POS / Kiosco",
        path: "/dashboard/comercial/kiosco",
        group: "Comercial y Stock",
        roles: ["admin", "usuario"],
      },
      {
        key: "Ventas",
        label: "Ventas",
        path: "/dashboard/ventas",
        group: "Comercial y Stock",
        roles: ["admin", "usuario"],
      },
      {
        key: "Compras",
        label: "Compras",
        path: "/dashboard/compras",
        group: "Comercial y Stock",
        roles: ["admin", "usuario"],
      },
      {
        key: "Productos",
        label: "Productos",
        path: "/dashboard/productos",
        group: "Comercial y Stock",
        roles: ["admin", "usuario"],
      },
      {
        key: "Stock Ledger",
        label: "Stock Ledger",
        path: "/dashboard/comercial/stock-ledger",
        group: "Comercial y Stock",
        roles: ["admin", "usuario"],
      },
      {
        key: "Proveedores",
        label: "Proveedores",
        path: "/dashboard/proveedores",
        group: "Comercial y Stock",
        roles: ["admin", "usuario"],
      },
      {
        key: "Servicios",
        label: "Servicios",
        path: "/dashboard/servicios",
        group: "Comercial y Stock",
        roles: ["admin", "usuario"],
      },
    ],
  },
  {
    group: "Finanzas y BI",
    items: [
      {
        key: "Pagos",
        label: "Pagos",
        path: "/dashboard/pagos",
        group: "Finanzas y BI",
        roles: ["admin", "usuario"],
      },
      {
        key: "Cuotas",
        label: "Cuota - Precio",
        path: "/dashboard/cuotas",
        group: "Finanzas y BI",
        roles: ["admin", "usuario"],
      },
      {
        key: "Gastos / Egresos",
        label: "Gastos / Egresos",
        path: "/dashboard/otros-gastos",
        group: "Finanzas y BI",
        roles: ["admin", "usuario"],
      },
      {
        key: "Finanzas / BI",
        label: "Finanzas / BI",
        path: "/dashboard/finanzas",
        group: "Finanzas y BI",
        roles: ["admin", "usuario"],
      },
      {
        key: "BI Socios / Promociones",
        label: "BI Socios / Promociones",
        path: "/dashboard/bi-socios-demografia-promociones",
        group: "Finanzas y BI",
        roles: ["admin", "usuario"],
      },
      {
        key: "Ranking / Bonificación",
        label: "Ranking / Bonificación",
        path: "/dashboard/socios-ranking-bonificacion",
        group: "Finanzas y BI",
        roles: ["admin", "usuario"],
      },
    ],
  },
  {
    group: "IA y RAG",
    items: [
      {
        key: "RAG Corpus",
        label: "RAG Corpus",
        path: "/dashboard/rag-corpus",
        group: "IA y RAG",
        roles: ["admin"],
      },
    ],
  },
  {
    group: "Comunicación y Soporte",
    items: [
      {
        key: "Notificaciones",
        label: "Notificaciones",
        path: "/dashboard/notificaciones",
        group: "Comunicación y Soporte",
        roles: ["admin", "usuario"],
      },
      {
        key: "Mensajes Socios",
        label: "Mensajes Socios",
        path: "/dashboard/mensajes-admin",
        group: "Comunicación y Soporte",
        roles: ["admin", "usuario"],
      },
      {
        key: "Avisos",
        label: "Avisos",
        path: "/dashboard/avisos",
        group: "Comunicación y Soporte",
        roles: ["admin", "usuario"],
      },
      {
        key: "Soporte Dragon Pyramid",
        label: "Soporte Dragon Pyramid",
        path: "/dashboard/soporte-dragon-pyramid",
        group: "Comunicación y Soporte",
        roles: ["admin", "usuario"],
      },
      {
        key: "Respaldo / Exportación",
        label: "Respaldo / Exportación",
        path: "/dashboard/respaldo-negocio",
        group: "Comunicación y Soporte",
        roles: ["admin"],
      },
    ],
  },
  {
    group: "Administración del Sistema",
    items: [
      {
        key: "Usuarios",
        label: "Usuarios",
        path: "/dashboard/usuarios",
        group: "Administración del Sistema",
        roles: ["admin"],
      },
      {
        key: "Datos del Gimnasio",
        label: "Datos del Gimnasio",
        path: "/dashboard/gimnasio-parametrizacion",
        group: "Administración del Sistema",
        roles: ["admin"],
      },
      {
        key: "Parametrización",
        label: "Parametrización",
        path: "/dashboard/parametrizacion",
        group: "Administración del Sistema",
        roles: ["admin"],
      },
    ],
  },
  {
    group: "Configuración personal",
    items: [
      {
        key: "Perfil",
        label: "Perfil",
        path: "/dashboard/perfil",
        group: "Configuración personal",
        roles: ["admin", "usuario", "socio"],
      },
      {
        key: "Preferencias",
        label: "Preferencias",
        path: "/dashboard/settings/preferences",
        group: "Configuración personal",
        roles: ["admin", "usuario", "socio"],
      },
    ],
  },
];

export const DEFAULT_MENU_PERMISSIONS_BY_ROLE: Record<AppRole, string[]> = {
  admin: MENU_PERMISSION_GROUPS.flatMap((group) =>
    group.items
      .filter((item) => item.roles.includes("admin"))
      .map((item) => item.key),
  ),
  usuario: [
    "Inicio",
    "Socios",
    "Ranking / Bonificación",
    "Asistencias",
    "Salida / Aforo",
    "Pagos",
    "Comercial / Kiosco",
    "POS / Kiosco",
    "Ventas",
    "Notificaciones",
    "Mensajes Socios",
    "Soporte Dragon Pyramid",
    "Perfil",
    "Preferencias",
  ],
  socio: [
    "Inicio",
    "Control de Asistencia",
    "Ficha Médica",
    "Asistente de Rutinas",
    "Asistente de Dietas",
    "Mensajes",
    "Pagar cuota",
    "Historial de pagos",
    "Evolución Física",
    "Coach IA",
    "Perfil",
    "Preferencias",
  ],
};

export type DashboardRoutePermission = {
  path: string;
  permissionKey: string;
  roles: AppRole[];
  exact?: boolean;
};

const MENU_DASHBOARD_ROUTE_PERMISSIONS: DashboardRoutePermission[] =
  MENU_PERMISSION_GROUPS.flatMap((group) =>
    group.items.map((item) => ({
      path: item.path,
      permissionKey: item.key,
      roles: item.roles,
      exact: item.path === "/dashboard",
    })),
  );

export const DASHBOARD_ROUTE_PERMISSIONS: DashboardRoutePermission[] = [
  ...MENU_DASHBOARD_ROUTE_PERMISSIONS,
  {
    path: "/dashboard/admin",
    permissionKey: "Inicio",
    roles: ["admin"],
    exact: true,
  },
  {
    path: "/dashboard/bi-cuotas-pagos",
    permissionKey: "Pagos",
    roles: ["admin", "usuario"],
    exact: true,
  },
  {
    path: "/dashboard/gestion-dietas",
    permissionKey: "Gestión de Dietas",
    roles: ["admin", "usuario"],
    exact: false,
  },
  {
    path: "/dashboard/asistencias/terminal",
    permissionKey: "Asistencias",
    roles: ["admin", "usuario"],
    exact: true,
  },
  {
    path: "/dashboard/ventas-detalle",
    permissionKey: "Ventas",
    roles: ["admin", "usuario"],
    exact: true,
  },
  {
    // Ruta personal del socio para visualizar/generar rutinas.
    // Se mantiene separada de /dashboard/rutinas/media, que continúa
    // protegida por el permiso administrativo "Media de Ejercicios".
    path: "/dashboard/rutinas",
    permissionKey: "Asistente de Rutinas",
    roles: ["socio", "admin"],
    exact: false,
  },
];

function normalizeDashboardPath(pathname?: string | null) {
  if (!pathname) return "/dashboard";
  const cleanPath = pathname.split("?")[0].split("#")[0];
  if (cleanPath === "/") return "/";
  return cleanPath.replace(/\/$/, "") || "/dashboard";
}

function normalizeAppRole(role?: string | null): AppRole | null {
  if (role === "admin" || role === "usuario" || role === "socio") {
    return role;
  }

  return null;
}


function withImplicitCoachPermission(role: AppRole, permissions: string[]) {
  const merged = Array.from(new Set(permissions));

  // Compatibilidad hacia atrás: muchos socios ya tienen permisos_menu
  // guardado antes de existir el módulo Coach IA. Si el socio podía usar
  // rutinas, dietas o evolución física, también puede acceder al Coach IA
  // porque el chat unificado solo orquesta esas capacidades personales.
  if (
    role === "socio" &&
    !merged.includes("Coach IA") &&
    (merged.includes("Asistente de Rutinas") ||
      merged.includes("Asistente de Dietas") ||
      merged.includes("Evolución Física"))
  ) {
    merged.push("Coach IA");
  }

  return merged;
}

function getAllowedPermissionKeysForRole(role: AppRole) {
  return new Set(
    MENU_PERMISSION_GROUPS.flatMap((group) =>
      group.items
        .filter((item) => item.roles.includes(role))
        .map((item) => item.key),
    ),
  );
}

export function getDashboardRoutePermission(pathname?: string | null) {
  const normalizedPath = normalizeDashboardPath(pathname);

  const exactMatch = DASHBOARD_ROUTE_PERMISSIONS.find(
    (route) =>
      normalizeDashboardPath(route.path) === normalizedPath &&
      route.exact !== false,
  );

  if (exactMatch) return exactMatch;

  return DASHBOARD_ROUTE_PERMISSIONS.filter((route) => route.exact === false)
    .sort((a, b) => b.path.length - a.path.length)
    .find((route) => {
      const normalizedRoutePath = normalizeDashboardPath(route.path);
      return (
        normalizedPath === normalizedRoutePath ||
        normalizedPath.startsWith(`${normalizedRoutePath}/`)
      );
    });
}

export function canAccessDashboardPath(
  role?: string | null,
  permissions?: string[] | null,
  pathname?: string | null,
) {
  const normalizedRole = normalizeAppRole(role);
  if (!normalizedRole) return false;

  const routePermission = getDashboardRoutePermission(pathname);

  if (!routePermission) {
    return normalizedRole === "admin";
  }

  if (!routePermission.roles.includes(normalizedRole)) {
    return false;
  }

  if (normalizedRole === "admin") {
    return true;
  }

  return getEffectiveMenuPermissions(normalizedRole, permissions).includes(
    routePermission.permissionKey,
  );
}

export function getAvailableMenuPermissionsForRole(role?: string | null) {
  const normalizedRole = (role || "socio") as AppRole;
  if (!["admin", "usuario", "socio"].includes(normalizedRole)) return [];

  return MENU_PERMISSION_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.roles.includes(normalizedRole)),
  })).filter((group) => group.items.length > 0);
}

export function sanitizeMenuPermissionsForRole(
  role: string | undefined,
  permissions?: unknown,
): string[] | null {
  const normalizedRole = (role || "socio") as AppRole;

  if (normalizedRole === "admin") {
    return null;
  }

  if (!["usuario", "socio"].includes(normalizedRole)) {
    return [];
  }

  const allowed = getAllowedPermissionKeysForRole(normalizedRole);

  if (!Array.isArray(permissions)) {
    return [...(DEFAULT_MENU_PERMISSIONS_BY_ROLE[normalizedRole] ?? [])].filter(
      (item) => allowed.has(item),
    );
  }

  const clean = permissions
    .filter((item): item is string => typeof item === "string")
    .filter((item) => allowed.has(item));

  return Array.from(new Set(clean));
}

export function getEffectiveMenuPermissions(
  role?: string | null,
  permissions?: string[] | null,
) {
  const normalizedRole = (role || "socio") as AppRole;

  if (normalizedRole === "admin") {
    return DEFAULT_MENU_PERMISSIONS_BY_ROLE.admin;
  }

  if (normalizedRole === "usuario" || normalizedRole === "socio") {
    const allowed = getAllowedPermissionKeysForRole(normalizedRole);

    if (Array.isArray(permissions)) {
      return withImplicitCoachPermission(
        normalizedRole,
        permissions.filter((item) => allowed.has(item)),
      );
    }

    return withImplicitCoachPermission(
      normalizedRole,
      DEFAULT_MENU_PERMISSIONS_BY_ROLE[normalizedRole] ?? [],
    );
  }

  return [];
}
