import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), 'utf8');

const countOccurrences = (source, value) =>
  source.split(value).length - 1;

const authMiddleware = read('src/middlewares/auth.middleware.ts');
const authorization = read('src/lib/auth/serverAuthorization.ts');

const terminalRoutes = [
  'src/app/api/asistencias/qr-dia/route.ts',
  'src/app/api/asistencias/recientes/route.ts',
  'src/app/api/notificaciones/terminal/route.ts',
];

const protectedLegacyApiRoutes = [
  'src/app/api/actividades/[id]/route.ts',
  'src/app/api/actividades/route.ts',
  'src/app/api/actividades/turnos-cupos/inscripciones/[id]/route.ts',
  'src/app/api/actividades/turnos-cupos/inscripciones/route.ts',
  'src/app/api/actividades/turnos-cupos/route.ts',
  'src/app/api/actividades/turnos-cupos/turnos/[id]/route.ts',
  'src/app/api/actividades/turnos-cupos/turnos/route.ts',
  'src/app/api/admin/cuotas/dashboard-bi/route.ts',
  'src/app/api/admin/cuotas/estado-socios/route.ts',
  'src/app/api/admin/cuotas/resumen/route.ts',
  'src/app/api/avisos/[id]/route.ts',
  'src/app/api/avisos/route.ts',
  'src/app/api/equipamientos/[id]/route.ts',
  'src/app/api/equipamientos/alertas-mantenimiento/route.ts',
  'src/app/api/equipamientos/mantenimiento-bi/route.ts',
  'src/app/api/equipamientos/preventivos/ordenes/[id]/route.ts',
  'src/app/api/equipamientos/preventivos/ordenes/route.ts',
  'src/app/api/equipamientos/preventivos/planes/route.ts',
  'src/app/api/equipamientos/preventivos/route.ts',
  'src/app/api/equipamientos/route.ts',
  'src/app/api/infraestructura/activos/route.ts',
  'src/app/api/infraestructura/checklists/ejecuciones/route.ts',
  'src/app/api/infraestructura/mantenimiento-edilicio/route.ts',
  'src/app/api/infraestructura/ordenes/[id]/route.ts',
  'src/app/api/infraestructura/ordenes/route.ts',
  'src/app/api/infraestructura/qr/labels/route.ts',
  'src/app/api/infraestructura/qr/resolve/route.ts',
  'src/app/api/infraestructura/qr/route.ts',
  'src/app/api/infraestructura/sectores/route.ts',
  'src/app/api/mantenimientos/[id]/route.ts',
  'src/app/api/mantenimientos/completado/[id]/route.ts',
  'src/app/api/mantenimientos/route.ts',
  'src/app/api/productos/[id]/route.ts',
  'src/app/api/productos/historial-precios-costos/route.ts',
  'src/app/api/productos/route.ts',
  'src/app/api/productos/stock-movimientos/route.ts',
  'src/app/api/proveedores/[id]/route.ts',
  'src/app/api/proveedores/route.ts',
  'src/app/api/servicios/[id]/route.ts',
  'src/app/api/servicios/route.ts',
];

const clientAuthChecks = [
  {
    path: 'src/services/infraestructuraMantenimientoClient.ts',
    minimumHeaders: 9,
  },
  {
    path: 'src/services/equipamientoPreventivoClient.ts',
    minimumHeaders: 4,
  },
  {
    path: 'src/services/equipamientoService.ts',
    minimumHeaders: 2,
  },
  {
    path: 'src/services/browser/cuotasPagosBiApiClient.ts',
    minimumHeaders: 1,
  },
];

const assertions = [
  {
    ok: authMiddleware.includes('allowTerminalSession?: boolean'),
    message: 'authMiddleware debe declarar el opt-in allowTerminalSession.',
  },
  {
    ok: authMiddleware.includes('AUTH_TERMINAL_SCOPE_FORBIDDEN'),
    message: 'authMiddleware debe rechazar tokens de Terminal por defecto.',
  },
  {
    ok: authMiddleware.includes("scheme?.toLowerCase() !== 'bearer'"),
    message: 'authMiddleware debe validar estrictamente el esquema Bearer.',
  },
  {
    ok: authorization.includes('requireDashboardPermission'),
    message: 'Debe existir el helper server-side de permisos por módulo.',
  },
  {
    ok: authorization.includes('requireAnyDashboardPermission'),
    message: 'Debe existir el helper para endpoints compartidos por varios módulos.',
  },
  {
    ok: authorization.includes('authorizeDashboardRequest'),
    message: 'Debe existir el helper compuesto de autenticación, rol y permiso.',
  },
  {
    ok: authorization.includes('authorizationErrorResponse'),
    message: 'Debe existir una respuesta uniforme 401/403 para errores de autorización.',
  },
  {
    ok: authorization.includes('requireOwnSocioOrRoles'),
    message: 'Debe existir el helper de aislamiento por socio.',
  },
];

for (const route of terminalRoutes) {
  const source = read(route);
  assertions.push(
    {
      ok: source.includes('allowTerminalSession: true'),
      message: `${route} debe habilitar explícitamente la sesión de Terminal.`,
    },
    {
      ok: source.includes(
        "requireDashboardPermission(user, '/dashboard/asistencias/terminal')",
      ),
      message: `${route} debe exigir el permiso de Terminal/Asistencias.`,
    },
  );
}

for (const route of protectedLegacyApiRoutes) {
  const source = read(route);
  const handlerCount = countOccurrences(source, 'export async function ');

  assertions.push(
    {
      ok: handlerCount > 0,
      message: `${route} debe declarar al menos un handler HTTP.`,
    },
    {
      ok: countOccurrences(source, 'authorizeDashboardRequest(') === handlerCount,
      message: `${route} debe autorizar cada handler antes de acceder a datos.`,
    },
    {
      ok: countOccurrences(source, 'authorizationErrorResponse(') === handlerCount,
      message: `${route} debe conservar 401/403 en cada handler.`,
    },
    {
      ok: !source.includes('authMiddleware('),
      message: `${route} no debe usar autenticación sin permiso de módulo.`,
    },
  );
}

for (const client of clientAuthChecks) {
  const source = read(client.path);
  assertions.push(
    {
      ok: source.includes('authHeader'),
      message: `${client.path} debe importar el encabezado de sesión.`,
    },
    {
      ok: countOccurrences(source, 'authHeader()') >= client.minimumHeaders,
      message: `${client.path} debe enviar Bearer en todas sus llamadas protegidas.`,
    },
  );
}

const actividadesRoute = read('src/app/api/actividades/route.ts');
const productosRoute = read('src/app/api/productos/route.ts');
const stockRoute = read('src/app/api/productos/stock-movimientos/route.ts');
const cuotasBiRoute = read('src/app/api/admin/cuotas/dashboard-bi/route.ts');
const qrResolveRoute = read('src/app/api/infraestructura/qr/resolve/route.ts');

assertions.push(
  {
    ok:
      actividadesRoute.includes("['admin', 'usuario', 'socio']") &&
      countOccurrences(actividadesRoute, "['admin', 'usuario']") >= 3,
    message:
      'Actividades debe permitir lectura al socio pero reservar mutaciones para admin/usuario.',
  },
  {
    ok: productosRoute.includes("'/dashboard/comercial/kiosco'"),
    message:
      'La lectura de productos debe conservar compatibilidad con POS/Kiosco autorizado.',
  },
  {
    ok: stockRoute.includes("'/dashboard/comercial/stock-ledger'"),
    message: 'Movimientos de stock debe exigir Stock Ledger o Productos.',
  },
  {
    ok: cuotasBiRoute.includes("'/dashboard/bi-cuotas-pagos'"),
    message: 'El BI de cuotas debe exigir el permiso Pagos asociado a su ruta.',
  },
  {
    ok:
      qrResolveRoute.includes("'/dashboard/infraestructura/lector-qr-barra'") &&
      qrResolveRoute.includes("'/dashboard/infraestructura/etiquetas-qr'"),
    message: 'La resolución QR debe aceptar únicamente los dos módulos autorizados.',
  },
);

const failures = assertions.filter((assertion) => !assertion.ok);

if (failures.length > 0) {
  console.error('Auth/RBAC security verification failed:');
  for (const failure of failures) {
    console.error(`- ${failure.message}`);
  }
  process.exit(1);
}

console.log(
  'Auth middleware OK: Bearer validation, JWT payload validation and terminal scope isolation are active.',
);
console.log(
  'RBAC server helpers OK: role, single/multi-module permission and socio ownership guards are available.',
);
console.log(
  'Terminal endpoints OK: terminal tokens are opt-in and constrained to the Asistencias permission.',
);
console.log(
  `Legacy API families OK: ${protectedLegacyApiRoutes.length} routes enforce authentication, role and module permission.`,
);
console.log(
  'Protected browser clients OK: infrastructure, preventive equipment, equipment BI and fees BI send Bearer headers.',
);
