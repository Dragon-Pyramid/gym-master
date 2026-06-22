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
  internal?: boolean;
};

type OpenApiOperation = Record<string, unknown>;
type OpenApiPathItem = Record<string, OpenApiOperation>;

const endpointDefinitions: EndpointDefinition[] = [

  {
    path: "/api/equipamientos/preventivos",
    methods: ["GET"],
    tag: "Equipamientos",
    summary: "Dashboard preventivos de equipamientos",
    description:
      "Devuelve planes preventivos, órdenes técnicas, historial técnico, equipos y métricas de mantenimiento preventivo de máquinas.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200, 401, 500],
    queryParams: [],
    source: "src/app/api/equipamientos/preventivos/route.ts",
  },
  {
    path: "/api/equipamientos/preventivos/planes",
    methods: ["POST"],
    tag: "Equipamientos",
    summary: "Crear plan preventivo de equipamiento",
    description:
      "Crea un plan preventivo por tipo de máquina con tareas técnicas y frecuencia en días.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [201, 400, 401, 500],
    queryParams: [],
    source: "src/app/api/equipamientos/preventivos/planes/route.ts",
  },
  {
    path: "/api/equipamientos/preventivos/ordenes",
    methods: ["POST"],
    tag: "Equipamientos",
    summary: "Crear orden técnica de equipamiento",
    description:
      "Crea una orden técnica preventiva, correctiva, de inspección, reparación o cambio de pieza para un equipamiento.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [201, 400, 401, 500],
    queryParams: [],
    source: "src/app/api/equipamientos/preventivos/ordenes/route.ts",
  },
  {
    path: "/api/equipamientos/preventivos/ordenes/{id}",
    methods: ["PATCH"],
    tag: "Equipamientos",
    summary: "Actualizar orden técnica de equipamiento",
    description:
      "Permite completar una orden técnica, registrar resultado, costo real, downtime y actualizar próxima revisión del equipo.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200, 400, 401, 500],
    queryParams: [],
    source: "src/app/api/equipamientos/preventivos/ordenes/[id]/route.ts",
  },

  {
    path: "/api/infraestructura/mantenimiento-edilicio",
    methods: ["GET"],
    tag: "Infraestructura",
    summary: "Dashboard de mantenimiento edilicio",
    description:
      "Devuelve sectores, categorías, activos edilicios, órdenes, alertas y métricas del módulo Infraestructura / Mantenimiento Edilicio.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200, 401, 500],
    queryParams: [],
    source: "src/app/api/infraestructura/mantenimiento-edilicio/route.ts",
  },
  {
    path: "/api/infraestructura/sectores",
    methods: ["POST"],
    tag: "Infraestructura",
    summary: "Crear sector edilicio",
    description:
      "Registra un sector físico del gimnasio como recepción, salón, baño, depósito, patio, oficina o sala de máquinas.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [201, 400, 401, 500],
    queryParams: [],
    source: "src/app/api/infraestructura/sectores/route.ts",
  },
  {
    path: "/api/infraestructura/activos",
    methods: ["POST"],
    tag: "Infraestructura",
    summary: "Crear activo edilicio",
    description:
      "Registra un activo propio del edificio o infraestructura: luminarias, matafuegos, cañerías, baños, mobiliario, tableros, pisos, pintura o cartelería.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [201, 400, 401, 500],
    queryParams: [],
    source: "src/app/api/infraestructura/activos/route.ts",
  },
  {
    path: "/api/infraestructura/ordenes",
    methods: ["POST"],
    tag: "Infraestructura",
    summary: "Crear orden de mantenimiento edilicio",
    description:
      "Crea una orden correctiva, preventiva, de inspección, cambio, vencimiento o certificación asociada a un activo edilicio o sector.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [201, 400, 401, 500],
    queryParams: [],
    source: "src/app/api/infraestructura/ordenes/route.ts",
  },
  {
    path: "/api/infraestructura/ordenes/{id}",
    methods: ["PATCH"],
    tag: "Infraestructura",
    summary: "Actualizar orden de mantenimiento edilicio",
    description:
      "Actualiza el estado, resultado, costo real, certificado u observaciones de una orden de mantenimiento edilicio. Al completarse, actualiza el activo asociado.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200, 400, 401, 500],
    queryParams: [],
    source: "src/app/api/infraestructura/ordenes/[id]/route.ts",
  },

  {
    path: "/api/infraestructura/qr",
    methods: ["POST"],
    tag: "Infraestructura",
    summary: "Generar QR/código de barras interno",
    description:
      "Genera o actualiza un código QR/barra reutilizable para activos edilicios, sectores, órdenes edilicias, equipamientos, productos o servicios.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [201, 400, 401, 500],
    queryParams: [],
    source: "src/app/api/infraestructura/qr/route.ts",
  },
  {
    path: "/api/infraestructura/qr/resolve",
    methods: ["GET"],
    tag: "Infraestructura",
    summary: "Resolver código QR/barra",
    description:
      "Resuelve un código leído por cámara o ingresado manualmente y devuelve el módulo destino dentro de Gym Master.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200, 400, 401, 500],
    queryParams: ["codigo"],
    source: "src/app/api/infraestructura/qr/resolve/route.ts",
  },
  {
    path: "/api/infraestructura/qr/labels",
    methods: ["GET"],
    tag: "Infraestructura",
    summary: "Dashboard de etiquetas QR",
    description:
      "Devuelve códigos QR activos y destinos imprimibles para etiquetas A4 de activos edilicios, sectores y equipamientos.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200, 401, 500],
    queryParams: [],
    source: "src/app/api/infraestructura/qr/labels/route.ts",
  },
  {
    path: "/api/infraestructura/checklists/ejecuciones",
    methods: ["POST"],
    tag: "Infraestructura",
    summary: "Ejecutar checklist edilicio",
    description:
      "Registra una ejecución de checklist asociada a un activo edilicio, sector u orden de mantenimiento, con resultado general y respuestas base.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [201, 400, 401, 500],
    queryParams: [],
    source: "src/app/api/infraestructura/checklists/ejecuciones/route.ts",
  },

  {
    path: "/api/actividades/turnos-cupos",
    methods: ["GET"],
    tag: "Actividades",
    summary: "Dashboard de actividades, turnos y cupos",
    description:
      "Devuelve KPIs, turnos, cupos, inscripciones, lista de espera y métricas operativas de actividades grupales.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200, 401, 500],
    queryParams: [],
    source: "src/app/api/actividades/turnos-cupos/route.ts",
  },
  {
    path: "/api/actividades/turnos-cupos/turnos",
    methods: ["POST"],
    tag: "Actividades",
    summary: "Crear turno de actividad",
    description:
      "Crea un turno programado con día, horario, cupo, instructor, ubicación, vigencia y estado operativo.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [201, 400, 401, 500],
    queryParams: [],
    source: "src/app/api/actividades/turnos-cupos/turnos/route.ts",
  },
  {
    path: "/api/actividades/turnos-cupos/turnos/{id}",
    methods: ["PUT", "DELETE"],
    tag: "Actividades",
    summary: "Actualizar o eliminar turno de actividad",
    description:
      "Actualiza los datos de un turno o elimina un turno junto con sus inscripciones asociadas según reglas de base de datos.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200, 400, 401, 500],
    queryParams: [],
    source: "src/app/api/actividades/turnos-cupos/turnos/[id]/route.ts",
  },
  {
    path: "/api/actividades/turnos-cupos/inscripciones",
    methods: ["POST"],
    tag: "Actividades",
    summary: "Inscribir socio a turno",
    description:
      "Inscribe un socio a un turno activo y lo deriva automáticamente a lista de espera cuando el cupo está completo.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [201, 400, 401, 500],
    queryParams: [],
    source: "src/app/api/actividades/turnos-cupos/inscripciones/route.ts",
  },
  {
    path: "/api/actividades/turnos-cupos/inscripciones/{id}",
    methods: ["PUT", "DELETE"],
    tag: "Actividades",
    summary: "Actualizar o eliminar inscripción",
    description:
      "Permite marcar asistencia, ausencia, cancelación, lista de espera o eliminar una inscripción de turno.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200, 400, 401, 500],
    queryParams: [],
    source: "src/app/api/actividades/turnos-cupos/inscripciones/[id]/route.ts",
  },
  {
    path: "/api/gimnasio-parametrizacion",
    methods: ["GET", "PATCH"],
    tag: "Parametrización",
    summary: "Branding y datos legales del gimnasio",
    description:
      "Consulta y actualiza la parametrización comercial, legal y visual del gimnasio cliente, incluyendo configuración operativa de pagos online Stripe.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [200, 400, 401, 403, 500],
    queryParams: [],
    source: "src/app/api/gimnasio-parametrizacion/route.ts",
  },

  {
    path: "/api/gimnasio-parametrizacion/logo-upload",
    methods: ["POST"],
    tag: "Parametrización",
    summary: "Subida de logo del gimnasio a Cloudinary",
    description:
      "Sube el logo principal del gimnasio a Cloudinary y devuelve la URL segura para guardarla en la parametrización legal/comercial.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [200, 400, 401, 403, 500],
    queryParams: [],
    source: "src/app/api/gimnasio-parametrizacion/logo-upload/route.ts",
  },

  {
    path: "/api/gimnasio-parametrizacion/stripe-status",
    methods: ["GET"],
    tag: "Parametrización",
    summary: "Estado de pagos online Stripe del gimnasio",
    description:
      "Devuelve si el gimnasio tiene habilitados los pagos online con Stripe para condicionar la experiencia del socio y los endpoints de checkout.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200, 401, 403, 500],
    queryParams: [],
    source: "src/app/api/gimnasio-parametrizacion/stripe-status/route.ts",
  },

  {
    path: "/api/admin/respaldo-negocio",
    methods: ["GET"],
    tag: "Respaldo / Exportación",
    summary: "Módulos e historial de respaldo de negocio",
    description:
      "Devuelve módulos exportables del negocio e historial auditado de exportaciones realizadas por administradores.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [200, 401, 403, 500],
    queryParams: [],
    source: "src/app/api/admin/respaldo-negocio/route.ts",
  },
  {
    path: "/api/admin/respaldo-negocio/exportar",
    methods: ["POST"],
    tag: "Respaldo / Exportación",
    summary: "Generar respaldo exportable del negocio",
    description:
      "Genera archivo XLSX o JSON con módulos operativos seleccionados. Excluye contraseñas, secretos, tokens, migraciones privadas, datasets propietarios y know-how interno Dragon Pyramid. Registra auditoría de exportación.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [200, 400, 401, 403, 500],
    queryParams: [],
    source: "src/app/api/admin/respaldo-negocio/exportar/route.ts",
  },

  {
    path: "/api/soporte/tickets",
    methods: ["GET", "POST"],
    tag: "Soporte Dragon Pyramid",
    summary: "Tickets de soporte hacia Dragon Pyramid",
    description:
      "Permite a administradores y usuarios internos consultar y crear tickets de soporte dirigidos a Dragon Pyramid / Gym Master, con categoría, prioridad, estado y notificación por email.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [200, 201, 400, 401, 403, 500],
    queryParams: ["estado", "q"],
    source: "src/app/api/soporte/tickets/route.ts",
  },
  {
    path: "/api/soporte/tickets/{id}",
    methods: ["GET", "PATCH"],
    tag: "Soporte Dragon Pyramid",
    summary: "Detalle, estado e historial de ticket de soporte",
    description:
      "Permite consultar detalle de un ticket, cambiar estado, registrar comentario, marcar respuesta o cerrar el ticket de soporte.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [200, 400, 401, 403, 404, 500],
    queryParams: [],
    source: "src/app/api/soporte/tickets/[id]/route.ts",
  },

  {
    path: "/api/socios/mensajes",
    methods: ["GET", "POST"],
    tag: "Mensajería",
    summary: "Mensajes del socio a administración",
    description:
      "Permite al socio autenticado consultar su historial y enviar consultas, reclamos, críticas, preguntas o sugerencias a administración.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200, 201, 400, 401, 500],
    queryParams: [],
    source: "src/app/api/socios/mensajes/route.ts",
  },
  {
    path: "/api/admin/socios-mensajes",
    methods: ["GET"],
    tag: "Mensajería",
    summary: "Bandeja administrativa de mensajes de socios",
    description:
      "Permite a administración consultar la bandeja de mensajes enviados por socios, con filtros por estado y búsqueda.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [200, 401, 403, 500],
    queryParams: ["estado", "q"],
    source: "src/app/api/admin/socios-mensajes/route.ts",
  },
  {
    path: "/api/admin/socios-mensajes/{id}",
    methods: ["GET", "PATCH"],
    tag: "Mensajería",
    summary: "Detalle y respuesta administrativa de mensaje de socio",
    description:
      "Permite a administración leer, responder, marcar como leído o cerrar un mensaje enviado por un socio. Al responder, se intenta enviar email al socio mediante Brevo.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [200, 400, 401, 403, 404, 500],
    queryParams: [],
    source: "src/app/api/admin/socios-mensajes/[id]/route.ts",
  },
  {
    path: "/api/notificaciones",
    methods: ["GET", "POST"],
    tag: "Notificaciones",
    summary: "Operaciones de notificaciones",
    description:
      "Consulta y registra notificaciones, avisos programados, plantillas operativas y base para envío por email o visualización futura en Terminal.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [200, 201, 400, 401, 500],
    queryParams: [],
    source: "src/app/api/notificaciones/route.ts",
  },
  {
    path: "/api/notificaciones/{id}",
    methods: ["GET", "PATCH", "DELETE"],
    tag: "Notificaciones",
    summary: "Operación sobre notificación por identificador",
    description:
      "Consulta detalle con historial de envíos, actualiza o cancela una notificación por ID.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [200, 400, 401, 404, 500],
    queryParams: [],
    source: "src/app/api/notificaciones/[id]/route.ts",
  },
  {
    path: "/api/notificaciones/{id}/enviar",
    methods: ["POST"],
    tag: "Notificaciones",
    summary: "Preparar/envíar notificación",
    description:
      "Resuelve destinatarios del segmento seleccionado, registra historial de envíos y marca la notificación como enviada. Base futura para integración con proveedor real de email.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [200, 400, 401, 500],
    queryParams: [],
    source: "src/app/api/notificaciones/[id]/enviar/route.ts",
  },
  {
    path: "/api/notificaciones/plantillas",
    methods: ["GET"],
    tag: "Notificaciones",
    summary: "Plantillas de notificación",
    description:
      "Consulta plantillas activas para feriados, promociones, stock, cumpleaños y otros avisos operativos.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [200, 401, 500],
    queryParams: [],
    source: "src/app/api/notificaciones/plantillas/route.ts",
  },

  {
    path: "/api/auth/change-password",
    methods: ["POST"],
    tag: "Auth",
    summary: "Cambio obligatorio de contraseña inicial",
    description:
      "Permite que un usuario autenticado cambie su contraseña temporal inicial y reciba un token actualizado sin la marca must_change_password.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200, 400, 401, 500],
    queryParams: [],
    source: "src/app/api/auth/change-password/route.ts",
  },

  {
    path: "/api/auth/forgot-password",
    methods: ["POST"],
    tag: "Auth",
    summary: "Solicitar recuperación de contraseña por email",
    description:
      "Recibe email y tipo de acceso, genera token seguro de un solo uso, registra auditoría y envía enlace de recuperación por email sin revelar si la cuenta existe.",
    auth: false,
    admin: false,
    notImplemented: false,
    statuses: [200, 400, 500],
    queryParams: [],
    source: "src/app/api/auth/forgot-password/route.ts",
  },
  {
    path: "/api/auth/terminal-session/refresh",
    methods: ["POST"],
    tag: "Auth",
    summary: "Renovar sesión extendida de Terminal",
    description:
      "Renueva de forma segura el JWT de una pantalla Terminal de asistencia antes de que expire, validando que el usuario autenticado tenga permisos sobre la Terminal.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200, 401, 403, 500],
    queryParams: [],
    source: "src/app/api/auth/terminal-session/refresh/route.ts",
  },

  {
    path: "/api/auth/reset-password",
    methods: ["GET", "POST"],
    tag: "Auth",
    summary: "Validar token y restablecer contraseña",
    description:
      "GET valida un token de recuperación. POST actualiza la contraseña con política fuerte, marca el token como usado, limpia must_change_password y registra auditoría.",
    auth: false,
    admin: false,
    notImplemented: false,
    statuses: [200, 400, 500],
    queryParams: ["token"],
    source: "src/app/api/auth/reset-password/route.ts",
  },

  {
    path: "/api/empleados",
    methods: ["GET", "POST"],
    tag: "Empleados",
    summary: "Operaciones de empleados",
    description:
      "Consulta y registra empleados del gimnasio. Mantiene el perfil laboral interno y permite vincularlo a una identidad en public.usuario, sincronizando estado activo/inactivo cuando corresponde. Reemplaza progresivamente el módulo legacy de entrenadores y prepara integración futura con sueldos, usuarios internos y RBAC.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [200, 201, 400, 401, 500],
    queryParams: [],
    source: "src/app/api/empleados/route.ts",
  },
  {
    path: "/api/empleados/{id}",
    methods: ["GET", "PATCH", "DELETE"],
    tag: "Empleados",
    summary: "Operación sobre empleado por identificador",
    description:
      "Consulta, actualiza o desactiva lógicamente un empleado por ID. La baja no borra físicamente el registro para conservar trazabilidad.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [200, 400, 401, 404, 500],
    queryParams: [],
    source: "src/app/api/empleados/[id]/route.ts",
  },

  {
    path: "/api/empleados-sueldos",
    methods: ["GET", "POST"],
    tag: "Empleados / Sueldos",
    summary: "Operaciones de sueldos de empleados",
    description:
      "Consulta y registra liquidaciones opcionales de sueldos, pagos y recibos internos de empleados. Base futura para integración con egresos, finanzas y RBAC.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [200, 201, 400, 401, 500],
    queryParams: [],
    source: "src/app/api/empleados-sueldos/route.ts",
  },
  {
    path: "/api/empleados-sueldos/{id}",
    methods: ["GET", "PATCH", "DELETE"],
    tag: "Empleados / Sueldos",
    summary: "Operación sobre sueldo de empleado por identificador",
    description:
      "Consulta, actualiza o anula lógicamente una liquidación de sueldo. La anulación conserva trazabilidad para auditoría.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [200, 400, 401, 404, 500],
    queryParams: [],
    source: "src/app/api/empleados-sueldos/[id]/route.ts",
  },


  {
    path: "/api/socios/ranking-bonificacion-mensual",
    methods: ["GET", "PATCH"],
    tag: "Socios",
    summary: "Ranking y bonificación mensual de socios",
    description:
      "Calcula el ranking mensual de socios por asistencia y cuota al día. Permite registrar o quitar bonificaciones comerciales mensuales.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200, 400, 401, 403, 409, 500],
    queryParams: ["anio", "mes"],
    source: "src/app/api/socios/ranking-bonificacion-mensual/route.ts",
  },
  {
    path: "/api/socios/demografia-promociones-bi",
    methods: ["GET"],
    tag: "Socios / BI",
    summary: "BI demográfico de socios y promociones sugeridas",
    description:
      "Consolida distribución por género, franjas etarias, altas, asistencia, pagos, consumo por segmento y sugerencias comerciales para promociones del gimnasio.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [200, 400, 401, 403, 500],
    queryParams: ["desde", "hasta"],
    source: "src/app/api/socios/demografia-promociones-bi/route.ts",
  },

  {
    path: "/api/finanzas/dashboard-bi",
    methods: ["GET"],
    tag: "Finanzas / BI",
    summary: "Dashboard financiero de ingresos y egresos",
    description:
      "Consolida ingresos por cuotas y ventas, egresos por compras y gastos, resultado neto, compromisos pendientes y serie mensual para el dashboard financiero.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [200, 400, 401, 500],
    queryParams: ["desde", "hasta"],
    source: "src/app/api/finanzas/dashboard-bi/route.ts",
  },

  {
    path: "/api/compras",
    methods: ["GET", "POST"],
    tag: "Comercial / compras",
    summary: "Operaciones de compras a proveedores",
    description:
      "Consulta y registra compras a proveedores con detalle de productos, actualización de stock, movimiento de stock e historial de costos.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [200, 201, 400, 401, 500],
    queryParams: ["proveedor_id", "estado"],
    source: "src/app/api/compras/route.ts",
  },
  {
    path: "/api/compras/{id}",
    methods: ["GET", "PATCH", "DELETE"],
    tag: "Comercial / compras",
    summary: "Operación sobre compra por identificador",
    description:
      "Consulta, actualiza estado o anula una compra. Al anular, revierte stock si la operación no deja stock negativo.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [200, 400, 401, 404, 500],
    queryParams: [],
    source: "src/app/api/compras/[id]/route.ts",
  },
  {
    path: "/api/actividades/{id}",
    methods: ["GET"],
    tag: "Catálogos y operación",
    summary: "Operación sobre actividades por identificador",
    description:
      "Consulta datos de actividades. Si el endpoint usa parámetros dinámicos, el identificador forma parte de la URL. Implementación relacionada: getActividadById.",
    auth: false,
    admin: false,
    notImplemented: false,
    statuses: [200, 500],
    queryParams: [],
    source: "src/app/api/actividades/[id]/route.ts",
  },
  {
    path: "/api/actividades",
    methods: ["GET", "POST", "PUT", "DELETE"],
    tag: "Catálogos y operación",
    summary: "Operaciones de actividades",
    description:
      "Consulta datos de actividades. Si el endpoint usa parámetros dinámicos, el identificador forma parte de la URL. Implementación relacionada: createActividad, deleteActividad, fetchAllActividades, updateActividad.",
    auth: false,
    admin: false,
    notImplemented: false,
    statuses: [200, 201, 400, 500],
    queryParams: [],
    source: "src/app/api/actividades/route.ts",
  },
  {
    path: "/api/admin/cuotas/dashboard-bi",
    methods: ["GET"],
    tag: "Administración y BI",
    summary: "Dashboard BI de cuotas y pagos",
    description:
      "Consolida KPIs, pagos recientes, socios vencidos, socios sin pagos, evolución de precio de cuota y resumen por método de pago para el dashboard administrativo.",
    auth: false,
    admin: true,
    notImplemented: false,
    statuses: [500],
    queryParams: [],
    source: "src/app/api/admin/cuotas/dashboard-bi/route.ts",
  },
  {
    path: "/api/admin/cuotas/estado-socios",
    methods: ["GET"],
    tag: "Administración y BI",
    summary: "Estado de cuotas de socios",
    description:
      "Devuelve el estado operativo de cuotas por socio, incluyendo al día, vencidos, sin pagos y próximos a vencer.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [200],
    queryParams: [],
    source: "src/app/api/admin/cuotas/estado-socios/route.ts",
  },
  {
    path: "/api/admin/cuotas/resumen",
    methods: ["GET"],
    tag: "Administración y BI",
    summary: "Resumen administrativo de cuotas",
    description:
      "Devuelve un resumen compacto para el dashboard: estados, pagos por método, vencidos, sin pagos y próximos a vencer.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [200],
    queryParams: [],
    source: "src/app/api/admin/cuotas/resumen/route.ts",
  },
  {
    path: "/api/admin/metricas/asistencia/{tipo}",
    methods: ["GET"],
    tag: "Administración y BI",
    summary: "Métricas de concurrencia por tipo",
    description:
      "Devuelve métricas de asistencia según el tipo solicitado: semanal, mensual o anual.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [400, 401, 403, 404, 500],
    queryParams: [],
    source: "src/app/api/admin/metricas/asistencia/[tipo]/route.ts",
  },
  {
    path: "/api/admin/metricas/asistencia/prediccion-abandono",
    methods: ["GET"],
    tag: "Administración y BI",
    summary: "Predicción de abandono de socios",
    description:
      "Endpoint reservado para un modelo o lógica de predicción de abandono. Actualmente puede responder 501 si no está implementado.",
    auth: true,
    admin: true,
    notImplemented: true,
    statuses: [401, 403, 500, 501],
    queryParams: [],
    source:
      "src/app/api/admin/metricas/asistencia/prediccion-abandono/route.ts",
  },
  {
    path: "/api/admin/metricas/asistencia/top-inactivos",
    methods: ["GET"],
    tag: "Administración y BI",
    summary: "Top de socios inactivos",
    description:
      "Endpoint reservado para ranking de socios con baja asistencia o riesgo de inactividad. Actualmente puede responder 501 si no está implementado.",
    auth: true,
    admin: true,
    notImplemented: true,
    statuses: [401, 403, 500, 501],
    queryParams: [],
    source: "src/app/api/admin/metricas/asistencia/top-inactivos/route.ts",
  },
  {
    path: "/api/admin/metricas/equipamiento/costo-beneficio",
    methods: ["GET"],
    tag: "Administración y BI",
    summary: "Análisis costo-beneficio de equipamiento",
    description:
      "Devuelve análisis de costo-beneficio del equipamiento para decisiones de mantenimiento, reemplazo o inversión.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [401, 403, 404, 500],
    queryParams: [],
    source: "src/app/api/admin/metricas/equipamiento/costo-beneficio/route.ts",
  },
  {
    path: "/api/admin/metricas/equipamiento/estado-actual",
    methods: ["GET"],
    tag: "Administración y BI",
    summary: "Estado actual de equipamiento",
    description:
      "Devuelve semáforo o estado operativo actual del equipamiento del gimnasio.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [401, 403, 404, 500],
    queryParams: [],
    source: "src/app/api/admin/metricas/equipamiento/estado-actual/route.ts",
  },
  {
    path: "/api/admin/metricas/equipamiento/prediccion-fallo",
    methods: ["GET"],
    tag: "Administración y BI",
    summary: "Predicción de fallos de equipamiento",
    description:
      "Endpoint reservado para análisis predictivo de fallos. Actualmente puede responder 501 si no está implementado.",
    auth: true,
    admin: true,
    notImplemented: true,
    statuses: [401, 403, 500, 501],
    queryParams: [],
    source: "src/app/api/admin/metricas/equipamiento/prediccion-fallo/route.ts",
  },
  {
    path: "/api/admin/metricas/equipamiento/top-fallos",
    methods: ["GET"],
    tag: "Administración y BI",
    summary: "Ranking de fallos de equipamiento",
    description:
      "Devuelve ranking o resumen de equipamientos con mayor cantidad de fallos.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [401, 403, 404, 500],
    queryParams: [],
    source: "src/app/api/admin/metricas/equipamiento/top-fallos/route.ts",
  },
  {
    path: "/api/admin/metricas/pagos/histograma",
    methods: ["GET"],
    tag: "Administración y BI",
    summary: "Histograma de conducta de pagos",
    description:
      "Devuelve distribución de pagos para análisis de comportamiento financiero de socios.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [401, 403, 404, 500],
    queryParams: [],
    source: "src/app/api/admin/metricas/pagos/histograma/route.ts",
  },
  {
    path: "/api/admin/metricas/pagos/proyeccion-ingresos",
    methods: ["GET"],
    tag: "Administración y BI",
    summary: "Proyección de ingresos",
    description:
      "Endpoint reservado para proyección de ingresos. Actualmente puede responder 501 si no está implementado.",
    auth: true,
    admin: true,
    notImplemented: true,
    statuses: [401, 403, 500, 501],
    queryParams: [],
    source: "src/app/api/admin/metricas/pagos/proyeccion-ingresos/route.ts",
  },
  {
    path: "/api/admin/metricas/pagos/segmentacion",
    methods: ["GET"],
    tag: "Administración y BI",
    summary: "Segmentación de conducta de pagos",
    description:
      "Devuelve segmentación de socios o pagos según comportamiento financiero.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [401, 403, 404, 500],
    queryParams: [],
    source: "src/app/api/admin/metricas/pagos/segmentacion/route.ts",
  },
  {
    path: "/api/admin/metricas/retencion_por_combinacion",
    methods: ["GET"],
    tag: "Administración y BI",
    summary: "Retención por combinación de rutina",
    description:
      "Devuelve análisis de retención agrupado por objetivo, nivel y frecuencia semanal.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [200, 401, 403, 404, 500],
    queryParams: [],
    source: "src/app/api/admin/metricas/retencion_por_combinacion/route.ts",
  },
  {
    path: "/api/admin/metricas/rutinas/adherencia",
    methods: ["GET"],
    tag: "Administración y BI",
    summary: "Adherencia mensual a rutinas",
    description: "Devuelve métricas de adherencia mensual a rutinas.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [401, 403, 404, 500],
    queryParams: [],
    source: "src/app/api/admin/metricas/rutinas/adherencia/route.ts",
  },
  {
    path: "/api/admin/metricas/rutinas/evolucion-promedio",
    methods: ["GET"],
    tag: "Administración y BI",
    summary: "Evolución promedio por objetivo",
    description:
      "Devuelve evolución promedio agrupada por objetivo de entrenamiento.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [401, 403, 404, 500],
    queryParams: [],
    source: "src/app/api/admin/metricas/rutinas/evolucion-promedio/route.ts",
  },
  {
    path: "/api/admin/metricas/rutinas/generar-rutina",
    methods: ["POST"],
    tag: "Administración y BI",
    summary: "Métrica de generación de rutina",
    description:
      "Ejecuta o consulta lógica administrativa vinculada a generación de rutinas.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [200, 401, 403, 404, 500],
    queryParams: [],
    source: "src/app/api/admin/metricas/rutinas/generar-rutina/route.ts",
  },
  {
    path: "/api/admin/metricas/rutinas/generar-rutina-personalizada",
    methods: ["POST"],
    tag: "Administración y BI",
    summary: "Generación de rutina personalizada",
    description:
      "Ejecuta lógica administrativa para generación personalizada de rutinas.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [200, 401, 403, 404, 500],
    queryParams: [],
    source:
      "src/app/api/admin/metricas/rutinas/generar-rutina-personalizada/route.ts",
  },
  {
    path: "/api/asistencias/qr-dia",
    methods: ["GET"],
    tag: "Asistencias",
    summary: "QR diario de asistencia",
    description:
      "Genera el QR diario de asistencia para que los socios lo escaneen desde su sesión. El QR incluye un token vigente para el día.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200, 401, 500],
    queryParams: [],
    source: "src/app/api/asistencias/qr-dia/route.ts",
  },
  {
    path: "/api/asistencias/aforo",
    methods: ["GET"],
    tag: "Asistencias",
    summary: "Aforo actual del gimnasio",
    description:
      "Devuelve el aforo operativo del día calculado desde asistencias con ingreso abierto sin hora de egreso. Incluye capacidad configurada por entorno, porcentaje de ocupación, estado semafórico, socios dentro, movimientos recientes, entradas y salidas del día.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [200, 401, 403, 500],
    queryParams: [],
    source: "src/app/api/asistencias/aforo/route.ts",
  },
  {
    path: "/api/asistencias/{id}/salida",
    methods: ["POST"],
    tag: "Asistencias",
    summary: "Registro administrativo de salida",
    description:
      "Cierra una asistencia abierta registrando la hora de egreso actual de Argentina. Permite al administrador o usuario interno registrar manualmente salidas pendientes para mantener el aforo actualizado.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [200, 400, 401, 403, 500],
    queryParams: [],
    source: "src/app/api/asistencias/[id]/salida/route.ts",
  },
  {
    path: "/api/asistencias/ranking-mensual",
    methods: ["POST"],
    tag: "Asistencias",
    summary: "Ranking mensual de asistencia",
    description:
      "Calcula ranking mensual de asistencia para un período solicitado.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [401, 500],
    queryParams: [],
    source: "src/app/api/asistencias/ranking-mensual/route.ts",
  },
  {
    path: "/api/asistencias/recientes",
    methods: ["GET"],
    tag: "Asistencias",
    summary: "Asistencias recientes",
    description:
      "Devuelve las últimas asistencias recientes para mostrar actividad operativa en el panel administrativo, incluyendo socio, foto, hora de ingreso y estado de acceso/cuota. Si el socio está sin pagos o moroso, la respuesta permite mostrar alerta roja de regularización en lugar de bienvenida.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200, 401, 500],
    queryParams: [],
    source: "src/app/api/asistencias/recientes/route.ts",
  },
  {
    path: "/api/asistencias/registro-qr",
    methods: ["GET", "POST"],
    tag: "Asistencias",
    summary: "Registro de asistencia por QR",
    description:
      "Valida el token del QR diario y opera como entrada/salida del socio autenticado usando fecha y hora local de Argentina. Si existe una asistencia abierta del día, registra hora de egreso; si no existe, registra ingreso. Antes de un nuevo ingreso sincroniza morosidad: bloquea/desactiva socios sin pagos o vencidos fuera de tolerancia, deja auditoría y mantiene alertas visuales para dashboard administrador.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200, 400, 401, 403],
    queryParams: ["tokenAsistencia"],
    source: "src/app/api/asistencias/registro-qr/route.ts",
  },
  {
    path: "/api/asistencias",
    methods: ["GET", "POST", "PUT", "DELETE"],
    tag: "Asistencias",
    summary: "Operaciones de asistencias",
    description:
      "Consulta datos de asistencias. Si el endpoint usa parámetros dinámicos, el identificador forma parte de la URL. Requiere usuario autenticado cuando el middleware/servicio lo valide. Implementación relacionada: getAllAsistencias, createAsistencia, updateAsistencia, deleteAsistencia.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200, 201, 400, 401, 500],
    queryParams: [],
    source: "src/app/api/asistencias/route.ts",
  },
  {
    path: "/api/auth/{nextauth}",
    methods: ["GET", "POST"],
    tag: "Autenticación",
    summary: "NextAuth credentials",
    description:
      "Endpoint interno de NextAuth para autenticación por credenciales y gestión de sesión.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [],
    queryParams: [],
    source: "src/app/api/auth/[...nextauth]/route.ts",
  },
  {
    path: "/api/avisos/{id}",
    methods: ["GET", "PUT", "DELETE"],
    tag: "Catálogos y operación",
    summary: "Operación sobre avisos por identificador",
    description:
      "Consulta datos de avisos. Si el endpoint usa parámetros dinámicos, el identificador forma parte de la URL. Implementación relacionada: getAvisoById, updateAviso, deleteAviso.",
    auth: false,
    admin: false,
    notImplemented: false,
    statuses: [404, 500],
    queryParams: [],
    source: "src/app/api/avisos/[id]/route.ts",
  },
  {
    path: "/api/avisos",
    methods: ["GET", "POST"],
    tag: "Catálogos y operación",
    summary: "Operaciones de avisos",
    description:
      "Consulta datos de avisos. Si el endpoint usa parámetros dinámicos, el identificador forma parte de la URL. Implementación relacionada: getAllAvisos, createAviso.",
    auth: false,
    admin: false,
    notImplemented: false,
    statuses: [201, 500],
    queryParams: [],
    source: "src/app/api/avisos/route.ts",
  },
  {
    path: "/api/cuota/{id}",
    methods: ["GET"],
    tag: "Cuotas y pagos",
    summary: "Operación sobre cuotas por identificador",
    description:
      "Consulta datos de cuotas. Si el endpoint usa parámetros dinámicos, el identificador forma parte de la URL. Implementación relacionada: getCuotaById.",
    auth: false,
    admin: false,
    notImplemented: false,
    statuses: [200],
    queryParams: [],
    source: "src/app/api/cuota/[id]/route.ts",
  },
  {
    path: "/api/cuota",
    methods: ["GET", "POST", "PUT", "DELETE"],
    tag: "Cuotas y pagos",
    summary: "Operaciones de cuotas",
    description:
      "Consulta datos de cuotas. Si el endpoint usa parámetros dinámicos, el identificador forma parte de la URL. Implementación relacionada: createCuota, deleteCuota, getAllCuotas, updateCuota.",
    auth: false,
    admin: false,
    notImplemented: false,
    statuses: [200, 201, 400, 500],
    queryParams: [],
    source: "src/app/api/cuota/route.ts",
  },
  {
    path: "/api/cuota-estado",
    methods: ["GET"],
    tag: "Cuotas y pagos",
    summary: "Estado de cuota",
    description:
      "Devuelve estado de cuota para socio autenticado, socio específico por query o resumen administrativo según rol. Para socios incluye estado_cuota, vencimiento_cuota, fecha_limite_pago con 7 días de gracia y monto_adeudado estimado desde la cuota vigente.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200, 400],
    queryParams: ["socio_id"],
    source: "src/app/api/cuota-estado/route.ts",
  },
  {
    path: "/api/custom-login",
    methods: ["POST"],
    tag: "Autenticación",
    summary: "Login personalizado",
    description:
      "Valida credenciales y tipo de usuario para iniciar sesión en el sistema. Para socios, evalúa estado activo, sin pagos y mora mayor a 7 días; si corresponde, desactiva con auditoría y devuelve mensaje de regularización administrativa.",
    auth: false,
    admin: false,
    notImplemented: false,
    statuses: [200, 400, 401, 403, 500],
    queryParams: [],
    source: "src/app/api/custom-login/route.ts",
  },
  {
    path: "/api/dieta/generar",
    methods: ["POST"],
    tag: "Dietas",
    summary: "Generar dieta para socio",
    description:
      "Crea una dieta asociada a un socio a partir de datos del usuario autenticado.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [201, 400, 401, 500],
    queryParams: [],
    source: "src/app/api/dieta/generar/route.ts",
  },
  {
    path: "/api/dieta/rag-assistant/generar",
    methods: ["POST"],
    tag: "Dietas",
    summary: "Generar dieta desde asistente RAG",
    description:
      "Genera una dieta con el generador formal de Gym Master y consulta el RAG interno para recuperar reglas nutricionales reales desde comida_base. Mantiene fallback seguro y disclaimers nutricionales.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [201, 400, 401, 500],
    queryParams: [],
    source: "src/app/api/dieta/rag-assistant/generar/route.ts",
  },
  {
    path: "/api/dieta/{id}",
    methods: ["GET"],
    tag: "Dietas",
    summary: "Detalle de dieta",
    description:
      "Consulta una dieta puntual por identificador para vistas administrativas y detalle moderno.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200, 400, 401, 404, 500],
    queryParams: [],
    source: "src/app/api/dieta/[id]/route.ts",
  },
  {
    path: "/api/dieta/socio/{id}",
    methods: ["GET"],
    tag: "Dietas",
    summary: "Dietas de un socio",
    description:
      "Lista dietas asociadas a un socio específico. Si el socio no tiene dietas, devuelve una lista vacía.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200, 400, 401, 500],
    queryParams: [],
    source: "src/app/api/dieta/socio/[id]/route.ts",
  },
  {
    path: "/api/dieta/todas",
    methods: ["GET"],
    tag: "Dietas",
    summary: "Todas las dietas",
    description: "Lista dietas registradas según permisos del usuario.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200, 401, 404, 500],
    queryParams: [],
    source: "src/app/api/dieta/todas/route.ts",
  },
  {
    path: "/api/entrenadores/{id}/horarios",
    methods: ["GET"],
    tag: "Empleados y entrenadores",
    summary: "Horarios de entrenador",
    description: "Devuelve horarios asociados a un entrenador por ID.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200, 400, 401, 404, 500],
    queryParams: [],
    source: "src/app/api/entrenadores/[id]/horarios/route.ts",
  },
  {
    path: "/api/entrenadores/{id}",
    methods: ["GET", "PUT"],
    tag: "Empleados y entrenadores",
    summary: "Operación sobre entrenadores/empleados por identificador",
    description:
      "Consulta datos de entrenadores/empleados. Si el endpoint usa parámetros dinámicos, el identificador forma parte de la URL. Requiere usuario autenticado cuando el middleware/servicio lo valide. Implementación relacionada: getEntrenadorById, updateEntrenador.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200, 400, 401, 404, 500],
    queryParams: [],
    source: "src/app/api/entrenadores/[id]/route.ts",
  },
  {
    path: "/api/entrenadores",
    methods: ["GET", "POST"],
    tag: "Empleados y entrenadores",
    summary: "Operaciones de entrenadores/empleados",
    description:
      "Consulta datos de entrenadores/empleados. Si el endpoint usa parámetros dinámicos, el identificador forma parte de la URL. Requiere permisos administrativos cuando el middleware/servicio lo valide. Implementación relacionada: createEntrenador, getEntrenadores.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [201, 400, 401, 403, 500],
    queryParams: [],
    source: "src/app/api/entrenadores/route.ts",
  },
  {
    path: "/api/equipamientos/alertas-mantenimiento",
    methods: ["GET"],
    tag: "Equipamiento",
    summary: "Alertas de mantenimiento de equipamiento",
    description:
      "Devuelve el tablero operativo de alertas de mantenimiento calculado a partir de la próxima revisión, el estado del equipamiento y un umbral configurable en días. Permite detectar equipos vencidos, próximos a revisión, en mantenimiento, fuera de servicio o sin fecha de revisión. Se usa en el módulo de Equipamientos para mostrar alertas anticipadas y priorizar tareas.",
    auth: false,
    admin: false,
    notImplemented: false,
    statuses: [200, 500],
    queryParams: ["umbralDias"],
    source: "src/app/api/equipamientos/alertas-mantenimiento/route.ts",
  },
  {
    path: "/api/equipamientos/mantenimiento-bi",
    methods: ["GET"],
    tag: "Equipamiento",
    summary: "BI de mantenimiento de equipamiento",
    description:
      "Devuelve métricas, reportes y datos gráficos para mantenimiento de equipamiento: estado del parque, costos mensuales, distribución por tipo/ubicación, ranking por costo/frecuencia, historial reciente de mantenimiento y recomendaciones para evaluar venta o reemplazo de equipos con mantenimiento repetido o costoso.",
    auth: false,
    admin: false,
    notImplemented: false,
    statuses: [200, 500],
    queryParams: [],
    source: "src/app/api/equipamientos/mantenimiento-bi/route.ts",
  },
  {
    path: "/api/equipamientos/{id}",
    methods: ["PUT", "DELETE"],
    tag: "Equipamiento",
    summary: "Operación sobre equipamientos por identificador",
    description:
      "Actualiza datos de equipamientos. Normalmente requiere un identificador y un objeto con los campos a modificar. Implementación relacionada: deleteEquipamiento, updateEquipamiento.",
    auth: false,
    admin: false,
    notImplemented: false,
    statuses: [200, 201, 400, 500],
    queryParams: [],
    source: "src/app/api/equipamientos/[id]/route.ts",
  },
  {
    path: "/api/equipamientos",
    methods: ["GET", "POST"],
    tag: "Equipamiento",
    summary: "Operaciones de equipamientos",
    description:
      "Consulta datos de equipamientos. Si el endpoint usa parámetros dinámicos, el identificador forma parte de la URL. Implementación relacionada: createEquipamiento, getAllEquipamientos.",
    auth: false,
    admin: false,
    notImplemented: false,
    statuses: [200, 201, 400, 500],
    queryParams: [],
    source: "src/app/api/equipamientos/route.ts",
  },
  {
    path: "/api/evolucion_socio/{socio_id}",
    methods: ["GET"],
    tag: "Evolución física",
    summary: "Historial de evolución física de socio",
    description: "Devuelve registros de evolución física asociados a un socio.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200, 400],
    queryParams: [],
    source: "src/app/api/evolucion_socio/[socio_id]/route.ts",
  },
  {
    path: "/api/evolucion_socio/admin/resumen",
    methods: ["GET"],
    tag: "Evolución física",
    summary: "Resumen administrativo de evolución física",
    description:
      "Devuelve una vista consolidada solo lectura de socios con cantidad de registros y última medición de evolución física para el gestor administrativo.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [200, 401, 403, 500],
    queryParams: [],
    source: "src/app/api/evolucion_socio/admin/resumen/route.ts",
  },
  {
    path: "/api/evolucion_socio/registro",
    methods: ["POST"],
    tag: "Evolución física",
    summary: "Crear registro de evolución física",
    description: "Crea un nuevo registro de evolución física para un socio.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [201],
    queryParams: [],
    source: "src/app/api/evolucion_socio/registro/route.ts",
  },
  {
    path: "/api/evolucion_socio/rag-assistant/analizar",
    methods: ["POST"],
    tag: "Evolución física",
    summary: "Analizar evolución física con RAG Coach",
    description:
      "Analiza registros reales de evolución física del socio, calcula tendencias y consulta el RAG interno para sugerencias prudentes de entrenamiento, dieta y hábitos. No guarda datos privados del socio como conocimiento global.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200, 400, 401, 403, 500],
    queryParams: [],
    source: "src/app/api/evolucion_socio/rag-assistant/analizar/route.ts",
  },
  {
    path: "/api/file-upload",
    methods: ["POST"],
    tag: "Archivos",
    summary: "Subida de archivo",
    description:
      "Sube imágenes de perfil desde archivo o captura de cámara móvil mediante Cloudinary y actualiza la foto del usuario/socio autenticado.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200, 400, 401, 500],
    queryParams: [],
    source: "src/app/api/file-upload/route.ts",
  },
  {
    path: "/api/image-proxy",
    methods: ["GET"],
    tag: "Archivos",
    summary: "Proxy de imágenes para PDF",
    description:
      "Descarga y devuelve imágenes remotas permitidas para usarlas en exportaciones PDF evitando problemas de CORS.",
    auth: false,
    admin: false,
    notImplemented: false,
    statuses: [200, 400, 415, 500],
    queryParams: ["url"],
    source: "src/app/api/image-proxy/route.ts",
  },
  {
    path: "/api/mantenimientos/{id}",
    methods: ["GET"],
    tag: "Mantenimiento",
    summary: "Operación sobre mantenimientos por identificador",
    description:
      "Consulta datos de mantenimientos. Si el endpoint usa parámetros dinámicos, el identificador forma parte de la URL. Implementación relacionada: getMantenimientoByIdEquipamiento.",
    auth: false,
    admin: false,
    notImplemented: false,
    statuses: [200, 400, 500],
    queryParams: [],
    source: "src/app/api/mantenimientos/[id]/route.ts",
  },
  {
    path: "/api/mantenimientos/completado/{id}",
    methods: ["PUT"],
    tag: "Mantenimiento",
    summary: "Operación sobre mantenimientos por identificador",
    description:
      "Actualiza datos de mantenimientos. Normalmente requiere un identificador y un objeto con los campos a modificar. Implementación relacionada: mantenimientoCompletado.",
    auth: false,
    admin: false,
    notImplemented: false,
    statuses: [200, 400, 500],
    queryParams: [],
    source: "src/app/api/mantenimientos/completado/[id]/route.ts",
  },
  {
    path: "/api/mantenimientos",
    methods: ["GET", "POST", "PUT"],
    tag: "Mantenimiento",
    summary: "Operaciones de mantenimientos",
    description:
      "Consulta datos de mantenimientos. Si el endpoint usa parámetros dinámicos, el identificador forma parte de la URL. Implementación relacionada: createMantenimiento, getAllMantenimientos, updateMantenimiento.",
    auth: false,
    admin: false,
    notImplemented: false,
    statuses: [200, 201, 400, 500],
    queryParams: [],
    source: "src/app/api/mantenimientos/route.ts",
  },
  {
    path: "/api/mi-cuenta/pagos",
    methods: ["GET"],
    tag: "Socios",
    summary: "Pagos de mi cuenta",
    description:
      "Devuelve el historial de pagos del socio autenticado. La respuesta incluye datos del socio, cuota, cobertura, medio de pago, estado y monto para que el socio pueda consultar sus pagos y descargar su recibo PDF verificable desde Mi cuenta.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200, 403, 500],
    queryParams: [],
    source: "src/app/api/mi-cuenta/pagos/route.ts",
  },
  {
    path: "/api/niveles",
    methods: ["GET"],
    tag: "Catálogos y operación",
    summary: "Operaciones de niveles",
    description:
      "Consulta datos de niveles. Si el endpoint usa parámetros dinámicos, el identificador forma parte de la URL. Requiere usuario autenticado cuando el middleware/servicio lo valide. Implementación relacionada: getAllNiveles.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200, 401, 500],
    queryParams: [],
    source: "src/app/api/niveles/route.ts",
  },
  {
    path: "/api/objetivos",
    methods: ["GET"],
    tag: "Catálogos y operación",
    summary: "Operaciones de objetivos",
    description:
      "Consulta datos de objetivos. Si el endpoint usa parámetros dinámicos, el identificador forma parte de la URL. Requiere usuario autenticado cuando el middleware/servicio lo valide. Implementación relacionada: getAllObjetivos.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200, 401, 500],
    queryParams: [],
    source: "src/app/api/objetivos/route.ts",
  },
  {
    path: "/api/otros_gastos",
    methods: ["GET", "POST", "PUT", "DELETE"],
    tag: "Gastos / egresos",
    summary: "Gastos / egresos con comprobantes",
    description:
      "Consulta, registra, actualiza y anula gastos operativos del gimnasio con clasificación por tipo de gasto, estado, medio de pago, vencimientos, período cubierto y comprobante PDF/imagen.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200, 201, 400, 401, 500],
    queryParams: ["estado", "id_tipo_gasto"],
    source: "src/app/api/otros_gastos/route.ts",
  },
  {
    path: "/api/otros_gastos/comprobante-upload",
    methods: ["POST"],
    tag: "Gastos / egresos",
    summary: "Carga de comprobante de gasto",
    description:
      "Sube un comprobante PDF o imagen a Cloudinary y devuelve URL, nombre original, MIME type y tamaño para asociarlo al gasto/egreso.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200, 400, 401, 500],
    queryParams: [],
    source: "src/app/api/otros_gastos/comprobante-upload/route.ts",
  },
  {
    path: "/api/pagar-cuota",
    methods: ["GET", "POST"],
    tag: "Cuotas y pagos",
    summary: "Vista previa y sesión de pago de cuota",
    description:
      "GET devuelve vista previa de pago con subtotal, descuento por pago adelantado y total solo si el gimnasio tiene Stripe activo. POST crea una sesión Stripe con la misma parametrización de descuento vigente y bloquea el checkout si los pagos online están deshabilitados.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200, 401, 403, 500],
    queryParams: ["meses_cubiertos"],
    source: "src/app/api/pagar-cuota/route.ts",
  },

  {
    path: "/api/pagar-cuota/confirmar",
    methods: ["POST"],
    tag: "Cuotas y pagos",
    summary: "Confirma y sincroniza un pago Stripe de cuota",
    description:
      "Recibe un session_id de Stripe Checkout, valida la sesión pagada y registra el pago en Gym Master si el webhook todavía no lo había registrado. Funciona como respaldo seguro post-checkout y evita duplicados por session/payment intent.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200, 400, 401, 403, 500],
    queryParams: [],
    source: "src/app/api/pagar-cuota/confirmar/route.ts",
  },
  {
    path: "/api/pagos/{id}",
    methods: ["GET"],
    tag: "Cuotas y pagos",
    summary: "Operación sobre pagos por identificador",
    description:
      "Consulta datos de pagos. Si el endpoint usa parámetros dinámicos, el identificador forma parte de la URL. Implementación relacionada: getPagoById.",
    auth: false,
    admin: false,
    notImplemented: false,
    statuses: [200],
    queryParams: [],
    source: "src/app/api/pagos/[id]/route.ts",
  },
  {
    path: "/api/pagos",
    methods: ["GET", "POST", "PUT", "DELETE"],
    tag: "Cuotas y pagos",
    summary: "Operaciones de pagos",
    description:
      "Consulta y administra pagos manuales. El alta/actualización de pagos pagados puede reactivar automáticamente socios regularizados; la baja lógica/cancelación sincroniza morosidad y registra auditoría. El formulario de opciones incluye configuración de descuento por pago adelantado para calcular subtotal, descuento y total final. Implementación relacionada: createPagoManualServer, deactivatePagoServer, fetchPagoFormOptionsServer, fetchPagosServer, updatePagoServer.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200, 201, 400],
    queryParams: ["options"],
    source: "src/app/api/pagos/route.ts",
  },
  {
    path: "/api/parametrizacion/cuotas-descuento",
    methods: ["GET", "PATCH"],
    tag: "Parametrización",
    summary: "Descuento por pago adelantado de cuotas",
    description:
      "Consulta y actualiza la configuración administrativa del descuento por pago adelantado: activo, cuotas mínimas, porcentaje y descripción. Impacta en pagos manuales, Stripe, recibos e historial.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [200, 400, 403, 500],
    queryParams: [],
    source: "src/app/api/parametrizacion/cuotas-descuento/route.ts",
  },
  {
    path: "/api/parametrizacion/catalogos",
    methods: ["GET", "POST", "PATCH"],
    tag: "Parametrización",
    summary: "Catálogos parametrizables",
    description:
      "Consulta, crea y actualiza registros de catálogos parametrizables. GET lista tipos de empleado, medios de pago, gastos, ingresos, categorías de producto, tipos/ubicaciones de equipamiento, ubicaciones globales del gimnasio y tipos de mantenimiento. POST crea nuevos registros con código, nombre, descripción, orden y campos específicos. PATCH edita, activa o desactiva registros sin hard delete.",
    auth: false,
    admin: false,
    notImplemented: false,
    statuses: [200, 201, 400, 409, 500],
    queryParams: [],
    source: "src/app/api/parametrizacion/catalogos/route.ts",
  },
  {
    path: "/api/productos/{id}",
    methods: ["GET"],
    tag: "Comercial",
    summary: "Operación sobre productos por identificador",
    description:
      "Consulta datos de productos. Si el endpoint usa parámetros dinámicos, el identificador forma parte de la URL. Implementación relacionada: getProductoById.",
    auth: false,
    admin: false,
    notImplemented: false,
    statuses: [200],
    queryParams: [],
    source: "src/app/api/productos/[id]/route.ts",
  },

  {
    path: "/api/productos/historial-precios-costos",
    methods: ["GET"],
    tag: "Comercial / Kiosco",
    summary: "Historial de precios y costos de producto",
    description:
      "Devuelve el historial auditable de cambios de precio de venta y costo de compra de un producto. Requiere query param producto_id.",
    auth: false,
    admin: true,
    notImplemented: false,
    statuses: [200, 400, 500],
    queryParams: ["producto_id"],
    source: "src/app/api/productos/historial-precios-costos/route.ts",
  },
  {
    path: "/api/productos/stock-movimientos",
    methods: ["GET", "POST"],
    tag: "Comercial / Kiosco",
    summary: "Movimientos manuales y operativos de stock",
    description:
      "Lista y registra movimientos de stock de productos: ajustes manuales, recuento físico, devoluciones vendibles, mermas y reposiciones. Usa producto_stock_movimiento para trazabilidad y actualiza el stock del producto.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [200, 201, 400, 401, 404, 500],
    queryParams: ["producto_id", "limit"],
    source: "src/app/api/productos/stock-movimientos/route.ts",
  },

  {
    path: "/api/comercial/kiosco-pos",
    methods: ["GET", "POST"],
    tag: "Comercial / POS",
    summary: "POS/Kiosco venta rápida",
    description:
      "Devuelve productos, ubicaciones, stock por ubicación y ventas recientes para POS/Kiosco. También registra ventas rápidas, crea cabecera/detalle, descuenta stock desde la ubicación seleccionada, actualiza producto.stock, registra stock ledger y deja ticket imprimible.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [200, 201, 400, 401, 500],
    queryParams: [],
    source: "src/app/api/comercial/kiosco-pos/route.ts",
  },



  {
    path: "/api/comercial/mobile-scanner",
    methods: ["GET", "POST"],
    tag: "Comercial / POS",
    summary: "Scanner móvil para POS/Kiosco",
    description:
      "Crea/cierra sesiones temporales de scanner móvil y consulta eventos pendientes para conectar celular y PC sin hardware lector dedicado.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [200, 201, 400, 401, 500],
    queryParams: ["session_id"],
    source: "src/app/api/comercial/mobile-scanner/route.ts",
  },
  {
    path: "/api/comercial/mobile-scanner/public/{token}",
    methods: ["GET", "POST"],
    tag: "Comercial / POS",
    summary: "Endpoint público por token para scanner móvil",
    description:
      "Permite que el celular conectado por QR consulte la sesión y envíe códigos QR/barra al POS. El token temporal controla la sesión.",
    auth: false,
    admin: false,
    notImplemented: false,
    statuses: [200, 201, 400, 404, 500],
    queryParams: [],
    source: "src/app/api/comercial/mobile-scanner/public/[token]/route.ts",
  },

  {
    path: "/api/comercial/servicios-promociones",
    methods: ["GET", "POST"],
    tag: "Comercial / Servicios",
    summary: "Servicios, packs, promociones y cupones",
    description:
      "Devuelve dashboard comercial de productos, servicios, packs, promociones, cupones, canales de venta y grupos de cliente. Permite crear packs comerciales, promociones y cupones.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [200, 201, 400, 401, 500],
    queryParams: [],
    source: "src/app/api/comercial/servicios-promociones/route.ts",
  },
  {
    path: "/api/comercial/compras-reposicion",
    methods: ["GET", "POST"],
    tag: "Comercial / Compras",
    summary: "Compras, proveedores y reposición",
    description:
      "Devuelve dashboard de proveedores por producto, reposición sugerida, órdenes de compra y permite asociar producto-proveedor, crear órdenes y recibir mercadería integrada al Stock Ledger.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [200, 201, 400, 401, 500],
    queryParams: [],
    source: "src/app/api/comercial/compras-reposicion/route.ts",
  },
  {
    path: "/api/comercial/caja",
    methods: ["GET", "POST"],
    tag: "Comercial / Caja",
    summary: "Caja comercial y cashup",
    description:
      "Gestiona apertura de caja, movimientos manuales de ingreso/retiro, ventas asociadas al turno, cierre con monto contado, diferencia y datos para reporte X/Z.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [200, 201, 400, 401, 500],
    queryParams: [],
    source: "src/app/api/comercial/caja/route.ts",
  },
  {
    path: "/api/comercial/stock-ledger",
    methods: ["GET", "POST"],
    tag: "Comercial / Stock",
    summary: "Stock ledger comercial por ubicaciones",
    description:
      "Devuelve dashboard de stock por ubicación, movimientos auditables, ubicaciones activas y permite registrar compras, ajustes, transferencias, mermas, vencimientos, conteos físicos y uso interno. Actualiza el stock total del producto para mantener compatibilidad con ventas y reportes existentes.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [200, 201, 400, 401, 500],
    queryParams: [],
    source: "src/app/api/comercial/stock-ledger/route.ts",
  },
  {
    path: "/api/productos",
    methods: ["GET", "POST", "PUT", "DELETE"],
    tag: "Comercial",
    summary: "Operaciones de productos",
    description:
      "Gestiona productos del kiosco/comercial, incluyendo costo, stock mínimo e historial de precio/costo cuando se modifica el valor comercial. Implementación relacionada: createProducto, deleteProducto, getAllProductos, updateProducto.",
    auth: false,
    admin: false,
    notImplemented: false,
    statuses: [200, 201, 400, 500],
    queryParams: [],
    source: "src/app/api/productos/route.ts",
  },
  {
    path: "/api/proveedores/{id}",
    methods: ["GET"],
    tag: "Comercial",
    summary: "Operación sobre proveedores por identificador",
    description:
      "Consulta el perfil comercial ampliado de un proveedor por identificador, incluyendo datos fiscales, contacto, ubicación, estado y datos bancarios opcionales. Implementación relacionada: getProveedorById.",
    auth: false,
    admin: false,
    notImplemented: false,
    statuses: [200],
    queryParams: [],
    source: "src/app/api/proveedores/[id]/route.ts",
  },
  {
    path: "/api/proveedores",
    methods: ["GET", "POST", "PUT", "DELETE"],
    tag: "Comercial",
    summary: "Operaciones de proveedores comerciales",
    description:
      "Gestiona proveedores con perfil comercial ampliado: nombre comercial, razón social, identificación fiscal, condición fiscal, contacto, teléfono, WhatsApp, email, ubicación, rubro, estado, observaciones y datos bancarios opcionales. DELETE realiza desactivación lógica para preservar histórico comercial. Implementación relacionada: getAllProveedores, createProveedor, updateProveedor, deleteProveedor.",
    auth: false,
    admin: false,
    notImplemented: false,
    statuses: [200, 201, 400, 500],
    queryParams: [],
    source: "src/app/api/proveedores/route.ts",
  },
  {
    path: "/api/rutina/{idSocio}",
    methods: ["GET", "DELETE"],
    tag: "Rutinas",
    summary: "Operación sobre rutina por identificador",
    description:
      "Consulta datos de rutina. Si el endpoint usa parámetros dinámicos, el identificador forma parte de la URL. Requiere usuario autenticado cuando el middleware/servicio lo valide. Implementación relacionada: historialRutinaSocio, deleteRutinaById.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200, 400, 401, 403, 404, 500],
    queryParams: [],
    source: "src/app/api/rutina/[idSocio]/route.ts",
  },
  {
    path: "/api/rutina/delete/{id}",
    methods: ["GET", "DELETE"],
    tag: "Rutinas",
    summary: "Eliminar rutina por ID",
    description:
      "Endpoint de eliminación/historial de rutina por ID. Mantener compatibilidad mientras se estabiliza el flujo de borrado.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200, 401, 500],
    queryParams: [],
    source: "src/app/api/rutina/delete/[id]/route.ts",
  },
  {
    path: "/api/rutina/generar",
    methods: ["POST"],
    tag: "Rutinas",
    summary: "Generar rutina",
    description:
      "Genera una rutina para un socio según objetivo, nivel, frecuencia u otros criterios.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200, 401, 404, 500],
    queryParams: [],
    source: "src/app/api/rutina/generar/route.ts",
  },
  {
    path: "/api/rutina/historial/{id_socio}",
    methods: ["GET"],
    tag: "Rutinas",
    summary: "Historial de rutina por socio",
    description: "Devuelve historial de rutinas de un socio específico.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200, 401],
    queryParams: [],
    source: "src/app/api/rutina/historial/[id_socio]/route.ts",
  },
  {
    path: "/api/rutina/historial",
    methods: ["GET"],
    tag: "Rutinas",
    summary: "Historial de rutina del socio autenticado",
    description: "Devuelve el historial de rutinas del socio autenticado.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200, 401],
    queryParams: [],
    source: "src/app/api/rutina/historial/route.ts",
  },
  {
    path: "/api/servicios/{id}",
    methods: ["GET"],
    tag: "Comercial",
    summary: "Operación sobre servicios por identificador",
    description:
      "Consulta el detalle de un servicio adicional por identificador, incluyendo categoría, modalidad, duración, reserva, cupo, disponibilidad online y estado. Implementación relacionada: getServicioById.",
    auth: false,
    admin: false,
    notImplemented: false,
    statuses: [200],
    queryParams: [],
    source: "src/app/api/servicios/[id]/route.ts",
  },
  {
    path: "/api/servicios",
    methods: ["GET", "POST", "PUT", "DELETE"],
    tag: "Comercial",
    summary: "Operaciones de servicios",
    description:
      "Gestiona servicios adicionales del gimnasio: personal trainer, evaluaciones, nutrición, clases especiales, pases, alquileres y servicios premium. Incluye categoría, modalidad, duración, reserva, cupo, disponibilidad online y observaciones. Implementación relacionada: createServicio, deleteServicio, getAllServicios, updateServicio.",
    auth: false,
    admin: false,
    notImplemented: false,
    statuses: [200, 201, 400, 500],
    queryParams: [],
    source: "src/app/api/servicios/route.ts",
  },
  {
    path: "/api/socios/{id}/ficha-medica/{id_ficha}",
    methods: ["GET"],
    tag: "Ficha médica",
    summary: "Operación sobre socios por identificador",
    description:
      "Consulta datos de socios. Si el endpoint usa parámetros dinámicos, el identificador forma parte de la URL. Requiere usuario autenticado cuando el middleware/servicio lo valide. Implementación relacionada: FindOneFichaMedicaSocio.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200, 400, 401, 500],
    queryParams: [],
    source: "src/app/api/socios/[id]/ficha-medica/[id_ficha]/route.ts",
  },
  {
    path: "/api/socios/{id}/ficha-medica/actual",
    methods: ["GET"],
    tag: "Ficha médica",
    summary: "Ficha médica de socio",
    description:
      "Consulta datos de socios. Si el endpoint usa parámetros dinámicos, el identificador forma parte de la URL. Requiere usuario autenticado cuando el middleware/servicio lo valide. Implementación relacionada: FindFichaMedicaSocio.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200, 400, 401, 500],
    queryParams: [],
    source: "src/app/api/socios/[id]/ficha-medica/actual/route.ts",
  },
  {
    path: "/api/socios/{id}/ficha-medica/historial",
    methods: ["GET"],
    tag: "Ficha médica",
    summary: "Ficha médica de socio",
    description:
      "Consulta datos de socios. Si el endpoint usa parámetros dinámicos, el identificador forma parte de la URL. Requiere usuario autenticado cuando el middleware/servicio lo valide. Implementación relacionada: FindAllFichaMedicaSocio.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200, 400, 401, 500],
    queryParams: ["page"],
    source: "src/app/api/socios/[id]/ficha-medica/historial/route.ts",
  },
  {
    path: "/api/socios/{id}/ficha-medica",
    methods: ["POST"],
    tag: "Ficha médica",
    summary: "Ficha médica de socio",
    description:
      "Crea ficha médica del socio mediante multipart/form-data. El campo ficha contiene el JSON de datos médicos y se aceptan archivos archivo_aprobacion y archivos_adjuntos en PDF, JPG o PNG para subirlos a Cloudinary. Requiere usuario autenticado. Implementación relacionada: createFichaMedicaSocio.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [201, 400, 401, 500],
    queryParams: [],
    source: "src/app/api/socios/[id]/ficha-medica/route.ts",
  },
  {
    path: "/api/socios/{id}",
    methods: ["GET"],
    tag: "Socios",
    summary: "Operación sobre socios por identificador",
    description:
      "Consulta datos de socios. Si el endpoint usa parámetros dinámicos, el identificador forma parte de la URL. Requiere usuario autenticado cuando el middleware/servicio lo valide. Implementación relacionada: getSocioById.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200],
    queryParams: [],
    source: "src/app/api/socios/[id]/route.ts",
  },
  {
    path: "/api/socios",
    methods: ["GET", "POST", "PUT", "DELETE"],
    tag: "Socios",
    summary: "Operaciones de socios",
    description:
      "Consulta y administra socios. El payload de alta/edición admite datos personales y operativos: sexo, fecha de nacimiento, ciudad, provincia, país y contacto de emergencia, además de datos básicos. Requiere usuario autenticado cuando el middleware/servicio lo valide. Implementación relacionada: createSocioServer, deactivateSocioServer, fetchSociosServer, updateSocioServer.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200, 201, 400],
    queryParams: [],
    source: "src/app/api/socios/route.ts",
  },
  {
    path: "/api/stripe-webhook",
    methods: ["POST"],
    tag: "Cuotas y pagos",
    summary: "Webhook de Stripe",
    description:
      "Recibe eventos de Stripe para registrar pagos online. Al registrar un pago pagado, sincroniza la reactivación del socio si regularizó su cuota. Debe usarse con firma/validación de Stripe en ambientes productivos.",
    auth: false,
    admin: false,
    notImplemented: false,
    statuses: [200, 400, 500],
    queryParams: [],
    source: "src/app/api/stripe-webhook/route.ts",
  },
  {
    path: "/api/test-alertas",
    methods: ["POST"],
    tag: "Alertas",
    summary: "Validacion interna de alertas de deuda",
    description:
      "Endpoint interno para validar alertas o desactivacion de socios con deuda en ambientes controlados.",
    auth: false,
    admin: false,
    notImplemented: false,
    statuses: [200, 500],
    queryParams: [],
    source: "src/app/api/test-alertas/route.ts",
    internal: true,
  },
  {
    path: "/api/usuarios/{id}/perfil",
    methods: ["GET"],
    tag: "Usuarios",
    summary: "Operaciones de usuarios",
    description:
      "Consulta datos de usuarios. Si el endpoint usa parámetros dinámicos, el identificador forma parte de la URL. Requiere usuario autenticado cuando el middleware/servicio lo valide. Implementación relacionada: getUsuarioById.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200, 401],
    queryParams: [],
    source: "src/app/api/usuarios/[id]/perfil/route.ts",
  },
  {
    path: "/api/usuarios/{id}",
    methods: ["GET"],
    tag: "Usuarios",
    summary: "Operación sobre usuarios por identificador",
    description:
      "Consulta datos de usuarios. Si el endpoint usa parámetros dinámicos, el identificador forma parte de la URL. Requiere usuario autenticado cuando el middleware/servicio lo valide. Implementación relacionada: getUsuarioById.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200, 401],
    queryParams: [],
    source: "src/app/api/usuarios/[id]/route.ts",
  },
  {
    path: "/api/usuarios",
    methods: ["GET", "POST", "PUT", "DELETE"],
    tag: "Usuarios",
    summary: "Operaciones de usuarios",
    description:
      "Consulta y administra usuarios como identidades de acceso. En altas con rol socio crea o vincula el perfil operativo en public.socio; en altas con rol usuario crea o vincula el perfil laboral en public.empleados. Mantiene contraseña inicial GymMaster + DNI, must_change_password y sincronización de activación/desactivación con perfiles asociados. Requiere usuario autenticado con permisos de administración. Implementación relacionada: createUsuarioServer, deactivateUsuarioServer, fetchUsuariosServer, updateUsuarioServer.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200, 201, 400],
    queryParams: [],
    source: "src/app/api/usuarios/route.ts",
  },
  {
    path: "/api/ventas/{id}",
    methods: ["GET"],
    tag: "Comercial",
    summary: "Detalle de venta por identificador",
    description:
      "Devuelve la cabecera de una venta y su detalle real de productos/servicios, incluyendo cliente, método de pago, estado, total y código de comprobante. Requiere usuario autenticado.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200, 401],
    queryParams: [],
    source: "src/app/api/ventas/[id]/route.ts",
  },
  {
    path: "/api/ventas",
    methods: ["GET", "POST", "PUT", "DELETE"],
    tag: "Comercial",
    summary: "Operaciones de ventas de kiosco",
    description:
      "Gestiona ventas comerciales con cabecera, consumidor final/visitante/socio, método de pago, múltiples ítems de producto o servicio, descuento de stock y anulación lógica. Requiere usuario autenticado.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200, 201, 400, 401, 500],
    queryParams: [],
    source: "src/app/api/ventas/route.ts",
  },
  {
    path: "/api/ventas_detalles",
    methods: ["GET", "POST", "PUT", "DELETE"],
    tag: "Comercial",
    summary: "Operaciones de detalles de venta",
    description:
      "Gestiona detalles de venta para productos o servicios, con cantidad, precio unitario, descuento, subtotal y total de línea. Los productos descuentan stock al registrarse. Requiere usuario autenticado.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200, 201, 400, 401, 500],
    queryParams: [],
    source: "src/app/api/ventas_detalles/route.ts",
  },
  {
    path: "/api/swagger-json",
    methods: ["GET"],
    tag: "General",
    summary: "Especificación OpenAPI de Gym Master",
    description:
      "Devuelve la especificación OpenAPI usada por la pantalla /swagger. Permite auditar la documentación de endpoints desde Swagger UI o herramientas externas.",
    auth: false,
    admin: false,
    notImplemented: false,
    statuses: [200],
    queryParams: [],
    source: "src/app/api/swagger-json/route.ts",
  },
  {
    path: "/api/rag/coach/corpus/status",
    methods: ["GET"],
    tag: "RAG Coach",
    summary: "Estado detallado del corpus RAG",
    description:
      "Devuelve contadores detallados del corpus RAG por dominio, chunks pendientes, cobertura de ejercicios y reglas nutricionales.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [200, 401, 403, 500],
    queryParams: [],
    source: "src/app/api/rag/coach/corpus/status/route.ts",
  },
  {
    path: "/api/rag/coach/corpus/run",
    methods: ["POST"],
    tag: "RAG Coach",
    summary: "Ejecutar tanda controlada del corpus RAG",
    description:
      "Ejecuta una tanda de ingesta o vectorización del corpus RAG con límite y delay configurables para tolerar rate limits 429.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [200, 207, 400, 401, 403, 500],
    queryParams: [],
    source: "src/app/api/rag/coach/corpus/run/route.ts",
  },
  {
    path: "/api/rag/coach/status",
    methods: ["GET"],
    tag: "RAG Coach",
    summary: "Estado técnico del RAG Coach",
    description:
      "Devuelve configuración no sensible, advertencias operativas y conteos de documentos/chunks para validar la base RAG desde Swagger o herramientas administrativas.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [200, 401, 403, 500],
    queryParams: [],
    source: "src/app/api/rag/coach/status/route.ts",
  },
  {
    path: "/api/rag/coach/chat",
    methods: ["POST"],
    tag: "RAG Coach",
    summary: "Chat unificado del Coach IA",
    description:
      "Recibe un mensaje conversacional del socio, construye contexto real runtime con rutinas, dietas, evolución física, asistencia y ficha médica básica permitida; detecta intención y puede generar rutina, dieta o analizar evolución física. Devuelve una respuesta de coach y siempre indica dónde ver los resultados generados.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200, 400, 401, 403, 500],
    queryParams: [],
    source: "src/app/api/rag/coach/chat/route.ts",
  },
  {
    path: "/api/rag/coach/ingest/ejercicios",
    methods: ["POST"],
    tag: "RAG Coach",
    summary: "Ingestar ejercicios reales al RAG",
    description:
      "Indexa ejercicios activos de Gym Master como documentos/chunks RAG usando datos reales del catálogo. Requiere rol administrador y proveedor de embeddings configurado cuando genera vectores.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [200, 207, 400, 401, 403, 500],
    queryParams: [],
    source: "src/app/api/rag/coach/ingest/ejercicios/route.ts",
  },
  {
    path: "/api/rag/coach/ingest/dietas",
    methods: ["POST"],
    tag: "RAG Coach",
    summary: "Ingestar reglas nutricionales al RAG",
    description:
      "Indexa reglas nutricionales reales desde comida_base como documentos/chunks RAG del dominio diet_rule. Requiere rol administrador y proveedor de embeddings configurado.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [200, 207, 400, 401, 403, 500],
    queryParams: [],
    source: "src/app/api/rag/coach/ingest/dietas/route.ts",
  },
  {
    path: "/api/rag/coach/vectorize/pending",
    methods: ["POST"],
    tag: "RAG Coach",
    summary: "Vectorizar chunks RAG pendientes",
    description:
      "Genera embeddings para chunks RAG activos que todavía no tienen vector, usando el provider configurado en backend. Permite validar la vectorización sin exponer tokens en SQL Studio ni frontend.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [200, 207, 400, 401, 403, 500],
    queryParams: [],
    source: "src/app/api/rag/coach/vectorize/pending/route.ts",
  },
  {
    path: "/api/rag/coach/search",
    methods: ["POST"],
    tag: "RAG Coach",
    summary: "Buscar conocimiento RAG",
    description:
      "Ejecuta una búsqueda semántica contra rag_document_chunk mediante match_rag_chunks. Sirve para validar recuperación RAG desde Swagger antes de conectar el chat final de rutinas/dietas.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [200, 400, 401, 403, 500],
    queryParams: [],
    source: "src/app/api/rag/coach/search/route.ts",
  },
  {
    path: "/api/rutinas/rag-assistant/generar",
    methods: ["POST"],
    tag: "Rutinas",
    summary: "Generar rutina desde asistente RAG",
    description:
      "Genera una rutina desde el asistente conversacional. Primero consulta el RAG interno de Gym Master para recuperar ejercicios reales indexados; si existe microservicio externo configurado, lo usa como puente; si no hay resultados RAG, mantiene fallback seguro con el generador formal. No expone claves en frontend.",
    auth: true,
    admin: false,
    notImplemented: false,
    statuses: [200, 401, 500],
    queryParams: [],
    source: "src/app/api/rutinas/rag-assistant/generar/route.ts",
  },
  {
    path: "/api/rutinas/ejercicios-media",
    methods: ["GET", "PATCH"],
    tag: "Rutinas",
    summary: "Catálogo administrativo de media de ejercicios",
    description:
      "Permite listar ejercicios con su media asociada, filtrar por objetivo/nivel/estado y actualizar imagen principal o video de YouTube del ejercicio. Requiere rol administrador.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [200, 400, 401, 403, 500],
    queryParams: ["q", "objetivo", "nivel", "mediaStatus", "page", "pageSize"],
    source: "src/app/api/rutinas/ejercicios-media/route.ts",
  },

  {
    path: "/api/rutinas/ejercicios-media/equivalence-sync",
    methods: ["POST"],
    tag: "Rutinas",
    summary: "Sincronización de media entre ejercicios equivalentes",
    description:
      "Detecta ejercicios equivalentes por nombre canónico y grupo muscular, usando Volumen Avanzado como fuente prioritaria, para copiar imagen/GIF y video hacia ejercicios con fallback o imagen vacía. Soporta modo previsualización y aplicación. Requiere rol administrador.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [200, 401, 403, 500],
    queryParams: [],
    source: "src/app/api/rutinas/ejercicios-media/equivalence-sync/route.ts",
  },

  {
    path: "/api/rutinas/ejercicios-media/youtube-auto-discovery",
    methods: ["POST"],
    tag: "Rutinas",
    summary: "Descubrimiento automático de videos YouTube por ejercicio",
    description:
      "Busca candidatos en YouTube Data API por nombre de ejercicio ES/EN, ordenando por vistas y sin pisar URLs existentes. Soporta preview y apply por corridas. Guarda candidatos como sugeridos para revisión administrativa.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [200, 400, 401, 403, 500],
    queryParams: [],
    source:
      "src/app/api/rutinas/ejercicios-media/youtube-auto-discovery/route.ts",
  },
  {
    path: "/api/rutinas/ejercicios-media/youtube-import",
    methods: ["POST"],
    tag: "Rutinas",
    summary: "Importación masiva de videos YouTube por ejercicio",
    description:
      "Previsualiza o aplica una importación masiva revisable de URLs YouTube ES/EN para ejercicios del catálogo, con estado de revisión y fuente de curación.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [200, 400, 401, 403, 500],
    queryParams: [],
    source: "src/app/api/rutinas/ejercicios-media/youtube-import/route.ts",
  },

  {
    path: "/api/rutinas/ejercicios-media/import",
    methods: ["POST"],
    tag: "Rutinas",
    summary: "Importación de imagen/GIF remoto a Cloudinary",
    description:
      "Importa una imagen o GIF desde una URL pública externa hacia Cloudinary y la asocia como media principal de un ejercicio. Requiere rol administrador.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [200, 400, 401, 403, 500],
    queryParams: [],
    source: "src/app/api/rutinas/ejercicios-media/import/route.ts",
  },
  {
    path: "/api/rutinas/ejercicios-media/upload",
    methods: ["POST"],
    tag: "Rutinas",
    summary: "Subida de imagen/GIF de ejercicio a Cloudinary",
    description:
      "Sube una imagen o GIF de ejercicio a Cloudinary para luego asociarla como media principal del ejercicio desde el catálogo administrativo.",
    auth: true,
    admin: true,
    notImplemented: false,
    statuses: [200, 400, 401, 403, 500],
    queryParams: [],
    source: "src/app/api/rutinas/ejercicios-media/upload/route.ts",
  },
];

const tags = [
  {
    name: "Notificaciones",
    description:
      "Notificaciones, plantillas, email, avisos programados y futuras salidas en Terminal.",
  },
  {
    name: "Administración y BI",
    description: "Dashboards, reportes y métricas administrativas.",
  },
  {
    name: "Autenticación",
    description: "Inicio de sesión, NextAuth y control de sesión.",
  },
  {
    name: "Usuarios",
    description: "Gestión de usuarios internos del sistema.",
  },
  {
    name: "Socios",
    description: "Gestión y autoservicio de socios.",
  },
  {
    name: "Ficha médica",
    description:
      "Ficha médica, historial y registros clínicos asociados al socio.",
  },
  {
    name: "Asistencias",
    description: "Registro, consulta, ranking y QR de asistencia.",
  },
  {
    name: "Rutinas",
    description: "Generación, historial y eliminación de rutinas.",
  },
  {
    name: "RAG Coach",
    description:
      "Herramientas administrativas para validar ingesta, vectorización y búsqueda semántica del Gym Master RAG Coach.",
  },

  {
    name: "Dietas",
    description: "Generación y consulta de dietas.",
  },
  {
    name: "Cuotas y pagos",
    description:
      "Cuotas, pagos manuales, Stripe, estado de cuota y recibos futuros.",
  },
  {
    name: "Equipamiento",
    description: "Gestión de máquinas y equipamiento.",
  },
  {
    name: "Mantenimiento",
    description: "Gestión de mantenimientos y tareas completadas.",
  },
  {
    name: "Comercial",
    description:
      "Productos, proveedores, servicios, ventas y detalles de venta.",
  },
  {
    name: "Empleados",
    description:
      "Gestión formal de empleados, responsabilidades, base para sueldos, usuarios internos y RBAC.",
  },
  {
    name: "Evolución física",
    description:
      "Registros de evolución física y métricas corporales del socio.",
  },
  {
    name: "Parametrización",
    description: "Catálogos parametrizables del sistema.",
  },
  {
    name: "Catálogos y operación",
    description: "Catálogos operativos y módulos complementarios.",
  },
  {
    name: "Archivos",
    description: "Subida y proxy de archivos/imágenes.",
  },
  {
    name: "Alertas",
    description: "Endpoints técnicos de alertas o mantenimiento operativo.",
  },
  {
    name: "General",
    description: "Endpoints generales no clasificados.",
  },
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
        : part.charAt(0).toUpperCase() + part.slice(1),
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
      schema:
        name === "tipo"
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
      tokenAsistencia: "Token del QR diario usado para registrar asistencia.",
      socio_id:
        "ID del socio a consultar. Si se omite, el endpoint resuelve según el rol del usuario autenticado.",
      url: "URL absoluta de la imagen remota que será descargada por el proxy.",
      umbralDias:
        "Cantidad de días de anticipación para considerar una revisión como próxima. Valor por defecto: 5. Rango sugerido: 0 a 90.",
      options:
        "Cuando vale true, devuelve opciones de formulario en lugar del listado principal.",
      page: "Página de resultados para listados paginados.",
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

  if (
    endpoint.path === "/api/auth/{nextauth}" ||
    endpoint.path === "/api/custom-login"
  ) {
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
                rol: "admin",
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

  if (
    endpoint.path === "/api/asistencias/registro-qr" &&
    lowerMethod === "post"
  ) {
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

  if (endpoint.path === "/api/rag/coach/corpus/run") {
    return {
      required: true,
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/RagCorpusBatchRequest" },
          examples: {
            vectorizar: {
              summary: "Vectorizar pendientes",
              value: { action: "vectorize_pending", limit: 10, delayMs: 1000, force: false },
            },
            completa: {
              summary: "Tanda completa chica",
              value: { action: "all", limit: 10, delayMs: 1000, force: false, onlyMissing: true },
            },
          },
        },
      },
    };
  }

  if (endpoint.path === "/api/rag/coach/chat") {
    return {
      required: true,
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/RagCoachChatRequest" },
          examples: {
            rutina: {
              summary: "Pedir rutina conversacional",
              value: {
                message: "Quiero una rutina para ganar masa muscular 3 días por semana y cuidar la rodilla.",
                socio_id: "me",
              },
            },
            dieta: {
              summary: "Pedir dieta conversacional",
              value: {
                message: "Quiero una dieta para bajar grasa sin perder músculo.",
                socio_id: "me",
              },
            },
            evolucion: {
              summary: "Analizar evolución física",
              value: {
                message: "Estoy estancado, analizá mi evolución física y decime qué ajustar.",
                socio_id: "me",
              },
            },
          },
        },
      },
    };
  }

  if (endpoint.path === "/api/evolucion_socio/rag-assistant/analizar") {
    return {
      required: false,
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/RagEvolucionFisicaAssistantRequest" },
          examples: {
            socioAutenticado: {
              summary: "Analizar evolución del socio autenticado",
              value: {
                socio_id: "me",
                idioma: "es",
                objetivo: "Bajar grasa sin perder masa muscular",
                mensajeSocio: "Quiero saber si voy bien y qué debería ajustar esta semana.",
                restricciones: "Cuidar rodilla derecha, evitar impacto alto.",
              },
            },
            adminSocio: {
              summary: "Admin analiza un socio específico",
              value: {
                socio_id: "2d2a45df-0fd5-4f4e-9c01-5de07dca1111",
                idioma: "es",
                objetivo: "Recomposición corporal",
                mensajeSocio: "Analizar tendencia de peso, cintura y masa muscular.",
                restricciones: "Sin datos clínicos informados.",
              },
            },
          },
        },
      },
    };
  }

  if (endpoint.path === "/api/rag/coach/ingest/ejercicios") {
    return {
      required: false,
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/RagIngestExercisesRequest" },
          examples: {
            previewLimitado: {
              summary: "Ingesta limitada de ejercicios",
              value: { limit: 10, force: false, onlyMissing: true, delayMs: 750 },
            },
            reindexar: {
              summary: "Reindexar ejercicios aunque ya existan",
              value: { limit: 25, force: true, delayMs: 1000 },
            },
          },
        },
      },
    };
  }

  if (endpoint.path === "/api/rag/coach/ingest/dietas") {
    return {
      required: false,
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/RagIngestDietRulesRequest" },
          examples: {
            reglasNutricionales: {
              summary: "Ingesta limitada de reglas de comida_base",
              value: { limit: 10, force: false, onlyMissing: true, delayMs: 750 },
            },
            reindexarReglas: {
              summary: "Reindexar reglas nutricionales aunque ya existan",
              value: { limit: 25, force: true, delayMs: 1000 },
            },
          },
        },
      },
    };
  }

  if (endpoint.path === "/api/rag/coach/vectorize/pending") {
    return {
      required: false,
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/RagVectorizePendingRequest" },
          examples: {
            pendientes: {
              summary: "Vectorizar chunks pendientes",
              value: { limit: 25, force: false, delayMs: 750 },
            },
            revectorizar: {
              summary: "Forzar vectorización de chunks activos",
              value: { limit: 10, force: true, delayMs: 1000 },
            },
          },
        },
      },
    };
  }

  if (endpoint.path === "/api/rag/coach/search") {
    return {
      required: true,
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/RagSearchRequest" },
          examples: {
            piernasPrincipiante: {
              summary: "Buscar ejercicios para piernas principiante",
              value: {
                query: "rutina de piernas para socio principiante",
                domains: ["exercise"],
                sourceTables: ["ejercicio"],
                matchCount: 8,
                matchThreshold: 0.72,
              },
            },
          },
        },
      },
    };
  }

  if (endpoint.path === "/api/rutinas/rag-assistant/generar") {
    return {
      required: true,
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/RagRutinasAssistantRequest" },
          examples: {
            socioRutina: {
              summary: "Generar rutina con RAG interno",
              value: {
                objetivo: 1,
                nivel: 1,
                dias: 3,
                idioma: "es",
                mensajeSocio: "Quiero ganar masa muscular, entrenar 3 días por semana y priorizar piernas. Soy principiante.",
                restricciones: "Cuidar rodilla derecha, evitar impacto alto.",
              },
            },
            adminConSocio: {
              summary: "Prueba técnica admin indicando socio",
              value: {
                objetivo: 1,
                nivel: 1,
                dias: 3,
                idioma: "es",
                mensajeSocio: "Rutina de fuerza inicial de 3 días con ejercicios seguros.",
                restricciones: "Sin saltos ni impacto alto.",
                id_socio: "2d2a45df-0fd5-4f4e-9c01-5de07dca1111",
              },
            },
          },
        },
      },
    };
  }

  if (endpoint.path === "/api/dieta/rag-assistant/generar") {
    return {
      required: true,
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/RagDietasAssistantRequest" },
          examples: {
            dietaRag: {
              summary: "Generar dieta con RAG interno",
              value: {
                socio_id: "2d2a45df-0fd5-4f4e-9c01-5de07dca1111",
                objetivo: 1,
                fecha_inicio: "2026-06-15",
                fecha_fin: "2026-07-15",
                idioma: "es",
                mensajeSocio: "Quiero bajar grasa sin perder músculo y necesito comidas simples.",
                restricciones: "Evitar exceso de sodio. No tengo alergias conocidas.",
                preferencias: "Prefiero pollo, arroz, verduras y comidas económicas.",
              },
            },
            cuidadoNutricional: {
              summary: "Caso con advertencia de seguridad",
              value: {
                socio_id: "2d2a45df-0fd5-4f4e-9c01-5de07dca1111",
                objetivo: 2,
                fecha_inicio: "2026-06-15",
                fecha_fin: "2026-07-15",
                idioma: "es",
                mensajeSocio: "Quiero mejorar mi alimentación y entreno tres veces por semana.",
                restricciones: "Tengo hipertensión.",
                preferencias: "Comidas simples y sin frituras.",
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
          schema: {
            $ref: "#/components/schemas/CatalogoParametrizableMutationRequest",
          },
          examples: {
            medioPago: {
              summary: "Crear medio de pago",
              value: {
                catalogo: "medio_pago",
                codigo: "mercado_pago",
                nombre: "Mercado Pago",
                descripcion:
                  "Pago online o presencial registrado mediante Mercado Pago.",
                activo: true,
                orden: 60,
                requiere_comprobante: true,
                es_online: true,
              },
            },
            ubicacionGimnasio: {
              summary: "Crear ubicación global del gimnasio",
              value: {
                catalogo: "ubicacion_gimnasio",
                codigo: "sala_funcional",
                nombre: "Sala funcional",
                descripcion: "Zona destinada a clases funcionales y entrenamiento grupal.",
                activo: true,
                orden: 20,
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
                  ? {
                      $ref: "#/components/schemas/AlertasMantenimientoEquipamientoResponse",
                    }
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
  const parameters = [
    ...getPathParams(endpoint.path),
    ...getQueryParams(endpoint),
  ];
  const requestBody = getRequestBody(endpoint, lowerMethod);
  const security =
    endpoint.auth || endpoint.admin
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
  const exposeInternalEndpoints =
    process.env.NEXT_PUBLIC_EXPOSE_INTERNAL_TEST_ENDPOINTS === "true";

  for (const endpoint of endpointDefinitions) {
    if (endpoint.internal && !exposeInternalEndpoints) {
      continue;
    }

    const pathItem = paths[endpoint.path] ?? {};

    for (const method of endpoint.methods) {
      const lowerMethod = method.toLowerCase();
      pathItem[lowerMethod] = buildOperation(endpoint, lowerMethod);
    }

    const orderedPathItem: OpenApiPathItem = {};
    Object.entries(pathItem)
      .sort(
        ([methodA], [methodB]) =>
          (methodOrder[methodA] ?? 99) - (methodOrder[methodB] ?? 99),
      )
      .forEach(([method, operation]) => {
        orderedPathItem[method] = operation;
      });

    paths[endpoint.path] = orderedPathItem;
  }

  return Object.fromEntries(
    Object.entries(paths).sort(([pathA], [pathB]) =>
      pathA.localeCompare(pathB),
    ),
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
        description: "Sesión de NextAuth usada por el frontend de Gym Master.",
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
        required: ["id", "nombre", "estado_alerta", "severidad", "mensaje"],
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
            items: {
              $ref: "#/components/schemas/AlertaMantenimientoEquipamiento",
            },
          },
          alertas_operativas: {
            type: "array",
            description:
              "Subconjunto de alertas excluyendo estado ok, útil para el panel operativo.",
            items: {
              $ref: "#/components/schemas/AlertaMantenimientoEquipamiento",
            },
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
          rol: {
            type: "string",
            enum: ["admin", "usuario", "socio"],
            example: "admin",
            description: "Rol esperado por /api/custom-login. No usar userType.",
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
      RagIngestExercisesRequest: {
        type: "object",
        properties: {
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            example: 25,
            description: "Cantidad máxima de ejercicios a procesar en la corrida.",
          },
          force: {
            type: "boolean",
            example: false,
            description: "Cuando vale true, reindexa aunque el hash del contenido no haya cambiado.",
          },
          onlyMissing: {
            type: "boolean",
            example: true,
            description: "Reservado para flujos de ingesta incremental.",
          },
          delayMs: {
            type: "integer",
            minimum: 0,
            maximum: 5000,
            example: 750,
            description: "Pausa en milisegundos entre embeddings para reducir errores 429 del proveedor.",
          },
        },
      },
      RagIngestDietRulesRequest: {
        type: "object",
        properties: {
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            example: 25,
            description: "Cantidad máxima de reglas nutricionales de comida_base a procesar.",
          },
          force: {
            type: "boolean",
            example: false,
            description: "Cuando vale true, reindexa aunque el hash del contenido no haya cambiado.",
          },
          onlyMissing: {
            type: "boolean",
            example: true,
            description: "Reservado para flujos de ingesta incremental.",
          },
          delayMs: {
            type: "integer",
            minimum: 0,
            maximum: 5000,
            example: 750,
            description: "Pausa en milisegundos entre embeddings para reducir errores 429 del proveedor.",
          },
        },
      },
      RagVectorizePendingRequest: {
        type: "object",
        properties: {
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            example: 25,
            description: "Cantidad máxima de chunks a vectorizar.",
          },
          force: {
            type: "boolean",
            example: false,
            description:
              "Cuando vale true, vuelve a generar embeddings para chunks activos aunque ya tengan vector.",
          },
          delayMs: {
            type: "integer",
            minimum: 0,
            maximum: 5000,
            example: 750,
            description: "Pausa en milisegundos entre embeddings para reducir errores 429 del proveedor.",
          },
        },
      },
      RagSearchRequest: {
        type: "object",
        required: ["query"],
        properties: {
          query: {
            type: "string",
            minLength: 3,
            example: "rutina para piernas nivel principiante",
          },
          domains: {
            type: "array",
            items: {
              type: "string",
              enum: [
                "exercise",
                "routine_rule",
                "diet_rule",
                "safety",
                "evolution",
                "business",
                "general",
              ],
            },
            example: ["exercise"],
          },
          sourceTables: {
            type: "array",
            items: { type: "string" },
            example: ["ejercicio"],
          },
          metadata: {
            type: "object",
            additionalProperties: true,
            example: { media_quality: "completo" },
          },
          matchThreshold: {
            type: "number",
            minimum: 0,
            maximum: 1,
            example: 0.72,
          },
          matchCount: {
            type: "integer",
            minimum: 1,
            maximum: 30,
            example: 8,
          },
        },
      },
      RagRutinasAssistantRequest: {
        type: "object",
        required: ["objetivo", "nivel", "dias"],
        properties: {
          objetivo: {
            type: "integer",
            minimum: 1,
            example: 1,
            description: "ID del objetivo de entrenamiento seleccionado.",
          },
          nivel: {
            type: "integer",
            minimum: 1,
            example: 1,
            description: "ID del nivel del socio.",
          },
          dias: {
            type: "integer",
            minimum: 1,
            maximum: 6,
            example: 3,
            description: "Cantidad de días por semana disponibles para entrenar.",
          },
          idioma: {
            type: "string",
            enum: ["es", "en"],
            example: "es",
          },
          mensajeSocio: {
            type: "string",
            maxLength: 1200,
            example: "Quiero ganar masa muscular, entrenar 3 días por semana y priorizar piernas. Soy principiante.",
          },
          restricciones: {
            type: "string",
            maxLength: 1200,
            example: "Cuidar rodilla derecha, evitar impacto alto.",
          },
          id_socio: {
            type: "string",
            format: "uuid",
            nullable: true,
            description: "Solo para pruebas/admin. El socio logueado se resuelve automáticamente.",
          },
        },
      },
      RagDietasAssistantRequest: {
        type: "object",
        required: ["socio_id", "objetivo", "fecha_inicio", "fecha_fin"],
        properties: {
          socio_id: {
            type: "string",
            format: "uuid",
            example: "2d2a45df-0fd5-4f4e-9c01-5de07dca1111",
          },
          objetivo: {
            type: "integer",
            minimum: 1,
            example: 1,
            description: "ID del objetivo nutricional/de entrenamiento.",
          },
          fecha_inicio: {
            type: "string",
            format: "date",
            example: "2026-06-15",
          },
          fecha_fin: {
            type: "string",
            format: "date",
            example: "2026-07-15",
          },
          idioma: {
            type: "string",
            enum: ["es", "en"],
            example: "es",
          },
          mensajeSocio: {
            type: "string",
            maxLength: 1200,
            example: "Quiero bajar grasa sin perder músculo y necesito comidas simples.",
          },
          restricciones: {
            type: "string",
            maxLength: 1200,
            example: "Evitar exceso de sodio. No tengo alergias conocidas.",
          },
          preferencias: {
            type: "string",
            maxLength: 1200,
            example: "Prefiero pollo, arroz, verduras y comidas económicas.",
          },
        },
      },
      RagCorpusBatchRequest: {
        type: "object",
        required: ["action"],
        properties: {
          action: {
            type: "string",
            enum: ["ingest_exercises", "ingest_diet_rules", "vectorize_pending", "all"],
            example: "vectorize_pending",
          },
          limit: { type: "integer", minimum: 1, maximum: 100, example: 10 },
          force: { type: "boolean", example: false },
          onlyMissing: { type: "boolean", example: true },
          delayMs: { type: "integer", minimum: 0, maximum: 5000, example: 1000 },
          maxRetries: { type: "integer", minimum: 0, maximum: 3, example: 1 },
          retryDelayMs: { type: "integer", minimum: 0, maximum: 5000, example: 1500 },
        },
      },
      RagCoachChatRequest: {
        type: "object",
        required: ["message"],
        properties: {
          message: {
            type: "string",
            minLength: 2,
            maxLength: 1600,
            example: "Quiero una rutina para ganar masa muscular 3 días por semana.",
          },
          socio_id: {
            type: "string",
            nullable: true,
            example: "me",
            description: "UUID del socio o me para socio autenticado.",
          },
          conversationContext: {
            type: "object",
            additionalProperties: true,
            description: "Contexto conversacional opcional para futuras versiones. El backend también construye contexto real del socio en tiempo de ejecución.",
          },
        },
      },
      RagEvolucionFisicaAssistantRequest: {
        type: "object",
        properties: {
          socio_id: {
            type: "string",
            nullable: true,
            example: "me",
            description: "UUID del socio a analizar o me para socio autenticado.",
          },
          idioma: {
            type: "string",
            enum: ["es", "en"],
            example: "es",
          },
          objetivo: {
            type: "string",
            maxLength: 1200,
            example: "Bajar grasa sin perder masa muscular",
          },
          mensajeSocio: {
            type: "string",
            maxLength: 1200,
            example: "Quiero saber si voy bien y qué debería ajustar esta semana.",
          },
          restricciones: {
            type: "string",
            maxLength: 1200,
            example: "Cuidar rodilla derecha, evitar impacto alto.",
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
              "empleado_tipo_contratacion",
              "empleado_puesto_responsabilidad",
              "empleado_area",
              "empleado_turno",
              "empleado_horario_disponibilidad",
              "medio_pago",
              "tipo_gasto",
              "tipo_ingreso",
              "categoria_producto",
              "tipo_equipamiento",
              "ubicacion_equipamiento",
              "ubicacion_gimnasio",
              "tipo_mantenimiento",
            ],
          },
          id: { type: "string", format: "uuid" },
          codigo: { type: "string", example: "mercado_pago" },
          nombre: { type: "string", example: "Mercado Pago" },
          descripcion: {
            type: "string",
            nullable: true,
            example:
              "Pago online o presencial registrado mediante Mercado Pago.",
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
