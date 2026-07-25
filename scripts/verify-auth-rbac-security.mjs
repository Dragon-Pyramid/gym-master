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

const protectedSensitiveDashboardRoutes = [
  'src/app/api/admin/metricas/pagos/histograma/route.ts',
  'src/app/api/admin/metricas/pagos/proyeccion-ingresos/route.ts',
  'src/app/api/admin/metricas/pagos/segmentacion/route.ts',
  'src/app/api/admin/metricas/rutinas/adherencia/route.ts',
  'src/app/api/admin/metricas/rutinas/evolucion-promedio/route.ts',
  'src/app/api/admin/metricas/rutinas/generar-rutina/route.ts',
  'src/app/api/admin/metricas/rutinas/generar-rutina-personalizada/route.ts',
  'src/app/api/admin/socios-mensajes/[id]/route.ts',
  'src/app/api/admin/socios-mensajes/resumen/route.ts',
  'src/app/api/admin/socios-mensajes/route.ts',
  'src/app/api/dieta/todas/route.ts',
  'src/app/api/dragon-pyramid/license/reactivate/route.ts',
  'src/app/api/dragon-pyramid/license/route.ts',
  'src/app/api/evolucion_socio/admin/resumen/route.ts',
  'src/app/api/notificaciones/[id]/enviar/route.ts',
  'src/app/api/notificaciones/[id]/route.ts',
  'src/app/api/notificaciones/plantillas/route.ts',
  'src/app/api/notificaciones/route.ts',
  'src/app/api/pagos/[id]/route.ts',
  'src/app/api/pagos/route.ts',
  'src/app/api/socios/demografia-promociones-bi/route.ts',
  'src/app/api/socios/mensajes/route.ts',
  'src/app/api/socios/ranking-bonificacion-mensual/route.ts',
  'src/app/api/socios/route.ts',
];

const protectedPersonalResourceRoutes = [
  'src/app/api/dieta/[id]/route.ts',
  'src/app/api/dieta/generar/route.ts',
  'src/app/api/dieta/rag-assistant/generar/route.ts',
  'src/app/api/dieta/socio/[id]/route.ts',
  'src/app/api/evolucion_socio/[socio_id]/route.ts',
  'src/app/api/evolucion_socio/rag-assistant/analizar/route.ts',
  'src/app/api/evolucion_socio/registro/route.ts',
  'src/app/api/rutina/[idSocio]/route.ts',
  'src/app/api/rutina/delete/[id]/route.ts',
  'src/app/api/rutina/generar/route.ts',
  'src/app/api/rutina/historial/[id_socio]/route.ts',
  'src/app/api/rutina/historial/route.ts',
  'src/app/api/rutina/training-sessions/[id]/route.ts',
  'src/app/api/rutina/training-sessions/route.ts',
  'src/app/api/rutinas/rag-assistant/generar/route.ts',
  'src/app/api/socios/[id]/ficha-medica/[id_ficha]/route.ts',
  'src/app/api/socios/[id]/ficha-medica/actual/route.ts',
  'src/app/api/socios/[id]/ficha-medica/historial/route.ts',
  'src/app/api/socios/[id]/ficha-medica/route.ts',
  'src/app/api/socios/[id]/route.ts',
];

// Final Auth/RBAC sweep: every remaining operational API receives an explicit
// dashboard, personal, self-account or controlled-public policy.
const protectedFinalDashboardRoutes = [
  'src/app/api/admin/metricas/asistencia/[tipo]/route.ts',
  'src/app/api/admin/metricas/asistencia/prediccion-abandono/route.ts',
  'src/app/api/admin/metricas/asistencia/top-inactivos/route.ts',
  'src/app/api/admin/metricas/equipamiento/costo-beneficio/route.ts',
  'src/app/api/admin/metricas/equipamiento/estado-actual/route.ts',
  'src/app/api/admin/metricas/equipamiento/prediccion-fallo/route.ts',
  'src/app/api/admin/metricas/equipamiento/top-fallos/route.ts',
  'src/app/api/admin/metricas/retencion_por_combinacion/route.ts',
  'src/app/api/admin/respaldo-negocio/exportar/route.ts',
  'src/app/api/admin/respaldo-negocio/route.ts',
  'src/app/api/asistencias/[id]/salida/route.ts',
  'src/app/api/asistencias/aforo/route.ts',
  'src/app/api/asistencias/ranking-mensual/route.ts',
  'src/app/api/asistencias/route.ts',
  'src/app/api/comercial/caja/route.ts',
  'src/app/api/comercial/codigos/labels/route.ts',
  'src/app/api/comercial/codigos/qr/route.ts',
  'src/app/api/comercial/compras-reposicion/route.ts',
  'src/app/api/comercial/kiosco-pos/route.ts',
  'src/app/api/comercial/mobile-scanner/route.ts',
  'src/app/api/comercial/pack-analytics/route.ts',
  'src/app/api/comercial/servicios-promociones/route.ts',
  'src/app/api/comercial/stock-ledger/route.ts',
  'src/app/api/compras/[id]/route.ts',
  'src/app/api/compras/route.ts',
  'src/app/api/cuota/[id]/route.ts',
  'src/app/api/cuota/route.ts',
  'src/app/api/empleados-sueldos/[id]/route.ts',
  'src/app/api/empleados-sueldos/route.ts',
  'src/app/api/empleados/[id]/route.ts',
  'src/app/api/empleados/route.ts',
  'src/app/api/entrenadores/[id]/horarios/route.ts',
  'src/app/api/entrenadores/[id]/route.ts',
  'src/app/api/entrenadores/route.ts',
  'src/app/api/finanzas/dashboard-bi/route.ts',
  'src/app/api/gimnasio-parametrizacion/logo-upload/route.ts',
  'src/app/api/gimnasio-parametrizacion/route.ts',
  'src/app/api/gimnasio-parametrizacion/stripe-status/route.ts',
  'src/app/api/niveles/route.ts',
  'src/app/api/objetivos/route.ts',
  'src/app/api/otros_gastos/comprobante-upload/route.ts',
  'src/app/api/otros_gastos/route.ts',
  'src/app/api/pagar-cuota/confirmar/route.ts',
  'src/app/api/pagar-cuota/route.ts',
  'src/app/api/parametrizacion/catalogos/route.ts',
  'src/app/api/parametrizacion/cuotas-descuento/route.ts',
  'src/app/api/rag/coach/chat/route.ts',
  'src/app/api/rag/coach/corpus/run/route.ts',
  'src/app/api/rag/coach/corpus/status/route.ts',
  'src/app/api/rag/coach/ingest/dietas/route.ts',
  'src/app/api/rag/coach/ingest/ejercicios/route.ts',
  'src/app/api/rag/coach/search/route.ts',
  'src/app/api/rag/coach/status/route.ts',
  'src/app/api/rag/coach/vectorize/pending/route.ts',
  'src/app/api/rutinas/ejercicios-media/equivalence-sync/route.ts',
  'src/app/api/rutinas/ejercicios-media/import/route.ts',
  'src/app/api/rutinas/ejercicios-media/route.ts',
  'src/app/api/rutinas/ejercicios-media/upload/route.ts',
  'src/app/api/rutinas/ejercicios-media/youtube-auto-discovery/route.ts',
  'src/app/api/rutinas/ejercicios-media/youtube-import/route.ts',
  'src/app/api/soporte/tickets/[id]/route.ts',
  'src/app/api/soporte/tickets/route.ts',
  'src/app/api/test-alertas/route.ts',
  'src/app/api/usuarios/[id]/route.ts',
  'src/app/api/usuarios/route.ts',
  'src/app/api/ventas/[id]/route.ts',
  'src/app/api/ventas/route.ts',
  'src/app/api/ventas_detalles/route.ts',
];

const protectedFinalPersonalRoutes = [
  'src/app/api/asistencias/registro-qr/route.ts',
  'src/app/api/cuota-estado/route.ts',
];

const protectedOwnUserRoutes = [
  'src/app/api/usuarios/[id]/perfil/route.ts',
];

const authenticatedOnlyRoutes = [
  'src/app/api/auth/change-password/route.ts',
  'src/app/api/dragon-pyramid/license/suspension-status/route.ts',
  'src/app/api/dragon-pyramid/license/warning/route.ts',
  'src/app/api/file-upload/route.ts',
  'src/app/api/mi-cuenta/pagos/route.ts',
  'src/app/api/notificaciones/header/route.ts',
];

const explicitNonJwtPolicies = [
  {
    path: 'src/app/api/auth/[...nextauth]/route.ts',
    marker: 'AUTH POLICY: PUBLIC_AUTH_PROVIDER',
    snippets: ['NextAuth'],
  },
  {
    path: 'src/app/api/auth/forgot-password/route.ts',
    marker: 'AUTH POLICY: PUBLIC_RECOVERY',
    snippets: ['requestPasswordReset'],
  },
  {
    path: 'src/app/api/auth/reset-password/route.ts',
    marker: 'AUTH POLICY: PUBLIC_RECOVERY_TOKEN',
    snippets: ['validatePasswordResetToken', 'resetPasswordWithToken'],
  },
  {
    path: 'src/app/api/auth/terminal-session/refresh/route.ts',
    marker: 'AUTH POLICY: TERMINAL_BEARER_REFRESH',
    snippets: ['terminal_session', 'jwt.verify'],
  },
  {
    path: 'src/app/api/comercial/mobile-scanner/public/[token]/route.ts',
    marker: 'AUTH POLICY: PUBLIC_TOKEN',
    snippets: ['PUBLIC_SCANNER_TOKEN_RE', 'Cache-Control'],
  },
  {
    path: 'src/app/api/custom-login/route.ts',
    marker: 'AUTH POLICY: PUBLIC_LOGIN',
    snippets: ['signIn', 'LOGIN_MISSING_FIELDS'],
  },
  {
    path: 'src/app/api/image-proxy/route.ts',
    marker: 'AUTH POLICY: PUBLIC_CONTROLLED',
    snippets: ['assertSafeImageUrl', "redirect: 'manual'", 'MAX_IMAGE_BYTES'],
  },
  {
    path: 'src/app/api/internal/dragon-pyramid/license-sync/route.ts',
    marker: 'AUTH POLICY: INTERNAL_SHARED_SECRET',
    snippets: ['timingSafeEqual', 'x-dragon-pyramid-sync-key'],
  },
  {
    path: 'src/app/api/pagos/[id]/verificar/route.ts',
    marker: 'AUTH POLICY: PUBLIC_VERIFICATION_CODE',
    snippets: ['isPagoVerificationCodeValid'],
  },
  {
    path: 'src/app/api/stripe-webhook/route.ts',
    marker: 'AUTH POLICY: PUBLIC_SIGNED_WEBHOOK',
    snippets: ['constructEvent', 'stripe-signature'],
  },
  {
    path: 'src/app/api/swagger-json/route.ts',
    marker: 'AUTH POLICY: PUBLIC_DOCUMENTATION',
    snippets: ['openApiSpec'],
  },
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

const sensitiveClientAuthChecks = [
  {
    path: 'src/services/apiClient.ts',
    requiredSnippets: [
      '/api/rutina/historial',
      '/api/dieta/todas',
      '/api/evolucion_socio/registro',
      '/api/notificaciones',
      '/api/dragon-pyramid/license',
    ],
  },
  {
    path: 'src/services/browser/pagoApiClient.ts',
    requiredSnippets: ['/api/pagos', 'authHeader()'],
  },
  {
    path: 'src/services/browser/socioApiClient.ts',
    requiredSnippets: ['/api/socios', 'authHeader()'],
  },
  {
    path: 'src/services/sociosDemografiaBiService.ts',
    requiredSnippets: ['/api/socios/demografia-promociones-bi', 'authHeader()'],
  },
  {
    path: 'src/services/sociosRankingBonificacionService.ts',
    requiredSnippets: ['/api/socios/ranking-bonificacion-mensual', 'authHeader()'],
  },
  {
    path: 'src/services/evolucionSocioClient.ts',
    requiredSnippets: ['/api/evolucion_socio', 'authHeaders('],
  },
];

const finalClientAuthChecks = [
  {
    path: 'src/services/browser/usuarioApiClient.ts',
    requiredSnippets: ['/api/usuarios', 'authHeader()'],
  },
  {
    path: 'src/services/browser/respaldoNegocioApiClient.ts',
    requiredSnippets: ['/api/admin/respaldo-negocio', 'authHeader()'],
  },
  {
    path: 'src/services/asistenciaAforoService.ts',
    requiredSnippets: ['/api/asistencias/aforo', 'authHeader()'],
  },
  {
    path: 'src/services/qrService.ts',
    requiredSnippets: ['/api/asistencias/registro-qr', 'authHeader()'],
  },
  {
    path: 'src/services/comercialCajaService.ts',
    requiredSnippets: ['/api/comercial/caja', 'Authorization'],
  },
  {
    path: 'src/services/comercialCodigosService.ts',
    requiredSnippets: ['/api/comercial/codigos/labels', 'Authorization'],
  },
  {
    path: 'src/services/comercialComprasReposicionService.ts',
    requiredSnippets: ['/api/comercial/compras-reposicion', 'authHeader()'],
  },
  {
    path: 'src/services/comercialKioscoService.ts',
    requiredSnippets: ['/api/productos', 'Authorization'],
  },
  {
    path: 'src/services/comercialPackAnalyticsService.ts',
    requiredSnippets: ['/api/comercial/pack-analytics', 'Authorization'],
  },
  {
    path: 'src/services/comercialServiciosPromocionesService.ts',
    requiredSnippets: ['/api/comercial/servicios-promociones', 'authHeader()'],
  },
  {
    path: 'src/services/comercialStockLedgerService.ts',
    requiredSnippets: ['/api/comercial/stock-ledger', 'Authorization'],
  },
  {
    path: 'src/services/compraService.ts',
    requiredSnippets: ['/api/compras', 'authHeader()'],
  },
  {
    path: 'src/services/ventaService.ts',
    requiredSnippets: ['/api/ventas', 'Authorization'],
  },
  {
    path: 'src/services/finanzasService.ts',
    requiredSnippets: ['/api/finanzas/dashboard-bi', 'authHeader()'],
  },
  {
    path: 'src/services/gimnasioParametrizacionService.ts',
    requiredSnippets: ['/api/gimnasio-parametrizacion', 'authHeader()'],
  },
  {
    path: 'src/services/otrosGastosService.ts',
    requiredSnippets: ['/api/otros_gastos', 'authHeader()'],
  },
  {
    path: 'src/services/parametrizacionService.ts',
    requiredSnippets: ['/api/parametrizacion/catalogos', 'authHeader()'],
  },
  {
    path: 'src/services/ragCoachChatClient.ts',
    requiredSnippets: ['/api/rag/coach/chat', 'Authorization'],
  },
  {
    path: 'src/services/ragCorpusAdminClient.ts',
    requiredSnippets: ['/api/rag/coach/corpus/status', 'Authorization'],
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
    ok: authorization.includes('authorizePersonalOrDashboardRequest'),
    message: 'Debe existir el helper para recursos propios del socio o gestión autorizada.',
  },
  {
    ok: authorization.includes('authorizationErrorResponse'),
    message: 'Debe existir una respuesta uniforme 401/403 para errores de autorización.',
  },
  {
    ok: authorization.includes('requireOwnSocioOrRoles'),
    message: 'Debe existir el helper de aislamiento por socio.',
  },
  {
    ok: authorization.includes('authorizeOwnUserOrDashboardRequest'),
    message: 'Debe existir el helper de perfil propio o administración autorizada.',
  },
  {
    ok: authorization.includes('AUTH_USER_SCOPE_FORBIDDEN'),
    message: 'El helper de cuentas debe rechazar acceso cruzado entre usuarios.',
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

for (const route of protectedSensitiveDashboardRoutes) {
  const source = read(route);
  const handlerCount = countOccurrences(source, 'export async function ');

  assertions.push(
    {
      ok: handlerCount > 0,
      message: `${route} debe declarar al menos un handler HTTP.`,
    },
    {
      ok: countOccurrences(source, 'authorizeDashboardRequest(') === handlerCount,
      message: `${route} debe exigir rol y permiso de dashboard en cada handler.`,
    },
    {
      ok: countOccurrences(source, 'authorizationErrorResponse(') >= handlerCount,
      message: `${route} debe preservar respuestas 401/403 tipadas.`,
    },
    {
      ok: !source.includes('authMiddleware('),
      message: `${route} no debe limitarse a comprobar que exista un JWT.`,
    },
  );
}

for (const route of protectedPersonalResourceRoutes) {
  const source = read(route);
  const handlerCount = countOccurrences(source, 'export async function ');

  assertions.push(
    {
      ok: handlerCount > 0,
      message: `${route} debe declarar al menos un handler HTTP.`,
    },
    {
      ok:
        countOccurrences(source, 'authorizePersonalOrDashboardRequest(') ===
        handlerCount,
      message: `${route} debe autorizar cada recurso personal o de gestión.`,
    },
    {
      ok: countOccurrences(source, 'authorizationErrorResponse(') >= handlerCount,
      message: `${route} debe preservar respuestas 401/403 tipadas.`,
    },
    {
      ok: !source.includes('authMiddleware('),
      message: `${route} no debe autenticar sin aplicar alcance personal o permiso.`,
    },
  );
}

for (const route of protectedFinalDashboardRoutes) {
  const source = read(route);
  const handlerCount = countOccurrences(source, 'export async function ');

  assertions.push(
    {
      ok: handlerCount > 0,
      message: `${route} debe declarar al menos un handler HTTP.`,
    },
    {
      ok: countOccurrences(source, 'authorizeDashboardRequest(') >= 1,
      message: `${route} debe exigir rol y permiso de dashboard.`,
    },
    {
      ok: countOccurrences(source, 'authorizationErrorResponse(') >= handlerCount,
      message: `${route} debe preservar 401/403 en todos sus handlers.`,
    },
    {
      ok: !source.includes('authMiddleware('),
      message: `${route} no debe limitarse a comprobar que exista un JWT.`,
    },
  );
}

for (const route of protectedFinalPersonalRoutes) {
  const source = read(route);
  const handlerCount = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].reduce(
    (total, method) =>
      total + countOccurrences(source, `export async function ${method}`),
    0,
  );

  assertions.push(
    {
      ok: source.includes('authorizePersonalOrDashboardRequest('),
      message: `${route} debe separar recursos personales de gestión autorizada.`,
    },
    {
      ok: countOccurrences(source, 'authorizationErrorResponse(') >= handlerCount,
      message: `${route} debe preservar respuestas 401/403 tipadas.`,
    },
  );
}

for (const route of protectedOwnUserRoutes) {
  const source = read(route);
  assertions.push(
    {
      ok: source.includes('authorizeOwnUserOrDashboardRequest('),
      message: `${route} debe limitar el perfil a la cuenta propia o al administrador.`,
    },
    {
      ok: source.includes('authorizationErrorResponse('),
      message: `${route} debe preservar respuestas 401/403 tipadas.`,
    },
  );
}

for (const route of authenticatedOnlyRoutes) {
  const source = read(route);
  assertions.push(
    {
      ok: source.includes('authMiddleware('),
      message: `${route} debe exigir una sesión autenticada.`,
    },
    {
      ok: source.includes('authorizationErrorResponse('),
      message: `${route} debe conservar el estado real de errores de sesión.`,
    },
  );
}

for (const policy of explicitNonJwtPolicies) {
  const source = read(policy.path);
  assertions.push({
    ok: source.includes(policy.marker),
    message: `${policy.path} debe declarar explícitamente ${policy.marker}.`,
  });

  for (const snippet of policy.snippets) {
    assertions.push({
      ok: source.includes(snippet),
      message: `${policy.path} debe conservar el control público/interno ${snippet}.`,
    });
  }
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

for (const client of sensitiveClientAuthChecks) {
  const source = read(client.path);
  for (const snippet of client.requiredSnippets) {
    assertions.push({
      ok: source.includes(snippet),
      message: `${client.path} debe conservar autenticación para ${snippet}.`,
    });
  }
}

for (const client of finalClientAuthChecks) {
  const source = read(client.path);
  for (const snippet of client.requiredSnippets) {
    assertions.push({
      ok: source.includes(snippet),
      message: `${client.path} debe conservar Bearer para ${snippet}.`,
    });
  }
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

const rutinaService = read('src/services/rutinaService.ts');
const dietaService = read('src/services/dietaService.ts');
const evolucionService = read('src/services/evolucionSocioService.ts');
const socioServerService = read('src/services/server/socioServerService.ts');
const miCuentaPagosRoute = read('src/app/api/mi-cuenta/pagos/route.ts');
const pagoVerificationRoute = read('src/app/api/pagos/[id]/verificar/route.ts');
const profileUploadRoute = read('src/app/api/file-upload/route.ts');
const masterLicenseRoute = read('src/app/api/dragon-pyramid/license/route.ts');
const masterReactivateRoute = read('src/app/api/dragon-pyramid/license/reactivate/route.ts');
const licenseWarningRoute = read('src/app/api/dragon-pyramid/license/warning/route.ts');
const suspensionStatusRoute = read('src/app/api/dragon-pyramid/license/suspension-status/route.ts');

assertions.push(
  {
    ok:
      rutinaService.includes('requestedSocioId.trim() !== ownSocioId') &&
      rutinaService.includes('AUTH_SOCIO_SCOPE_FORBIDDEN'),
    message: 'Rutinas debe rechazar generación y consulta para otro socio.',
  },
  {
    ok:
      dietaService.includes('requestedSocioId !== ownSocioId') &&
      dietaService.includes('AUTH_SOCIO_SCOPE_FORBIDDEN'),
    message: 'Dietas debe validar propiedad del socio solicitado.',
  },
  {
    ok:
      evolucionService.includes('createEvolucionSocio.socio_id !== ownSocioId') &&
      evolucionService.includes('socio_id !== ownSocioId') &&
      evolucionService.includes('AUTH_SOCIO_SCOPE_FORBIDDEN'),
    message: 'Evolución física debe impedir altas y lecturas cruzadas entre socios.',
  },
  {
    ok:
      socioServerService.includes(".eq('usuario_id', user.id)") &&
      socioServerService.includes('AUTH_SOCIO_SCOPE_FORBIDDEN'),
    message: 'El detalle de socio debe resolver y validar la identidad propia.',
  },
  {
    ok:
      miCuentaPagosRoute.includes("requireRoles(user, ['socio'])") &&
      miCuentaPagosRoute.includes(".eq('socio_id', socioId)"),
    message: 'Mi Cuenta debe devolver pagos únicamente del socio autenticado.',
  },
  {
    ok:
      pagoVerificationRoute.includes('isPagoVerificationCodeValid') &&
      !pagoVerificationRoute.includes('id_socio,nombre_completo,email'),
    message: 'La verificación pública de recibos debe validar código y no exponer email.',
  },
  {
    ok:
      profileUploadRoute.includes("const folder = `${user.rol}/profile`") &&
      profileUploadRoute.includes('updateFotoUsuarioById(user, uploadedUrl)') &&
      profileUploadRoute.includes('authorizationErrorResponse(error)'),
    message: 'La foto de perfil debe actualizar únicamente al usuario autenticado.',
  },
  {
    ok:
      masterLicenseRoute.includes("'/dashboard/masteradmin/license'") &&
      masterLicenseRoute.includes("['masteradmin']") &&
      masterReactivateRoute.includes("['masteradmin']"),
    message: 'Licencia y reactivación deben quedar aisladas al Master Admin.',
  },
  {
    ok:
      licenseWarningRoute.includes("role !== 'admin' && role !== 'masteradmin'") &&
      suspensionStatusRoute.includes("user.rol === 'socio'") &&
      suspensionStatusRoute.includes('details: status.isSuspended ? [] : status.details'),
    message: 'Avisos y suspensión deben conservar exposición mínima según el rol.',
  },
);

const dashboardRoutePermissions = read('src/lib/permissions/menuPermissions.ts');
const stripeStatusRoute = read('src/app/api/gimnasio-parametrizacion/stripe-status/route.ts');
const registroQrRoute = read('src/app/api/asistencias/registro-qr/route.ts');
const ownProfileRoute = read('src/app/api/usuarios/[id]/perfil/route.ts');
const imageProxyRoute = read('src/app/api/image-proxy/route.ts');
const internalLicenseSyncRoute = read('src/app/api/internal/dragon-pyramid/license-sync/route.ts');
const publicScannerRoute = read('src/app/api/comercial/mobile-scanner/public/[token]/route.ts');
const paymentConfirmationRoute = read('src/app/api/pagar-cuota/confirmar/route.ts');
const uploadValidation = read('src/lib/security/uploadValidation.ts');
const profileUploadSecurityRoute = read('src/app/api/file-upload/route.ts');
const logoUploadRoute = read('src/app/api/gimnasio-parametrizacion/logo-upload/route.ts');
const exerciseMediaUploadRoute = read('src/app/api/rutinas/ejercicios-media/upload/route.ts');
const expenseReceiptUploadRoute = read('src/app/api/otros_gastos/comprobante-upload/route.ts');
const testAlertasRoute = read('src/app/api/test-alertas/route.ts');

assertions.push(
  {
    ok:
      dashboardRoutePermissions.includes('path: "/dashboard/entrenadores"') &&
      dashboardRoutePermissions.includes('permissionKey: "Empleados"'),
    message: 'La ruta heredada de entrenadores debe reutilizar el permiso Empleados.',
  },
  {
    ok:
      stripeStatusRoute.includes("'/dashboard/mi-cuenta/pagar-cuota'") &&
      stripeStatusRoute.includes("['admin', 'socio']"),
    message: 'El estado de Stripe debe funcionar para configuración admin y pago propio del socio.',
  },
  {
    ok:
      countOccurrences(registroQrRoute, 'authorizeRegistroQR(') === 3 &&
      registroQrRoute.includes('authorizePersonalOrDashboardRequest('),
    message: 'El registro QR debe autorizar GET y POST antes de procesar el código.',
  },
  {
    ok:
      ownProfileRoute.includes('authorizeOwnUserOrDashboardRequest(') &&
      ownProfileRoute.includes("'/dashboard/usuarios'"),
    message: 'El perfil de usuario debe permitir cuenta propia o administración de Usuarios.',
  },
  {
    ok:
      imageProxyRoute.includes("redirect: 'manual'") &&
      imageProxyRoute.includes('isBlockedIp') &&
      imageProxyRoute.includes('MAX_IMAGE_BYTES'),
    message: 'El proxy público de imágenes debe bloquear SSRF, redirecciones inseguras y payloads grandes.',
  },
  {
    ok:
      internalLicenseSyncRoute.includes('timingSafeEqual') &&
      internalLicenseSyncRoute.includes('DRAGON_PYRAMID_LICENSE_SYNC_SECRET'),
    message: 'La sincronización interna de licencia debe comparar su secreto en tiempo constante.',
  },
  {
    ok:
      publicScannerRoute.includes('PUBLIC_SCANNER_TOKEN_RE') &&
      publicScannerRoute.includes("'Cache-Control': 'no-store'"),
    message: 'El scanner público debe validar tokens y evitar cachear sesiones.',
  },
  {
    ok:
      paymentConfirmationRoute.includes("'/dashboard/mi-cuenta/pagar-cuota'") &&
      paymentConfirmationRoute.includes("['socio']") &&
      paymentConfirmationRoute.includes('metadataUsuarioId !== user.id') &&
      paymentConfirmationRoute.includes('metadataSocioId !== user.id_socio'),
    message: 'La confirmación Stripe debe limitarse al socio dueño de la sesión y sus metadatos.',
  },
  {
    ok:
      uploadValidation.includes('hasSafeUploadSignature') &&
      uploadValidation.includes("case 'application/pdf'") &&
      uploadValidation.includes("case 'image/png'") &&
      uploadValidation.includes("case 'image/jpeg'") &&
      !uploadValidation.includes('svg'),
    message: 'Las cargas deben validar firma real y excluir SVG activo.',
  },
  {
    ok:
      profileUploadSecurityRoute.includes('hasSafeUploadSignature') &&
      logoUploadRoute.includes('hasSafeUploadSignature') &&
      exerciseMediaUploadRoute.includes('hasSafeUploadSignature') &&
      expenseReceiptUploadRoute.includes('hasSafeUploadSignature'),
    message: 'Perfil, logo, media y comprobantes deben validar la firma del archivo antes de subirlo.',
  },
  {
    ok:
      testAlertasRoute.includes("process.env.NODE_ENV === 'production'") &&
      testAlertasRoute.includes("['admin']"),
    message: 'El endpoint de diagnóstico de alertas debe ser admin-only y permanecer deshabilitado en producción.',
  },
);

function listApiRouteFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return listApiRouteFiles(absolute);
    if (entry.name !== 'route.ts') return [];
    return [path.relative(root, absolute).replaceAll('\\', '/')];
  });
}

const classifiedApiRoutes = new Set([
  ...terminalRoutes,
  ...protectedLegacyApiRoutes,
  ...protectedSensitiveDashboardRoutes,
  ...protectedPersonalResourceRoutes,
  ...protectedFinalDashboardRoutes,
  ...protectedFinalPersonalRoutes,
  ...protectedOwnUserRoutes,
  ...authenticatedOnlyRoutes,
  ...explicitNonJwtPolicies.map((policy) => policy.path),
]);
const allApiRouteFiles = listApiRouteFiles(path.join(root, 'src/app/api'));
const unclassifiedApiRoutes = allApiRouteFiles.filter(
  (route) => !classifiedApiRoutes.has(route),
);

assertions.push({
  ok: unclassifiedApiRoutes.length === 0,
  message: `Todas las API Routes deben tener política Auth/RBAC explícita. Sin clasificar: ${unclassifiedApiRoutes.join(', ')}`,
});

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
  `Sensitive dashboard APIs OK: ${protectedSensitiveDashboardRoutes.length} routes enforce role and module permission.`,
);
console.log(
  `Personal resource APIs OK: ${protectedPersonalResourceRoutes.length} routes enforce socio scope or authorized management.`,
);
console.log(
  'Socio ownership OK: member detail, medical records, payments, routines, diets and evolution reject cross-member access.',
);
console.log(
  'Master Admin and public exposure OK: license controls are isolated and public receipt verification is redacted.',
);
console.log(
  'Sensitive browser clients OK: personal, management and BI calls continue sending Bearer headers.',
);
console.log(
  'Protected browser clients OK: infrastructure, preventive equipment, equipment BI and fees BI send Bearer headers.',
);
console.log(
  'Final browser clients OK: operational, commercial, finance, support and RAG clients send Bearer headers.',
);
console.log(
  'Upload security OK: profile, branding, exercise media and receipts validate MIME type and file signature.',
);
console.log(
  `Final dashboard APIs OK: ${protectedFinalDashboardRoutes.length} routes enforce role and module permission.`,
);
console.log(
  `Final personal/account APIs OK: ${protectedFinalPersonalRoutes.length + protectedOwnUserRoutes.length} routes enforce personal or self-account scope.`,
);
console.log(
  `Explicit API policy registry OK: ${classifiedApiRoutes.size} route files are classified; no implicit public endpoints remain.`,
);
console.log(
  'Controlled public endpoints OK: scanner tokens, Stripe signatures, verification codes, image proxy and internal license sync are constrained.',
);
