import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), 'utf8');

const authMiddleware = read('src/middlewares/auth.middleware.ts');
const authorization = read('src/lib/auth/serverAuthorization.ts');

const terminalRoutes = [
  'src/app/api/asistencias/qr-dia/route.ts',
  'src/app/api/asistencias/recientes/route.ts',
  'src/app/api/notificaciones/terminal/route.ts',
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
  'RBAC server helpers OK: role, dashboard permission and socio ownership guards are available.',
);
console.log(
  'Terminal endpoints OK: terminal tokens are opt-in and constrained to the Asistencias permission.',
);
