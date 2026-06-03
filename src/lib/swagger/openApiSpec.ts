type EndpointDefinition = {
  path: string;
  methods: string[];
  tag: string;
  summary: string;
  description: string;
  auth: boolean;
  admin: boolean;
  notImplemented: boolean;
  statuses: number[];
  queryParams: string[];
  source: string;
};

type OpenApiOperation = Record<string, unknown>;
type OpenApiPathItem = Record<string, OpenApiOperation>;

const endpointDefinitions: EndpointDefinition[] = [

  {
    "path": "/api/notificaciones",
    "methods": [
      "GET",
      "POST"
    ],
    "tag": "Notificaciones",
    "summary": "Operaciones de notificaciones",
    "description": "Consulta y registra notificaciones, avisos programados, plantillas operativas y base para envío por email o visualización futura en Terminal.",
    "auth": true,
    "admin": true,
    "notImplemented": false,
    "statuses": [
      200,
      201,
      400,
      401,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/notificaciones/route.ts"
  },
  {
    "path": "/api/notificaciones/{id}",
    "methods": [
      "GET",
      "PATCH",
      "DELETE"
    ],
    "tag": "Notificaciones",
    "summary": "Operación sobre notificación por identificador",
    "description": "Consulta detalle con historial de envíos, actualiza o cancela una notificación por ID.",
    "auth": true,
    "admin": true,
    "notImplemented": false,
    "statuses": [
      200,
      400,
      401,
      404,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/notificaciones/[id]/route.ts"
  },
  {
    "path": "/api/notificaciones/{id}/enviar",
    "methods": [
      "POST"
    ],
    "tag": "Notificaciones",
    "summary": "Preparar/envíar notificación",
    "description": "Resuelve destinatarios del segmento seleccionado, registra historial de envíos y marca la notificación como enviada. Base futura para integración con proveedor real de email.",
    "auth": true,
    "admin": true,
    "notImplemented": false,
    "statuses": [
      200,
      400,
      401,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/notificaciones/[id]/enviar/route.ts"
  },
  {
    "path": "/api/notificaciones/plantillas",
    "methods": [
      "GET"
    ],
    "tag": "Notificaciones",
    "summary": "Plantillas de notificación",
    "description": "Consulta plantillas activas para feriados, promociones, stock, cumpleaños y otros avisos operativos.",
    "auth": true,
    "admin": true,
    "notImplemented": false,
    "statuses": [
      200,
      401,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/notificaciones/plantillas/route.ts"
  },

  {
    "path": "/api/auth/change-password",
    "methods": [
      "POST"
    ],
    "tag": "Auth",
    "summary": "Cambio obligatorio de contraseña inicial",
    "description": "Permite que un usuario autenticado cambie su contraseña temporal inicial y reciba un token actualizado sin la marca must_change_password.",
    "auth": true,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      400,
      401,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/auth/change-password/route.ts"
  },

  {
    "path": "/api/auth/forgot-password",
    "methods": [
      "POST"
    ],
    "tag": "Auth",
    "summary": "Solicitar recuperación de contraseña por email",
    "description": "Recibe email y tipo de acceso, genera token seguro de un solo uso, registra auditoría y envía enlace de recuperación por email sin revelar si la cuenta existe.",
    "auth": false,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      400,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/auth/forgot-password/route.ts"
  },
  {
    "path": "/api/auth/terminal-session/refresh",
    "methods": [
      "POST"
    ],
    "tag": "Auth",
    "summary": "Renovar sesión extendida de Terminal",
    "description": "Renueva de forma segura el JWT de una pantalla Terminal de asistencia antes de que expire, validando que el usuario autenticado tenga permisos sobre la Terminal.",
    "auth": true,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      401,
      403,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/auth/terminal-session/refresh/route.ts"
  },

  {
    "path": "/api/auth/reset-password",
    "methods": [
      "GET",
      "POST"
    ],
    "tag": "Auth",
    "summary": "Validar token y restablecer contraseña",
    "description": "GET valida un token de recuperación. POST actualiza la contraseña con política fuerte, marca el token como usado, limpia must_change_password y registra auditoría.",
    "auth": false,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      400,
      500
    ],
    "queryParams": [
      "token"
    ],
    "source": "src/app/api/auth/reset-password/route.ts"
  },

  {
    "path": "/api/empleados",
    "methods": [
      "GET",
      "POST"
    ],
    "tag": "Empleados",
    "summary": "Operaciones de empleados",
    "description": "Consulta y registra empleados del gimnasio. Reemplaza progresivamente el módulo legacy de entrenadores y prepara integración futura con sueldos, usuarios internos y RBAC.",
    "auth": true,
    "admin": true,
    "notImplemented": false,
    "statuses": [
      200,
      201,
      400,
      401,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/empleados/route.ts"
  },
  {
    "path": "/api/empleados/{id}",
    "methods": [
      "GET",
      "PATCH",
      "DELETE"
    ],
    "tag": "Empleados",
    "summary": "Operación sobre empleado por identificador",
    "description": "Consulta, actualiza o desactiva lógicamente un empleado por ID. La baja no borra físicamente el registro para conservar trazabilidad.",
    "auth": true,
    "admin": true,
    "notImplemented": false,
    "statuses": [
      200,
      400,
      401,
      404,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/empleados/[id]/route.ts"
  },


  {
    "path": "/api/empleados-sueldos",
    "methods": [
      "GET",
      "POST"
    ],
    "tag": "Empleados / Sueldos",
    "summary": "Operaciones de sueldos de empleados",
    "description": "Consulta y registra liquidaciones opcionales de sueldos, pagos y recibos internos de empleados. Base futura para integración con egresos, finanzas y RBAC.",
    "auth": true,
    "admin": true,
    "notImplemented": false,
    "statuses": [
      200,
      201,
      400,
      401,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/empleados-sueldos/route.ts"
  },
  {
    "path": "/api/empleados-sueldos/{id}",
    "methods": [
      "GET",
      "PATCH",
      "DELETE"
    ],
    "tag": "Empleados / Sueldos",
    "summary": "Operación sobre sueldo de empleado por identificador",
    "description": "Consulta, actualiza o anula lógicamente una liquidación de sueldo. La anulación conserva trazabilidad para auditoría.",
    "auth": true,
    "admin": true,
    "notImplemented": false,
    "statuses": [
      200,
      400,
      401,
      404,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/empleados-sueldos/[id]/route.ts"
  },

  {
    "path": "/api/finanzas/dashboard-bi",
    "methods": [
      "GET"
    ],
    "tag": "Finanzas / BI",
    "summary": "Dashboard financiero de ingresos y egresos",
    "description": "Consolida ingresos por cuotas y ventas, egresos por compras y gastos, resultado neto, compromisos pendientes y serie mensual para el dashboard financiero.",
    "auth": true,
    "admin": true,
    "notImplemented": false,
    "statuses": [
      200,
      400,
      401,
      500
    ],
    "queryParams": [
      "desde",
      "hasta"
    ],
    "source": "src/app/api/finanzas/dashboard-bi/route.ts"
  },

  {
    "path": "/api/compras",
    "methods": [
      "GET",
      "POST"
    ],
    "tag": "Comercial / compras",
    "summary": "Operaciones de compras a proveedores",
    "description": "Consulta y registra compras a proveedores con detalle de productos, actualización de stock, movimiento de stock e historial de costos.",
    "auth": true,
    "admin": true,
    "notImplemented": false,
    "statuses": [
      200,
      201,
      400,
      401,
      500
    ],
    "queryParams": [
      "proveedor_id",
      "estado"
    ],
    "source": "src/app/api/compras/route.ts"
  },
  {
    "path": "/api/compras/{id}",
    "methods": [
      "GET",
      "PATCH",
      "DELETE"
    ],
    "tag": "Comercial / compras",
    "summary": "Operación sobre compra por identificador",
    "description": "Consulta, actualiza estado o anula una compra. Al anular, revierte stock si la operación no deja stock negativo.",
    "auth": true,
    "admin": true,
    "notImplemented": false,
    "statuses": [
      200,
      400,
      401,
      404,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/compras/[id]/route.ts"
  },
  {
    "path": "/api/actividades/{id}",
    "methods": [
      "GET"
    ],
    "tag": "Catálogos y operación",
    "summary": "Operación sobre actividades por identificador",
    "description": "Consulta datos de actividades. Si el endpoint usa parámetros dinámicos, el identificador forma parte de la URL. Implementación relacionada: getActividadById.",
    "auth": false,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/actividades/[id]/route.ts"
  },
  {
    "path": "/api/actividades",
    "methods": [
      "GET",
      "POST",
      "PUT",
      "DELETE"
    ],
    "tag": "Catálogos y operación",
    "summary": "Operaciones de actividades",
    "description": "Consulta datos de actividades. Si el endpoint usa parámetros dinámicos, el identificador forma parte de la URL. Implementación relacionada: createActividad, deleteActividad, fetchAllActividades, updateActividad.",
    "auth": false,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      201,
      400,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/actividades/route.ts"
  },
  {
    "path": "/api/admin/cuotas/dashboard-bi",
    "methods": [
      "GET"
    ],
    "tag": "Administración y BI",
    "summary": "Dashboard BI de cuotas y pagos",
    "description": "Consolida KPIs, pagos recientes, socios vencidos, socios sin pagos, evolución de precio de cuota y resumen por método de pago para el dashboard administrativo.",
    "auth": false,
    "admin": true,
    "notImplemented": false,
    "statuses": [
      500
    ],
    "queryParams": [],
    "source": "src/app/api/admin/cuotas/dashboard-bi/route.ts"
  },
  {
    "path": "/api/admin/cuotas/estado-socios",
    "methods": [
      "GET"
    ],
    "tag": "Administración y BI",
    "summary": "Estado de cuotas de socios",
    "description": "Devuelve el estado operativo de cuotas por socio, incluyendo al día, vencidos, sin pagos y próximos a vencer.",
    "auth": true,
    "admin": true,
    "notImplemented": false,
    "statuses": [
      200
    ],
    "queryParams": [],
    "source": "src/app/api/admin/cuotas/estado-socios/route.ts"
  },
  {
    "path": "/api/admin/cuotas/resumen",
    "methods": [
      "GET"
    ],
    "tag": "Administración y BI",
    "summary": "Resumen administrativo de cuotas",
    "description": "Devuelve un resumen compacto para el dashboard: estados, pagos por método, vencidos, sin pagos y próximos a vencer.",
    "auth": true,
    "admin": true,
    "notImplemented": false,
    "statuses": [
      200
    ],
    "queryParams": [],
    "source": "src/app/api/admin/cuotas/resumen/route.ts"
  },
  {
    "path": "/api/admin/metricas/asistencia/{tipo}",
    "methods": [
      "GET"
    ],
    "tag": "Administración y BI",
    "summary": "Métricas de concurrencia por tipo",
    "description": "Devuelve métricas de asistencia según el tipo solicitado: semanal, mensual o anual.",
    "auth": true,
    "admin": true,
    "notImplemented": false,
    "statuses": [
      400,
      401,
      403,
      404,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/admin/metricas/asistencia/[tipo]/route.ts"
  },
  {
    "path": "/api/admin/metricas/asistencia/prediccion-abandono",
    "methods": [
      "GET"
    ],
    "tag": "Administración y BI",
    "summary": "Predicción de abandono de socios",
    "description": "Endpoint reservado para un modelo o lógica de predicción de abandono. Actualmente puede responder 501 si no está implementado.",
    "auth": true,
    "admin": true,
    "notImplemented": true,
    "statuses": [
      401,
      403,
      500,
      501
    ],
    "queryParams": [],
    "source": "src/app/api/admin/metricas/asistencia/prediccion-abandono/route.ts"
  },
  {
    "path": "/api/admin/metricas/asistencia/top-inactivos",
    "methods": [
      "GET"
    ],
    "tag": "Administración y BI",
    "summary": "Top de socios inactivos",
    "description": "Endpoint reservado para ranking de socios con baja asistencia o riesgo de inactividad. Actualmente puede responder 501 si no está implementado.",
    "auth": true,
    "admin": true,
    "notImplemented": true,
    "statuses": [
      401,
      403,
      500,
      501
    ],
    "queryParams": [],
    "source": "src/app/api/admin/metricas/asistencia/top-inactivos/route.ts"
  },
  {
    "path": "/api/admin/metricas/equipamiento/costo-beneficio",
    "methods": [
      "GET"
    ],
    "tag": "Administración y BI",
    "summary": "Análisis costo-beneficio de equipamiento",
    "description": "Devuelve análisis de costo-beneficio del equipamiento para decisiones de mantenimiento, reemplazo o inversión.",
    "auth": true,
    "admin": true,
    "notImplemented": false,
    "statuses": [
      401,
      403,
      404,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/admin/metricas/equipamiento/costo-beneficio/route.ts"
  },
  {
    "path": "/api/admin/metricas/equipamiento/estado-actual",
    "methods": [
      "GET"
    ],
    "tag": "Administración y BI",
    "summary": "Estado actual de equipamiento",
    "description": "Devuelve semáforo o estado operativo actual del equipamiento del gimnasio.",
    "auth": true,
    "admin": true,
    "notImplemented": false,
    "statuses": [
      401,
      403,
      404,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/admin/metricas/equipamiento/estado-actual/route.ts"
  },
  {
    "path": "/api/admin/metricas/equipamiento/prediccion-fallo",
    "methods": [
      "GET"
    ],
    "tag": "Administración y BI",
    "summary": "Predicción de fallos de equipamiento",
    "description": "Endpoint reservado para análisis predictivo de fallos. Actualmente puede responder 501 si no está implementado.",
    "auth": true,
    "admin": true,
    "notImplemented": true,
    "statuses": [
      401,
      403,
      500,
      501
    ],
    "queryParams": [],
    "source": "src/app/api/admin/metricas/equipamiento/prediccion-fallo/route.ts"
  },
  {
    "path": "/api/admin/metricas/equipamiento/top-fallos",
    "methods": [
      "GET"
    ],
    "tag": "Administración y BI",
    "summary": "Ranking de fallos de equipamiento",
    "description": "Devuelve ranking o resumen de equipamientos con mayor cantidad de fallos.",
    "auth": true,
    "admin": true,
    "notImplemented": false,
    "statuses": [
      401,
      403,
      404,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/admin/metricas/equipamiento/top-fallos/route.ts"
  },
  {
    "path": "/api/admin/metricas/pagos/histograma",
    "methods": [
      "GET"
    ],
    "tag": "Administración y BI",
    "summary": "Histograma de conducta de pagos",
    "description": "Devuelve distribución de pagos para análisis de comportamiento financiero de socios.",
    "auth": true,
    "admin": true,
    "notImplemented": false,
    "statuses": [
      401,
      403,
      404,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/admin/metricas/pagos/histograma/route.ts"
  },
  {
    "path": "/api/admin/metricas/pagos/proyeccion-ingresos",
    "methods": [
      "GET"
    ],
    "tag": "Administración y BI",
    "summary": "Proyección de ingresos",
    "description": "Endpoint reservado para proyección de ingresos. Actualmente puede responder 501 si no está implementado.",
    "auth": true,
    "admin": true,
    "notImplemented": true,
    "statuses": [
      401,
      403,
      500,
      501
    ],
    "queryParams": [],
    "source": "src/app/api/admin/metricas/pagos/proyeccion-ingresos/route.ts"
  },
  {
    "path": "/api/admin/metricas/pagos/segmentacion",
    "methods": [
      "GET"
    ],
    "tag": "Administración y BI",
    "summary": "Segmentación de conducta de pagos",
    "description": "Devuelve segmentación de socios o pagos según comportamiento financiero.",
    "auth": true,
    "admin": true,
    "notImplemented": false,
    "statuses": [
      401,
      403,
      404,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/admin/metricas/pagos/segmentacion/route.ts"
  },
  {
    "path": "/api/admin/metricas/retencion_por_combinacion",
    "methods": [
      "GET"
    ],
    "tag": "Administración y BI",
    "summary": "Retención por combinación de rutina",
    "description": "Devuelve análisis de retención agrupado por objetivo, nivel y frecuencia semanal.",
    "auth": true,
    "admin": true,
    "notImplemented": false,
    "statuses": [
      200,
      401,
      403,
      404,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/admin/metricas/retencion_por_combinacion/route.ts"
  },
  {
    "path": "/api/admin/metricas/rutinas/adherencia",
    "methods": [
      "GET"
    ],
    "tag": "Administración y BI",
    "summary": "Adherencia mensual a rutinas",
    "description": "Devuelve métricas de adherencia mensual a rutinas.",
    "auth": true,
    "admin": true,
    "notImplemented": false,
    "statuses": [
      401,
      403,
      404,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/admin/metricas/rutinas/adherencia/route.ts"
  },
  {
    "path": "/api/admin/metricas/rutinas/evolucion-promedio",
    "methods": [
      "GET"
    ],
    "tag": "Administración y BI",
    "summary": "Evolución promedio por objetivo",
    "description": "Devuelve evolución promedio agrupada por objetivo de entrenamiento.",
    "auth": true,
    "admin": true,
    "notImplemented": false,
    "statuses": [
      401,
      403,
      404,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/admin/metricas/rutinas/evolucion-promedio/route.ts"
  },
  {
    "path": "/api/admin/metricas/rutinas/generar-rutina",
    "methods": [
      "POST"
    ],
    "tag": "Administración y BI",
    "summary": "Métrica de generación de rutina",
    "description": "Ejecuta o consulta lógica administrativa vinculada a generación de rutinas.",
    "auth": true,
    "admin": true,
    "notImplemented": false,
    "statuses": [
      200,
      401,
      403,
      404,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/admin/metricas/rutinas/generar-rutina/route.ts"
  },
  {
    "path": "/api/admin/metricas/rutinas/generar-rutina-personalizada",
    "methods": [
      "POST"
    ],
    "tag": "Administración y BI",
    "summary": "Generación de rutina personalizada",
    "description": "Ejecuta lógica administrativa para generación personalizada de rutinas.",
    "auth": true,
    "admin": true,
    "notImplemented": false,
    "statuses": [
      200,
      401,
      403,
      404,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/admin/metricas/rutinas/generar-rutina-personalizada/route.ts"
  },
  {
    "path": "/api/asistencias/qr-dia",
    "methods": [
      "GET"
    ],
    "tag": "Asistencias",
    "summary": "QR diario de asistencia",
    "description": "Genera el QR diario de asistencia para que los socios lo escaneen desde su sesión. El QR incluye un token vigente para el día.",
    "auth": true,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      401,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/asistencias/qr-dia/route.ts"
  },
  {
    "path": "/api/asistencias/ranking-mensual",
    "methods": [
      "POST"
    ],
    "tag": "Asistencias",
    "summary": "Ranking mensual de asistencia",
    "description": "Calcula ranking mensual de asistencia para un período solicitado.",
    "auth": true,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      401,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/asistencias/ranking-mensual/route.ts"
  },
  {
    "path": "/api/asistencias/recientes",
    "methods": [
      "GET"
    ],
    "tag": "Asistencias",
    "summary": "Asistencias recientes",
    "description": "Devuelve las últimas asistencias recientes para mostrar actividad operativa en el panel administrativo, incluyendo socio, foto, hora de ingreso y estado de acceso/cuota. Si el socio está sin pagos o moroso, la respuesta permite mostrar alerta roja de regularización en lugar de bienvenida.",
    "auth": true,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      401,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/asistencias/recientes/route.ts"
  },
  {
    "path": "/api/asistencias/registro-qr",
    "methods": [
      "GET",
      "POST"
    ],
    "tag": "Asistencias",
    "summary": "Registro de asistencia por QR",
    "description": "Valida el token del QR diario y registra la asistencia del socio autenticado usando fecha y hora local de Argentina. Antes de registrar sincroniza morosidad: bloquea/desactiva socios sin pagos o vencidos fuera de tolerancia, deja auditoría y mantiene alertas visuales para dashboard administrador.",
    "auth": true,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      400,
      401,
      403
    ],
    "queryParams": [
      "tokenAsistencia"
    ],
    "source": "src/app/api/asistencias/registro-qr/route.ts"
  },
  {
    "path": "/api/asistencias",
    "methods": [
      "GET",
      "POST",
      "PUT",
      "DELETE"
    ],
    "tag": "Asistencias",
    "summary": "Operaciones de asistencias",
    "description": "Consulta datos de asistencias. Si el endpoint usa parámetros dinámicos, el identificador forma parte de la URL. Requiere usuario autenticado cuando el middleware/servicio lo valide. Implementación relacionada: getAllAsistencias, createAsistencia, updateAsistencia, deleteAsistencia.",
    "auth": true,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      201,
      400,
      401,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/asistencias/route.ts"
  },
  {
    "path": "/api/auth/{nextauth}",
    "methods": [
      "GET",
      "POST"
    ],
    "tag": "Autenticación",
    "summary": "NextAuth credentials",
    "description": "Endpoint interno de NextAuth para autenticación por credenciales y gestión de sesión.",
    "auth": true,
    "admin": false,
    "notImplemented": false,
    "statuses": [],
    "queryParams": [],
    "source": "src/app/api/auth/[...nextauth]/route.ts"
  },
  {
    "path": "/api/avisos/{id}",
    "methods": [
      "GET",
      "PUT",
      "DELETE"
    ],
    "tag": "Catálogos y operación",
    "summary": "Operación sobre avisos por identificador",
    "description": "Consulta datos de avisos. Si el endpoint usa parámetros dinámicos, el identificador forma parte de la URL. Implementación relacionada: getAvisoById, updateAviso, deleteAviso.",
    "auth": false,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      404,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/avisos/[id]/route.ts"
  },
  {
    "path": "/api/avisos",
    "methods": [
      "GET",
      "POST"
    ],
    "tag": "Catálogos y operación",
    "summary": "Operaciones de avisos",
    "description": "Consulta datos de avisos. Si el endpoint usa parámetros dinámicos, el identificador forma parte de la URL. Implementación relacionada: getAllAvisos, createAviso.",
    "auth": false,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      201,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/avisos/route.ts"
  },
  {
    "path": "/api/cuota/{id}",
    "methods": [
      "GET"
    ],
    "tag": "Cuotas y pagos",
    "summary": "Operación sobre cuotas por identificador",
    "description": "Consulta datos de cuotas. Si el endpoint usa parámetros dinámicos, el identificador forma parte de la URL. Implementación relacionada: getCuotaById.",
    "auth": false,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200
    ],
    "queryParams": [],
    "source": "src/app/api/cuota/[id]/route.ts"
  },
  {
    "path": "/api/cuota",
    "methods": [
      "GET",
      "POST",
      "PUT",
      "DELETE"
    ],
    "tag": "Cuotas y pagos",
    "summary": "Operaciones de cuotas",
    "description": "Consulta datos de cuotas. Si el endpoint usa parámetros dinámicos, el identificador forma parte de la URL. Implementación relacionada: createCuota, deleteCuota, getAllCuotas, updateCuota.",
    "auth": false,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      201,
      400,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/cuota/route.ts"
  },
  {
    "path": "/api/cuota-estado",
    "methods": [
      "GET"
    ],
    "tag": "Cuotas y pagos",
    "summary": "Estado de cuota",
    "description": "Devuelve estado de cuota para socio autenticado, socio específico por query o resumen administrativo según rol.",
    "auth": true,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      400
    ],
    "queryParams": [
      "socio_id"
    ],
    "source": "src/app/api/cuota-estado/route.ts"
  },
  {
    "path": "/api/custom-login",
    "methods": [
      "POST"
    ],
    "tag": "Autenticación",
    "summary": "Login personalizado",
    "description": "Valida credenciales y tipo de usuario para iniciar sesión en el sistema. Para socios, evalúa estado activo, sin pagos y mora mayor a 7 días; si corresponde, desactiva con auditoría y devuelve mensaje de regularización administrativa.",
    "auth": false,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      400,
      401,
      403,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/custom-login/route.ts"
  },
  {
    "path": "/api/dieta/generar",
    "methods": [
      "POST"
    ],
    "tag": "Dietas",
    "summary": "Generar dieta para socio",
    "description": "Crea una dieta asociada a un socio a partir de datos del usuario autenticado.",
    "auth": true,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      201,
      400,
      401,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/dieta/generar/route.ts"
  },
  {
    "path": "/api/dieta/{id}",
    "methods": [
      "GET"
    ],
    "tag": "Dietas",
    "summary": "Detalle de dieta",
    "description": "Consulta una dieta puntual por identificador para vistas administrativas y detalle moderno.",
    "auth": true,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      400,
      401,
      404,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/dieta/[id]/route.ts"
  },
  {
    "path": "/api/dieta/socio/{id}",
    "methods": [
      "GET"
    ],
    "tag": "Dietas",
    "summary": "Dietas de un socio",
    "description": "Lista dietas asociadas a un socio específico. Si el socio no tiene dietas, devuelve una lista vacía.",
    "auth": true,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      400,
      401,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/dieta/socio/[id]/route.ts"
  },
  {
    "path": "/api/dieta/todas",
    "methods": [
      "GET"
    ],
    "tag": "Dietas",
    "summary": "Todas las dietas",
    "description": "Lista dietas registradas según permisos del usuario.",
    "auth": true,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      401,
      404,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/dieta/todas/route.ts"
  },
  {
    "path": "/api/entrenadores/{id}/horarios",
    "methods": [
      "GET"
    ],
    "tag": "Empleados y entrenadores",
    "summary": "Horarios de entrenador",
    "description": "Devuelve horarios asociados a un entrenador por ID.",
    "auth": true,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      400,
      401,
      404,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/entrenadores/[id]/horarios/route.ts"
  },
  {
    "path": "/api/entrenadores/{id}",
    "methods": [
      "GET",
      "PUT"
    ],
    "tag": "Empleados y entrenadores",
    "summary": "Operación sobre entrenadores/empleados por identificador",
    "description": "Consulta datos de entrenadores/empleados. Si el endpoint usa parámetros dinámicos, el identificador forma parte de la URL. Requiere usuario autenticado cuando el middleware/servicio lo valide. Implementación relacionada: getEntrenadorById, updateEntrenador.",
    "auth": true,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      400,
      401,
      404,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/entrenadores/[id]/route.ts"
  },
  {
    "path": "/api/entrenadores",
    "methods": [
      "GET",
      "POST"
    ],
    "tag": "Empleados y entrenadores",
    "summary": "Operaciones de entrenadores/empleados",
    "description": "Consulta datos de entrenadores/empleados. Si el endpoint usa parámetros dinámicos, el identificador forma parte de la URL. Requiere permisos administrativos cuando el middleware/servicio lo valide. Implementación relacionada: createEntrenador, getEntrenadores.",
    "auth": true,
    "admin": true,
    "notImplemented": false,
    "statuses": [
      201,
      400,
      401,
      403,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/entrenadores/route.ts"
  },
  {
    "path": "/api/equipamientos/alertas-mantenimiento",
    "methods": [
      "GET"
    ],
    "tag": "Equipamiento",
    "summary": "Alertas de mantenimiento de equipamiento",
    "description": "Devuelve el tablero operativo de alertas de mantenimiento calculado a partir de la próxima revisión, el estado del equipamiento y un umbral configurable en días. Permite detectar equipos vencidos, próximos a revisión, en mantenimiento, fuera de servicio o sin fecha de revisión. Se usa en el módulo de Equipamientos para mostrar alertas anticipadas y priorizar tareas.",
    "auth": false,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      500
    ],
    "queryParams": [
      "umbralDias"
    ],
    "source": "src/app/api/equipamientos/alertas-mantenimiento/route.ts"
  },
  {
    "path": "/api/equipamientos/{id}",
    "methods": [
      "PUT",
      "DELETE"
    ],
    "tag": "Equipamiento",
    "summary": "Operación sobre equipamientos por identificador",
    "description": "Actualiza datos de equipamientos. Normalmente requiere un identificador y un objeto con los campos a modificar. Implementación relacionada: deleteEquipamiento, updateEquipamiento.",
    "auth": false,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      201,
      400,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/equipamientos/[id]/route.ts"
  },
  {
    "path": "/api/equipamientos",
    "methods": [
      "GET",
      "POST"
    ],
    "tag": "Equipamiento",
    "summary": "Operaciones de equipamientos",
    "description": "Consulta datos de equipamientos. Si el endpoint usa parámetros dinámicos, el identificador forma parte de la URL. Implementación relacionada: createEquipamiento, getAllEquipamientos.",
    "auth": false,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      201,
      400,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/equipamientos/route.ts"
  },
  {
    "path": "/api/evolucion_socio/{socio_id}",
    "methods": [
      "GET"
    ],
    "tag": "Evolución física",
    "summary": "Historial de evolución física de socio",
    "description": "Devuelve registros de evolución física asociados a un socio.",
    "auth": true,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      400
    ],
    "queryParams": [],
    "source": "src/app/api/evolucion_socio/[socio_id]/route.ts"
  },
  {
    "path": "/api/evolucion_socio/admin/resumen",
    "methods": [
      "GET"
    ],
    "tag": "Evolución física",
    "summary": "Resumen administrativo de evolución física",
    "description": "Devuelve una vista consolidada solo lectura de socios con cantidad de registros y última medición de evolución física para el gestor administrativo.",
    "auth": true,
    "admin": true,
    "notImplemented": false,
    "statuses": [
      200,
      401,
      403,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/evolucion_socio/admin/resumen/route.ts"
  },
  {
    "path": "/api/evolucion_socio/registro",
    "methods": [
      "POST"
    ],
    "tag": "Evolución física",
    "summary": "Crear registro de evolución física",
    "description": "Crea un nuevo registro de evolución física para un socio.",
    "auth": true,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      201
    ],
    "queryParams": [],
    "source": "src/app/api/evolucion_socio/registro/route.ts"
  },
  {
    "path": "/api/file-upload",
    "methods": [
      "POST"
    ],
    "tag": "Archivos",
    "summary": "Subida de archivo",
    "description": "Sube imágenes de perfil desde archivo o captura de cámara móvil mediante Cloudinary y actualiza la foto del usuario/socio autenticado.",
    "auth": true,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      400,
      401,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/file-upload/route.ts"
  },
  {
    "path": "/api/image-proxy",
    "methods": [
      "GET"
    ],
    "tag": "Archivos",
    "summary": "Proxy de imágenes para PDF",
    "description": "Descarga y devuelve imágenes remotas permitidas para usarlas en exportaciones PDF evitando problemas de CORS.",
    "auth": false,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      400,
      415,
      500
    ],
    "queryParams": [
      "url"
    ],
    "source": "src/app/api/image-proxy/route.ts"
  },
  {
    "path": "/api/mantenimientos/{id}",
    "methods": [
      "GET"
    ],
    "tag": "Mantenimiento",
    "summary": "Operación sobre mantenimientos por identificador",
    "description": "Consulta datos de mantenimientos. Si el endpoint usa parámetros dinámicos, el identificador forma parte de la URL. Implementación relacionada: getMantenimientoByIdEquipamiento.",
    "auth": false,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      400,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/mantenimientos/[id]/route.ts"
  },
  {
    "path": "/api/mantenimientos/completado/{id}",
    "methods": [
      "PUT"
    ],
    "tag": "Mantenimiento",
    "summary": "Operación sobre mantenimientos por identificador",
    "description": "Actualiza datos de mantenimientos. Normalmente requiere un identificador y un objeto con los campos a modificar. Implementación relacionada: mantenimientoCompletado.",
    "auth": false,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      400,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/mantenimientos/completado/[id]/route.ts"
  },
  {
    "path": "/api/mantenimientos",
    "methods": [
      "GET",
      "POST",
      "PUT"
    ],
    "tag": "Mantenimiento",
    "summary": "Operaciones de mantenimientos",
    "description": "Consulta datos de mantenimientos. Si el endpoint usa parámetros dinámicos, el identificador forma parte de la URL. Implementación relacionada: createMantenimiento, getAllMantenimientos, updateMantenimiento.",
    "auth": false,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      201,
      400,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/mantenimientos/route.ts"
  },
  {
    "path": "/api/mi-cuenta/pagos",
    "methods": [
      "GET"
    ],
    "tag": "Socios",
    "summary": "Pagos de mi cuenta",
    "description": "Devuelve el historial de pagos del socio autenticado. La respuesta incluye datos del socio, cuota, cobertura, medio de pago, estado y monto para que el socio pueda consultar sus pagos y descargar su recibo PDF verificable desde Mi cuenta.",
    "auth": true,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      403,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/mi-cuenta/pagos/route.ts"
  },
  {
    "path": "/api/niveles",
    "methods": [
      "GET"
    ],
    "tag": "Catálogos y operación",
    "summary": "Operaciones de niveles",
    "description": "Consulta datos de niveles. Si el endpoint usa parámetros dinámicos, el identificador forma parte de la URL. Requiere usuario autenticado cuando el middleware/servicio lo valide. Implementación relacionada: getAllNiveles.",
    "auth": true,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      401,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/niveles/route.ts"
  },
  {
    "path": "/api/objetivos",
    "methods": [
      "GET"
    ],
    "tag": "Catálogos y operación",
    "summary": "Operaciones de objetivos",
    "description": "Consulta datos de objetivos. Si el endpoint usa parámetros dinámicos, el identificador forma parte de la URL. Requiere usuario autenticado cuando el middleware/servicio lo valide. Implementación relacionada: getAllObjetivos.",
    "auth": true,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      401,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/objetivos/route.ts"
  },
  {
    "path": "/api/otros_gastos",
    "methods": [
      "GET",
      "POST",
      "PUT",
      "DELETE"
    ],
    "tag": "Gastos / egresos",
    "summary": "Gastos / egresos con comprobantes",
    "description": "Consulta, registra, actualiza y anula gastos operativos del gimnasio con clasificación por tipo de gasto, estado, medio de pago, vencimientos, período cubierto y comprobante PDF/imagen.",
    "auth": true,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      201,
      400,
      401,
      500
    ],
    "queryParams": [
      "estado",
      "id_tipo_gasto"
    ],
    "source": "src/app/api/otros_gastos/route.ts"
  },
  {
    "path": "/api/otros_gastos/comprobante-upload",
    "methods": [
      "POST"
    ],
    "tag": "Gastos / egresos",
    "summary": "Carga de comprobante de gasto",
    "description": "Sube un comprobante PDF o imagen a Cloudinary y devuelve URL, nombre original, MIME type y tamaño para asociarlo al gasto/egreso.",
    "auth": true,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      400,
      401,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/otros_gastos/comprobante-upload/route.ts"
  },
  {
    "path": "/api/pagar-cuota",
    "methods": [
      "GET",
      "POST"
    ],
    "tag": "Cuotas y pagos",
    "summary": "Vista previa y sesión de pago de cuota",
    "description": "GET devuelve vista previa de pago con subtotal, descuento por pago adelantado y total. POST crea una sesión Stripe con la misma parametrización de descuento vigente.",
    "auth": true,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      401,
      403,
      500
    ],
    "queryParams": [
      "meses_cubiertos"
    ],
    "source": "src/app/api/pagar-cuota/route.ts"
  },

  {
    "path": "/api/pagar-cuota/confirmar",
    "methods": [
      "POST"
    ],
    "tag": "Cuotas y pagos",
    "summary": "Confirma y sincroniza un pago Stripe de cuota",
    "description": "Recibe un session_id de Stripe Checkout, valida la sesión pagada y registra el pago en Gym Master si el webhook todavía no lo había registrado. Funciona como respaldo seguro post-checkout y evita duplicados por session/payment intent.",
    "auth": true,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      400,
      401,
      403,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/pagar-cuota/confirmar/route.ts"
  },
  {
    "path": "/api/pagos/{id}",
    "methods": [
      "GET"
    ],
    "tag": "Cuotas y pagos",
    "summary": "Operación sobre pagos por identificador",
    "description": "Consulta datos de pagos. Si el endpoint usa parámetros dinámicos, el identificador forma parte de la URL. Implementación relacionada: getPagoById.",
    "auth": false,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200
    ],
    "queryParams": [],
    "source": "src/app/api/pagos/[id]/route.ts"
  },
  {
    "path": "/api/pagos",
    "methods": [
      "GET",
      "POST",
      "PUT",
      "DELETE"
    ],
    "tag": "Cuotas y pagos",
    "summary": "Operaciones de pagos",
    "description": "Consulta y administra pagos manuales. El alta/actualización de pagos pagados puede reactivar automáticamente socios regularizados; la baja lógica/cancelación sincroniza morosidad y registra auditoría. El formulario de opciones incluye configuración de descuento por pago adelantado para calcular subtotal, descuento y total final. Implementación relacionada: createPagoManualServer, deactivatePagoServer, fetchPagoFormOptionsServer, fetchPagosServer, updatePagoServer.",
    "auth": true,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      201,
      400
    ],
    "queryParams": [
      "options"
    ],
    "source": "src/app/api/pagos/route.ts"
  },
  {
    "path": "/api/parametrizacion/cuotas-descuento",
    "methods": [
      "GET",
      "PATCH"
    ],
    "tag": "Parametrización",
    "summary": "Descuento por pago adelantado de cuotas",
    "description": "Consulta y actualiza la configuración administrativa del descuento por pago adelantado: activo, cuotas mínimas, porcentaje y descripción. Impacta en pagos manuales, Stripe, recibos e historial.",
    "auth": true,
    "admin": true,
    "notImplemented": false,
    "statuses": [
      200,
      400,
      403,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/parametrizacion/cuotas-descuento/route.ts"
  },
  {
    "path": "/api/parametrizacion/catalogos",
    "methods": [
      "GET",
      "POST",
      "PATCH"
    ],
    "tag": "Parametrización",
    "summary": "Catálogos parametrizables",
    "description": "Consulta, crea y actualiza registros de catálogos parametrizables. GET lista tipos de empleado, medios de pago, gastos, ingresos, categorías de producto, tipos/ubicaciones de equipamiento y tipos de mantenimiento. POST crea nuevos registros con código, nombre, descripción, orden y campos específicos. PATCH edita, activa o desactiva registros sin hard delete.",
    "auth": false,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      201,
      400,
      409,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/parametrizacion/catalogos/route.ts"
  },
  {
    "path": "/api/productos/{id}",
    "methods": [
      "GET"
    ],
    "tag": "Comercial",
    "summary": "Operación sobre productos por identificador",
    "description": "Consulta datos de productos. Si el endpoint usa parámetros dinámicos, el identificador forma parte de la URL. Implementación relacionada: getProductoById.",
    "auth": false,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200
    ],
    "queryParams": [],
    "source": "src/app/api/productos/[id]/route.ts"
  },

  {
    "path": "/api/productos/historial-precios-costos",
    "methods": [
      "GET"
    ],
    "tag": "Comercial / Kiosco",
    "summary": "Historial de precios y costos de producto",
    "description": "Devuelve el historial auditable de cambios de precio de venta y costo de compra de un producto. Requiere query param producto_id.",
    "auth": false,
    "admin": true,
    "notImplemented": false,
    "statuses": [
      200,
      400,
      500
    ],
    "queryParams": [
      "producto_id"
    ],
    "source": "src/app/api/productos/historial-precios-costos/route.ts"
  },
  {
    "path": "/api/productos/stock-movimientos",
    "methods": [
      "GET",
      "POST"
    ],
    "tag": "Comercial / Kiosco",
    "summary": "Movimientos manuales y operativos de stock",
    "description": "Lista y registra movimientos de stock de productos: ajustes manuales, recuento físico, devoluciones vendibles, mermas y reposiciones. Usa producto_stock_movimiento para trazabilidad y actualiza el stock del producto.",
    "auth": true,
    "admin": true,
    "notImplemented": false,
    "statuses": [
      200,
      201,
      400,
      401,
      404,
      500
    ],
    "queryParams": [
      "producto_id",
      "limit"
    ],
    "source": "src/app/api/productos/stock-movimientos/route.ts"
  },
  {
    "path": "/api/productos",
    "methods": [
      "GET",
      "POST",
      "PUT",
      "DELETE"
    ],
    "tag": "Comercial",
    "summary": "Operaciones de productos",
    "description": "Gestiona productos del kiosco/comercial, incluyendo costo, stock mínimo e historial de precio/costo cuando se modifica el valor comercial. Implementación relacionada: createProducto, deleteProducto, getAllProductos, updateProducto.",
    "auth": false,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      201,
      400,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/productos/route.ts"
  },
  {
    "path": "/api/proveedores/{id}",
    "methods": [
      "GET"
    ],
    "tag": "Comercial",
    "summary": "Operación sobre proveedores por identificador",
    "description": "Consulta el perfil comercial ampliado de un proveedor por identificador, incluyendo datos fiscales, contacto, ubicación, estado y datos bancarios opcionales. Implementación relacionada: getProveedorById.",
    "auth": false,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200
    ],
    "queryParams": [],
    "source": "src/app/api/proveedores/[id]/route.ts"
  },
  {
    "path": "/api/proveedores",
    "methods": [
      "GET",
      "POST",
      "PUT",
      "DELETE"
    ],
    "tag": "Comercial",
    "summary": "Operaciones de proveedores comerciales",
    "description": "Gestiona proveedores con perfil comercial ampliado: nombre comercial, razón social, identificación fiscal, condición fiscal, contacto, teléfono, WhatsApp, email, ubicación, rubro, estado, observaciones y datos bancarios opcionales. DELETE realiza desactivación lógica para preservar histórico comercial. Implementación relacionada: getAllProveedores, createProveedor, updateProveedor, deleteProveedor.",
    "auth": false,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      201,
      400,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/proveedores/route.ts"
  },
  {
    "path": "/api/rutina/{idSocio}",
    "methods": [
      "GET",
      "DELETE"
    ],
    "tag": "Rutinas",
    "summary": "Operación sobre rutina por identificador",
    "description": "Consulta datos de rutina. Si el endpoint usa parámetros dinámicos, el identificador forma parte de la URL. Requiere usuario autenticado cuando el middleware/servicio lo valide. Implementación relacionada: historialRutinaSocio, deleteRutinaById.",
    "auth": true,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      400,
      401,
      403,
      404,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/rutina/[idSocio]/route.ts"
  },
  {
    "path": "/api/rutina/delete/{id}",
    "methods": [
      "GET",
      "DELETE"
    ],
    "tag": "Rutinas",
    "summary": "Eliminar rutina por ID",
    "description": "Endpoint de eliminación/historial de rutina por ID. Mantener compatibilidad mientras se estabiliza el flujo de borrado.",
    "auth": true,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      401,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/rutina/delete/[id]/route.ts"
  },
  {
    "path": "/api/rutina/generar",
    "methods": [
      "POST"
    ],
    "tag": "Rutinas",
    "summary": "Generar rutina",
    "description": "Genera una rutina para un socio según objetivo, nivel, frecuencia u otros criterios.",
    "auth": true,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      401,
      404,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/rutina/generar/route.ts"
  },
  {
    "path": "/api/rutina/historial/{id_socio}",
    "methods": [
      "GET"
    ],
    "tag": "Rutinas",
    "summary": "Historial de rutina por socio",
    "description": "Devuelve historial de rutinas de un socio específico.",
    "auth": true,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      401
    ],
    "queryParams": [],
    "source": "src/app/api/rutina/historial/[id_socio]/route.ts"
  },
  {
    "path": "/api/rutina/historial",
    "methods": [
      "GET"
    ],
    "tag": "Rutinas",
    "summary": "Historial de rutina del socio autenticado",
    "description": "Devuelve el historial de rutinas del socio autenticado.",
    "auth": true,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      401
    ],
    "queryParams": [],
    "source": "src/app/api/rutina/historial/route.ts"
  },
  {
    "path": "/api/servicios/{id}",
    "methods": [
      "GET"
    ],
    "tag": "Comercial",
    "summary": "Operación sobre servicios por identificador",
    "description": "Consulta datos de servicios. Si el endpoint usa parámetros dinámicos, el identificador forma parte de la URL. Implementación relacionada: getServicioById.",
    "auth": false,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200
    ],
    "queryParams": [],
    "source": "src/app/api/servicios/[id]/route.ts"
  },
  {
    "path": "/api/servicios",
    "methods": [
      "GET",
      "POST",
      "PUT",
      "DELETE"
    ],
    "tag": "Comercial",
    "summary": "Operaciones de servicios",
    "description": "Consulta datos de servicios. Si el endpoint usa parámetros dinámicos, el identificador forma parte de la URL. Implementación relacionada: createServicio, deleteServicio, getAllServicios, updateServicio.",
    "auth": false,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      201,
      400,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/servicios/route.ts"
  },
  {
    "path": "/api/socios/{id}/ficha-medica/{id_ficha}",
    "methods": [
      "GET"
    ],
    "tag": "Ficha médica",
    "summary": "Operación sobre socios por identificador",
    "description": "Consulta datos de socios. Si el endpoint usa parámetros dinámicos, el identificador forma parte de la URL. Requiere usuario autenticado cuando el middleware/servicio lo valide. Implementación relacionada: FindOneFichaMedicaSocio.",
    "auth": true,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      400,
      401,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/socios/[id]/ficha-medica/[id_ficha]/route.ts"
  },
  {
    "path": "/api/socios/{id}/ficha-medica/actual",
    "methods": [
      "GET"
    ],
    "tag": "Ficha médica",
    "summary": "Ficha médica de socio",
    "description": "Consulta datos de socios. Si el endpoint usa parámetros dinámicos, el identificador forma parte de la URL. Requiere usuario autenticado cuando el middleware/servicio lo valide. Implementación relacionada: FindFichaMedicaSocio.",
    "auth": true,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      400,
      401,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/socios/[id]/ficha-medica/actual/route.ts"
  },
  {
    "path": "/api/socios/{id}/ficha-medica/historial",
    "methods": [
      "GET"
    ],
    "tag": "Ficha médica",
    "summary": "Ficha médica de socio",
    "description": "Consulta datos de socios. Si el endpoint usa parámetros dinámicos, el identificador forma parte de la URL. Requiere usuario autenticado cuando el middleware/servicio lo valide. Implementación relacionada: FindAllFichaMedicaSocio.",
    "auth": true,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      400,
      401,
      500
    ],
    "queryParams": [
      "page"
    ],
    "source": "src/app/api/socios/[id]/ficha-medica/historial/route.ts"
  },
  {
    "path": "/api/socios/{id}/ficha-medica",
    "methods": [
      "POST"
    ],
    "tag": "Ficha médica",
    "summary": "Ficha médica de socio",
    "description": "Crea o registra datos de socios. El payload debe enviarse como JSON salvo endpoints especiales de archivos o webhooks. Requiere usuario autenticado cuando el middleware/servicio lo valide. Implementación relacionada: createFichaMedicaSocio.",
    "auth": true,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      201,
      400,
      401,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/socios/[id]/ficha-medica/route.ts"
  },
  {
    "path": "/api/socios/{id}",
    "methods": [
      "GET"
    ],
    "tag": "Socios",
    "summary": "Operación sobre socios por identificador",
    "description": "Consulta datos de socios. Si el endpoint usa parámetros dinámicos, el identificador forma parte de la URL. Requiere usuario autenticado cuando el middleware/servicio lo valide. Implementación relacionada: getSocioById.",
    "auth": true,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200
    ],
    "queryParams": [],
    "source": "src/app/api/socios/[id]/route.ts"
  },
  {
    "path": "/api/socios",
    "methods": [
      "GET",
      "POST",
      "PUT",
      "DELETE"
    ],
    "tag": "Socios",
    "summary": "Operaciones de socios",
    "description": "Consulta y administra socios. El payload de alta/edición admite datos personales y operativos: sexo, fecha de nacimiento, ciudad, provincia, país y contacto de emergencia, además de datos básicos. Requiere usuario autenticado cuando el middleware/servicio lo valide. Implementación relacionada: createSocioServer, deactivateSocioServer, fetchSociosServer, updateSocioServer.",
    "auth": true,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      201,
      400
    ],
    "queryParams": [],
    "source": "src/app/api/socios/route.ts"
  },
  {
    "path": "/api/stripe-webhook",
    "methods": [
      "POST"
    ],
    "tag": "Cuotas y pagos",
    "summary": "Webhook de Stripe",
    "description": "Recibe eventos de Stripe para registrar pagos online. Al registrar un pago pagado, sincroniza la reactivación del socio si regularizó su cuota. Debe usarse con firma/validación de Stripe en ambientes productivos.",
    "auth": false,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      400,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/stripe-webhook/route.ts"
  },
  {
    "path": "/api/test-alertas",
    "methods": [
      "POST"
    ],
    "tag": "Alertas",
    "summary": "Prueba de alertas de deuda",
    "description": "Endpoint técnico para probar alertas o desactivación de socios con deuda.",
    "auth": false,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/test-alertas/route.ts"
  },
  {
    "path": "/api/usuarios/{id}/perfil",
    "methods": [
      "GET"
    ],
    "tag": "Usuarios",
    "summary": "Operaciones de usuarios",
    "description": "Consulta datos de usuarios. Si el endpoint usa parámetros dinámicos, el identificador forma parte de la URL. Requiere usuario autenticado cuando el middleware/servicio lo valide. Implementación relacionada: getUsuarioById.",
    "auth": true,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      401
    ],
    "queryParams": [],
    "source": "src/app/api/usuarios/[id]/perfil/route.ts"
  },
  {
    "path": "/api/usuarios/{id}",
    "methods": [
      "GET"
    ],
    "tag": "Usuarios",
    "summary": "Operación sobre usuarios por identificador",
    "description": "Consulta datos de usuarios. Si el endpoint usa parámetros dinámicos, el identificador forma parte de la URL. Requiere usuario autenticado cuando el middleware/servicio lo valide. Implementación relacionada: getUsuarioById.",
    "auth": true,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      401
    ],
    "queryParams": [],
    "source": "src/app/api/usuarios/[id]/route.ts"
  },
  {
    "path": "/api/usuarios",
    "methods": [
      "GET",
      "POST",
      "PUT",
      "DELETE"
    ],
    "tag": "Usuarios",
    "summary": "Operaciones de usuarios",
    "description": "Consulta y administra usuarios. Para alta/cambio de contraseña se recomienda aplicar contraseña mínima de 8 caracteres con mayúscula, minúscula, número, símbolo y confirmación en frontend. Requiere usuario autenticado cuando el middleware/servicio lo valide. Implementación relacionada: createUsuarioServer, deactivateUsuarioServer, fetchUsuariosServer, updateUsuarioServer.",
    "auth": true,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      201,
      400
    ],
    "queryParams": [],
    "source": "src/app/api/usuarios/route.ts"
  },
  {
    "path": "/api/ventas/{id}",
    "methods": [
      "GET"
    ],
    "tag": "Comercial",
    "summary": "Detalle de venta por identificador",
    "description": "Devuelve la cabecera de una venta y su detalle real de productos/servicios, incluyendo cliente, método de pago, estado, total y código de comprobante. Requiere usuario autenticado.",
    "auth": true,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      401
    ],
    "queryParams": [],
    "source": "src/app/api/ventas/[id]/route.ts"
  },
  {
    "path": "/api/ventas",
    "methods": [
      "GET",
      "POST",
      "PUT",
      "DELETE"
    ],
    "tag": "Comercial",
    "summary": "Operaciones de ventas de kiosco",
    "description": "Gestiona ventas comerciales con cabecera, consumidor final/visitante/socio, método de pago, múltiples ítems de producto o servicio, descuento de stock y anulación lógica. Requiere usuario autenticado.",
    "auth": true,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      201,
      400,
      401,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/ventas/route.ts"
  },
  {
    "path": "/api/ventas_detalles",
    "methods": [
      "GET",
      "POST",
      "PUT",
      "DELETE"
    ],
    "tag": "Comercial",
    "summary": "Operaciones de detalles de venta",
    "description": "Gestiona detalles de venta para productos o servicios, con cantidad, precio unitario, descuento, subtotal y total de línea. Los productos descuentan stock al registrarse. Requiere usuario autenticado.",
    "auth": true,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      201,
      400,
      401,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/ventas_detalles/route.ts"
  },
  {
    "path": "/api/swagger-json",
    "methods": [
      "GET"
    ],
    "tag": "General",
    "summary": "Especificación OpenAPI de Gym Master",
    "description": "Devuelve la especificación OpenAPI usada por la pantalla /swagger. Permite auditar la documentación de endpoints desde Swagger UI o herramientas externas.",
    "auth": false,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200
    ],
    "queryParams": [],
    "source": "src/app/api/swagger-json/route.ts"
  },
  {
    "path": "/api/rutinas/rag-assistant/generar",
    "methods": [
      "POST"
    ],
    "tag": "Rutinas",
    "summary": "Generar rutina desde asistente RAG",
    "description": "Endpoint puente para el futuro gym-master-rag-coach. Si el microservicio RAG está configurado, consulta el servicio externo para sugerir parámetros; si no, usa fallback local con el generador formal de Gym Master. No expone claves en frontend.",
    "auth": true,
    "admin": false,
    "notImplemented": false,
    "statuses": [
      200,
      401,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/rutinas/rag-assistant/generar/route.ts"
  },
  {
    "path": "/api/rutinas/ejercicios-media",
    "methods": [
      "GET",
      "PATCH"
    ],
    "tag": "Rutinas",
    "summary": "Catálogo administrativo de media de ejercicios",
    "description": "Permite listar ejercicios con su media asociada, filtrar por objetivo/nivel/estado y actualizar imagen principal o video de YouTube del ejercicio. Requiere rol administrador.",
    "auth": true,
    "admin": true,
    "notImplemented": false,
    "statuses": [
      200,
      400,
      401,
      403,
      500
    ],
    "queryParams": [
      "q",
      "objetivo",
      "nivel",
      "mediaStatus",
      "page",
      "pageSize"
    ],
    "source": "src/app/api/rutinas/ejercicios-media/route.ts"
  },

  {
    "path": "/api/rutinas/ejercicios-media/equivalence-sync",
    "methods": [
      "POST"
    ],
    "tag": "Rutinas",
    "summary": "Sincronización de media entre ejercicios equivalentes",
    "description": "Detecta ejercicios equivalentes por nombre canónico y grupo muscular, usando Volumen Avanzado como fuente prioritaria, para copiar imagen/GIF y video hacia ejercicios con fallback o imagen vacía. Soporta modo previsualización y aplicación. Requiere rol administrador.",
    "auth": true,
    "admin": true,
    "notImplemented": false,
    "statuses": [
      200,
      401,
      403,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/rutinas/ejercicios-media/equivalence-sync/route.ts"
  },
  {
    "path": "/api/rutinas/ejercicios-media/import",
    "methods": [
      "POST"
    ],
    "tag": "Rutinas",
    "summary": "Importación de imagen/GIF remoto a Cloudinary",
    "description": "Importa una imagen o GIF desde una URL pública externa hacia Cloudinary y la asocia como media principal de un ejercicio. Requiere rol administrador.",
    "auth": true,
    "admin": true,
    "notImplemented": false,
    "statuses": [
      200,
      400,
      401,
      403,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/rutinas/ejercicios-media/import/route.ts"
  },
  {
    "path": "/api/rutinas/ejercicios-media/upload",
    "methods": [
      "POST"
    ],
    "tag": "Rutinas",
    "summary": "Subida de imagen/GIF de ejercicio a Cloudinary",
    "description": "Sube una imagen o GIF de ejercicio a Cloudinary para luego asociarla como media principal del ejercicio desde el catálogo administrativo.",
    "auth": true,
    "admin": true,
    "notImplemented": false,
    "statuses": [
      200,
      400,
      401,
      403,
      500
    ],
    "queryParams": [],
    "source": "src/app/api/rutinas/ejercicios-media/upload/route.ts"
  }
];

const tags = [
  {
    "name": "Notificaciones",
    "description": "Notificaciones, plantillas, email, avisos programados y futuras salidas en Terminal."
  },
  {
    "name": "Administración y BI",
    "description": "Dashboards, reportes y métricas administrativas."
  },
  {
    "name": "Autenticación",
    "description": "Inicio de sesión, NextAuth y control de sesión."
  },
  {
    "name": "Usuarios",
    "description": "Gestión de usuarios internos del sistema."
  },
  {
    "name": "Socios",
    "description": "Gestión y autoservicio de socios."
  },
  {
    "name": "Ficha médica",
    "description": "Ficha médica, historial y registros clínicos asociados al socio."
  },
  {
    "name": "Asistencias",
    "description": "Registro, consulta, ranking y QR de asistencia."
  },
  {
    "name": "Rutinas",
    "description": "Generación, historial y eliminación de rutinas."
  },
  {
    "name": "Dietas",
    "description": "Generación y consulta de dietas."
  },
  {
    "name": "Cuotas y pagos",
    "description": "Cuotas, pagos manuales, Stripe, estado de cuota y recibos futuros."
  },
  {
    "name": "Equipamiento",
    "description": "Gestión de máquinas y equipamiento."
  },
  {
    "name": "Mantenimiento",
    "description": "Gestión de mantenimientos y tareas completadas."
  },
  {
    "name": "Comercial",
    "description": "Productos, proveedores, servicios, ventas y detalles de venta."
  },
  {
    "name": "Empleados",
    "description": "Gestión formal de empleados, responsabilidades, base para sueldos, usuarios internos y RBAC."
  },
  {
    "name": "Evolución física",
    "description": "Registros de evolución física y métricas corporales del socio."
  },
  {
    "name": "Parametrización",
    "description": "Catálogos parametrizables del sistema."
  },
  {
    "name": "Catálogos y operación",
    "description": "Catálogos operativos y módulos complementarios."
  },
  {
    "name": "Archivos",
    "description": "Subida y proxy de archivos/imágenes."
  },
  {
    "name": "Alertas",
    "description": "Endpoints técnicos de alertas o mantenimiento operativo."
  },
  {
    "name": "General",
    "description": "Endpoints generales no clasificados."
  }
];

const methodOrder: Record<string, number> = {
  get: 1,
  post: 2,
  put: 3,
  patch: 4,
  delete: 5,
};

function toOperationId(method: string, path: string) {
  const pathName = path
    .replace(/^\/api\//, "")
    .replace(/\{([^}]+)\}/g, "by-$1")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .split("-")
    .filter(Boolean)
    .map((part, index) =>
      index === 0
        ? part.toLowerCase()
        : part.charAt(0).toUpperCase() + part.slice(1)
    )
    .join("");

  return `${method.toLowerCase()}${pathName.charAt(0).toUpperCase() + pathName.slice(1)}`;
}

function getPathParams(path: string) {
  const matches = Array.from(path.matchAll(/\{([^}]+)\}/g));

  return matches.map((match) => {
    const name = match[1];
    const isUuidLike = /id|socio|usuario|ficha/i.test(name);

    return {
      name,
      in: "path",
      required: true,
      description:
        name === "tipo"
          ? "Tipo de métrica solicitada. Valores soportados: semanal, mensual o anual."
          : `Parámetro dinámico ${name} requerido por la ruta.`,
      schema: name === "tipo"
        ? { type: "string", enum: ["semanal", "mensual", "anual"] }
        : { type: "string", ...(isUuidLike ? { format: "uuid" } : {}) },
      example:
        name === "tipo"
          ? "mensual"
          : isUuidLike
            ? "2d2a45df-0fd5-4f4e-9c01-5de07dca1111"
            : "valor",
    };
  });
}

function getQueryParams(endpoint: EndpointDefinition) {
  return endpoint.queryParams.map((name) => {
    const descriptions: Record<string, string> = {
      tokenAsistencia:
        "Token del QR diario usado para registrar asistencia.",
      socio_id:
        "ID del socio a consultar. Si se omite, el endpoint resuelve según el rol del usuario autenticado.",
      url:
        "URL absoluta de la imagen remota que será descargada por el proxy.",
      umbralDias:
        "Cantidad de días de anticipación para considerar una revisión como próxima. Valor por defecto: 5. Rango sugerido: 0 a 90.",
      options:
        "Cuando vale true, devuelve opciones de formulario en lugar del listado principal.",
      page:
        "Página de resultados para listados paginados.",
    };

    const examples: Record<string, string> = {
      tokenAsistencia: "qr_2026_05_23_abcd",
      socio_id: "2d2a45df-0fd5-4f4e-9c01-5de07dca1111",
      url: "https://example.com/image.png",
      options: "true",
      page: "1",
    };

    return {
      name,
      in: "query",
      required: name === "url" || name === "tokenAsistencia" ? true : false,
      description: descriptions[name] ?? `Parámetro de consulta ${name}.`,
      schema: { type: "string" },
      example: examples[name] ?? "valor",
    };
  });
}

function getRequestBody(endpoint: EndpointDefinition, method: string) {
  const lowerMethod = method.toLowerCase();

  if (!["post", "put", "patch"].includes(lowerMethod)) {
    if (lowerMethod === "delete" && !endpoint.path.includes("{")) {
      return {
        required: false,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/IdMutationRequest" },
            examples: {
              eliminarPorId: {
                summary: "Eliminar o desactivar por ID",
                value: { id: "2d2a45df-0fd5-4f4e-9c01-5de07dca1111" },
              },
            },
          },
        },
      };
    }

    return undefined;
  }

  if (endpoint.path === "/api/file-upload") {
    return {
      required: true,
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            properties: {
              file: { type: "string", format: "binary" },
              usuario_id: { type: "string", format: "uuid" },
              tipo: { type: "string", example: "foto_perfil" },
            },
          },
        },
      },
    };
  }

  if (endpoint.path === "/api/stripe-webhook") {
    return {
      required: true,
      content: {
        "application/json": {
          schema: { type: "object", additionalProperties: true },
          examples: {
            stripeEvent: {
              summary: "Evento de Stripe",
              value: {
                id: "evt_123",
                type: "checkout.session.completed",
                data: { object: { id: "cs_test_123" } },
              },
            },
          },
        },
      },
    };
  }

  if (endpoint.path === "/api/auth/{nextauth}" || endpoint.path === "/api/custom-login") {
    return {
      required: true,
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/LoginRequest" },
          examples: {
            credentials: {
              summary: "Credenciales de usuario",
              value: {
                email: "admin@gymmaster.local",
                password: "********",
                userType: "admin",
              },
            },
          },
        },
      },
    };
  }


  if (endpoint.path === "/api/auth/forgot-password") {
    return {
      required: true,
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/ForgotPasswordRequest" },
          examples: {
            socio: {
              summary: "Solicitud para socio",
              value: {
                email: "socio@gymmaster.local",
                rol: "socio",
              },
            },
          },
        },
      },
    };
  }

  if (endpoint.path === "/api/auth/reset-password" && lowerMethod === "post") {
    return {
      required: true,
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/ResetPasswordRequest" },
          examples: {
            reset: {
              summary: "Restablecer contraseña",
              value: {
                token: "reset-token-recibido-por-email",
                new_password: "NuevaClave2026!",
              },
            },
          },
        },
      },
    };
  }

  if (endpoint.path === "/api/asistencias/registro-qr" && lowerMethod === "post") {
    return {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["qr"],
            properties: {
              qr: {
                type: "string",
                description: "Token QR recibido desde el lector o cámara.",
                example: "qr_2026_05_23_abcd",
              },
            },
          },
        },
      },
    };
  }

  if (endpoint.path === "/api/parametrizacion/catalogos") {
    return {
      required: true,
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/CatalogoParametrizableMutationRequest" },
          examples: {
            medioPago: {
              summary: "Crear medio de pago",
              value: {
                catalogo: "medio_pago",
                codigo: "mercado_pago",
                nombre: "Mercado Pago",
                descripcion: "Pago online o presencial registrado mediante Mercado Pago.",
                activo: true,
                orden: 60,
                requiere_comprobante: true,
                es_online: true,
              },
            },
            desactivar: {
              summary: "Desactivar registro sin hard delete",
              value: {
                catalogo: "medio_pago",
                id: "95ce23de-3112-4198-8f00-6d736afe1111",
                activo: false,
              },
            },
          },
        },
      },
    };
  }

  return {
    required: true,
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/GenericMutationRequest" },
        examples: {
          generic: {
            summary: "Payload genérico",
            description:
              "La forma exacta del payload depende del módulo y del servicio asociado al endpoint.",
            value: {
              id: "2d2a45df-0fd5-4f4e-9c01-5de07dca1111",
              data: {
                nombre: "Ejemplo",
                activo: true,
              },
            },
          },
        },
      },
    },
  };
}

function successDescription(method: string, endpoint: EndpointDefinition) {
  if (endpoint.notImplemented) {
    return "Endpoint definido, pero la lógica puede estar pendiente.";
  }

  switch (method.toLowerCase()) {
    case "get":
      return "Consulta ejecutada correctamente.";
    case "post":
      return "Registro, proceso o acción creada/ejecutada correctamente.";
    case "put":
    case "patch":
      return "Registro actualizado correctamente.";
    case "delete":
      return "Registro eliminado o desactivado correctamente.";
    default:
      return "Operación ejecutada correctamente.";
  }
}

function buildResponses(endpoint: EndpointDefinition, method: string) {
  const responses: Record<string, unknown> = {};
  const statuses = new Set(endpoint.statuses);

  if (!Array.from(statuses).some((status) => status >= 200 && status < 300)) {
    statuses.add(method.toLowerCase() === "post" ? 201 : 200);
  }

  if (endpoint.auth) statuses.add(401);
  if (endpoint.admin) statuses.add(403);
  if (endpoint.notImplemented) statuses.add(501);
  statuses.add(500);

  Array.from(statuses)
    .sort((a, b) => a - b)
    .forEach((status) => {
      if (status >= 200 && status < 300) {
        responses[String(status)] = {
          description: successDescription(method, endpoint),
          content: {
            "application/json": {
              schema:
                endpoint.path === "/api/equipamientos/alertas-mantenimiento"
                  ? { $ref: "#/components/schemas/AlertasMantenimientoEquipamientoResponse" }
                  : { $ref: "#/components/schemas/GenericSuccessResponse" },
              examples:
                endpoint.path === "/api/equipamientos/alertas-mantenimiento"
                  ? {
                      alertas: {
                        summary: "Resumen de alertas de mantenimiento",
                        value: {
                          generated_at: "2026-05-23T15:30:00.000Z",
                          umbral_dias: 5,
                          resumen: {
                            total: 12,
                            vencidos: 2,
                            proximos: 3,
                            ok: 5,
                            sin_fecha: 1,
                            en_mantenimiento: 1,
                            fuera_de_servicio: 0,
                          },
                          alertas_operativas: [
                            {
                              id: "2d2a45df-0fd5-4f4e-9c01-5de07dca1111",
                              nombre: "Polea alta",
                              tipo: "Fuerza",
                              ubicacion: "Sala de musculación",
                              estado: "operativo",
                              proxima_revision: "2026-05-25",
                              dias_para_revision: 2,
                              estado_alerta: "proximo",
                              severidad: "alta",
                              mensaje: "La revisión vence en 2 días.",
                            },
                          ],
                          alertas: [],
                        },
                      },
                    }
                  : undefined,
            },
          },
        };
        return;
      }

      responses[String(status)] = {
        description:
          status === 400
            ? "Solicitud inválida o payload incompleto."
            : status === 401
              ? "Usuario no autenticado o sesión inválida."
              : status === 403
                ? "Usuario sin permisos suficientes para ejecutar la operación."
                : status === 404
                  ? "Recurso no encontrado."
                  : status === 409
                    ? "Conflicto de datos, por ejemplo código duplicado."
                    : status === 415
                      ? "Tipo de contenido no soportado."
                      : status === 501
                        ? "Endpoint definido pero todavía no implementado."
                        : "Error interno del servidor.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      };
    });

  return responses;
}

function buildOperation(endpoint: EndpointDefinition, method: string) {
  const lowerMethod = method.toLowerCase();
  const parameters = [...getPathParams(endpoint.path), ...getQueryParams(endpoint)];
  const requestBody = getRequestBody(endpoint, lowerMethod);
  const security = endpoint.auth || endpoint.admin
    ? [{ bearerAuth: [] }, { nextAuthSession: [] }]
    : undefined;

  const operation: OpenApiOperation = {
    tags: [endpoint.tag],
    summary:
      lowerMethod === "get"
        ? endpoint.summary
        : `${method.toUpperCase()} ${endpoint.summary}`,
    description: `${endpoint.description}\n\nArchivo fuente: \`${endpoint.source}\`.`,
    operationId: toOperationId(method, endpoint.path),
    parameters,
    responses: buildResponses(endpoint, lowerMethod),
  };

  if (security) operation.security = security;
  if (requestBody) operation.requestBody = requestBody;
  if (endpoint.notImplemented) operation.deprecated = true;

  return operation;
}

function buildPaths() {
  const paths: Record<string, OpenApiPathItem> = {};

  for (const endpoint of endpointDefinitions) {
    const pathItem = paths[endpoint.path] ?? {};

    for (const method of endpoint.methods) {
      const lowerMethod = method.toLowerCase();
      pathItem[lowerMethod] = buildOperation(endpoint, lowerMethod);
    }

    const orderedPathItem: OpenApiPathItem = {};
    Object.entries(pathItem)
      .sort(([methodA], [methodB]) => (methodOrder[methodA] ?? 99) - (methodOrder[methodB] ?? 99))
      .forEach(([method, operation]) => {
        orderedPathItem[method] = operation;
      });

    paths[endpoint.path] = orderedPathItem;
  }

  return Object.fromEntries(
    Object.entries(paths).sort(([pathA], [pathB]) => pathA.localeCompare(pathB))
  );
}

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Gym Master API",
    version: "0.1.0",
    description:
      "Documentación completa de endpoints detectados en `src/app/api/**/route.ts`. Esta especificación debe actualizarse en cada feature que agregue o modifique APIs.",
    contact: {
      name: "Dragon Pyramid - Gym Master",
    },
  },
  servers: [
    {
      url: "/",
      description: "Origen actual de la aplicación Next.js",
    },
  ],
  tags,
  paths: buildPaths(),
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description:
          "Token JWT cuando el endpoint se consuma desde clientes externos o pruebas técnicas.",
      },
      nextAuthSession: {
        type: "apiKey",
        in: "cookie",
        name: "next-auth.session-token",
        description:
          "Sesión de NextAuth usada por el frontend de Gym Master.",
      },
    },
    schemas: {
      GenericSuccessResponse: {
        type: "object",
        additionalProperties: true,
        description:
          "Respuesta exitosa. La estructura final depende del módulo: puede incluir data, message, registros, KPIs o payloads específicos.",
        examples: [
          { data: [] },
          { message: "Operación realizada correctamente" },
        ],
      },
      AlertaMantenimientoEquipamiento: {
        type: "object",
        required: [
          "id",
          "nombre",
          "estado_alerta",
          "severidad",
          "mensaje",
        ],
        properties: {
          id: { type: "string", format: "uuid" },
          nombre: { type: "string", example: "Polea alta" },
          tipo: { type: "string", nullable: true, example: "Fuerza" },
          ubicacion: {
            type: "string",
            nullable: true,
            example: "Sala de musculación",
          },
          estado: {
            type: "string",
            nullable: true,
            example: "operativo",
          },
          proxima_revision: {
            type: "string",
            nullable: true,
            format: "date",
            example: "2026-05-25",
          },
          dias_para_revision: {
            type: "integer",
            nullable: true,
            example: 2,
          },
          estado_alerta: {
            type: "string",
            enum: [
              "vencido",
              "proximo",
              "ok",
              "sin_fecha",
              "en_mantenimiento",
              "fuera_de_servicio",
            ],
            example: "proximo",
          },
          severidad: {
            type: "string",
            enum: ["critica", "alta", "media", "baja", "ok"],
            example: "alta",
          },
          mensaje: {
            type: "string",
            example: "La revisión vence en 2 días.",
          },
        },
      },
      AlertasMantenimientoEquipamientoResponse: {
        type: "object",
        required: [
          "generated_at",
          "umbral_dias",
          "resumen",
          "alertas",
          "alertas_operativas",
        ],
        properties: {
          generated_at: {
            type: "string",
            format: "date-time",
          },
          umbral_dias: {
            type: "integer",
            minimum: 0,
            maximum: 90,
            example: 5,
          },
          resumen: {
            type: "object",
            properties: {
              total: { type: "integer", example: 12 },
              vencidos: { type: "integer", example: 2 },
              proximos: { type: "integer", example: 3 },
              ok: { type: "integer", example: 5 },
              sin_fecha: { type: "integer", example: 1 },
              en_mantenimiento: { type: "integer", example: 1 },
              fuera_de_servicio: { type: "integer", example: 0 },
            },
          },
          alertas: {
            type: "array",
            items: { $ref: "#/components/schemas/AlertaMantenimientoEquipamiento" },
          },
          alertas_operativas: {
            type: "array",
            description:
              "Subconjunto de alertas excluyendo estado ok, útil para el panel operativo.",
            items: { $ref: "#/components/schemas/AlertaMantenimientoEquipamiento" },
          },
        },
      },
      ErrorResponse: {
        type: "object",
        required: ["error"],
        properties: {
          error: {
            type: "string",
            example: "No autorizado",
          },
          message: {
            type: "string",
            example: "Detalle opcional del error",
          },
        },
      },
      IdMutationRequest: {
        type: "object",
        properties: {
          id: {
            type: "string",
            format: "uuid",
            example: "2d2a45df-0fd5-4f4e-9c01-5de07dca1111",
          },
        },
      },
      GenericMutationRequest: {
        type: "object",
        additionalProperties: true,
        description:
          "Payload genérico para endpoints de creación/actualización. Consultar la implementación del servicio asociado para campos exactos.",
        properties: {
          id: {
            type: "string",
            format: "uuid",
          },
          data: {
            type: "object",
            additionalProperties: true,
          },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "admin@gymmaster.local",
          },
          password: {
            type: "string",
            format: "password",
            example: "********",
          },
          userType: {
            type: "string",
            enum: ["admin", "usuario", "socio"],
            example: "admin",
          },
        },
      },
      ForgotPasswordRequest: {
        type: "object",
        required: ["email"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "socio@gymmaster.local",
          },
          rol: {
            type: "string",
            enum: ["admin", "usuario", "socio"],
            nullable: true,
            example: "socio",
          },
        },
      },
      ResetPasswordRequest: {
        type: "object",
        required: ["token", "new_password"],
        properties: {
          token: {
            type: "string",
            example: "reset-token-recibido-por-email",
          },
          new_password: {
            type: "string",
            format: "password",
            example: "NuevaClave2026!",
          },
        },
      },
      CatalogoParametrizableMutationRequest: {
        type: "object",
        required: ["catalogo"],
        properties: {
          catalogo: {
            type: "string",
            enum: [
              "tipo_empleado",
              "medio_pago",
              "tipo_gasto",
              "tipo_ingreso",
              "categoria_producto",
              "tipo_equipamiento",
              "ubicacion_equipamiento",
              "tipo_mantenimiento",
            ],
          },
          id: { type: "string", format: "uuid" },
          codigo: { type: "string", example: "mercado_pago" },
          nombre: { type: "string", example: "Mercado Pago" },
          descripcion: {
            type: "string",
            nullable: true,
            example: "Pago online o presencial registrado mediante Mercado Pago.",
          },
          activo: { type: "boolean", example: true },
          orden: { type: "integer", minimum: 0, example: 60 },
          requiere_comprobante: {
            type: "boolean",
            nullable: true,
            description: "Campo específico de medio_pago.",
          },
          es_online: {
            type: "boolean",
            nullable: true,
            description: "Campo específico de medio_pago.",
          },
          frecuencia_dias: {
            type: "integer",
            nullable: true,
            minimum: 1,
            description: "Campo específico de tipo_mantenimiento.",
          },
          alerta_dias_anticipacion: {
            type: "integer",
            nullable: true,
            minimum: 0,
            description: "Campo específico de tipo_mantenimiento.",
          },
        },
      },
    },
  },
} as const;
