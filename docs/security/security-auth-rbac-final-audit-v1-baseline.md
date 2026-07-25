# Security Auth & RBAC Final Audit v1 — baseline

## Rama

`feature/security-auth-rbac-final-audit-v1`

## Objetivo

Realizar la auditoría final de autenticación, autorización y aislamiento por rol antes de la revisión específica de RLS y del cierre de producción.

## Hallazgos iniciales

### 1. Sesiones de Terminal reutilizables fuera de su alcance

El JWT renovado para la Terminal incluye `terminal_session: true`, pero el middleware de autenticación aceptaba ese token en cualquier endpoint protegido que recibiera el encabezado `Authorization`.

Esto permitía que una sesión operativa de larga duración intentara reutilizarse fuera de los endpoints estrictamente necesarios para la Terminal.

### 2. Autenticación no equivale a autorización

Una parte importante de los endpoints ya valida JWT, pero varios solo comprueban que exista un usuario autenticado. Todavía debe auditarse por familias si el rol, el permiso de menú y el alcance del socio solicitado son coherentes con la operación.

### 3. Endpoints heredados sin autenticación explícita

Se detectaron rutas heredadas de actividades, avisos, cuotas, equipamientos, infraestructura, mantenimientos, productos, proveedores y servicios que todavía no invocan `authMiddleware` directamente. Deben clasificarse entre públicas intencionales y privadas, y endurecerse en parches sucesivos.

### 4. El guard del dashboard es una barrera de UX, no la frontera de seguridad

`DashboardRouteGuard` impide la navegación normal por URL y mejora la experiencia, pero se ejecuta en cliente y usa estado persistido. La protección definitiva debe residir en cada API y, posteriormente, en las políticas RLS de Supabase.

## Primer endurecimiento aplicado

- Validación estricta del encabezado `Authorization: Bearer <token>`.
- Validación mínima del payload JWT: identidad, correo y rol reconocido.
- Errores tipados con código y estado HTTP.
- Rechazo por defecto de tokens con `terminal_session: true`.
- Opt-in explícito para los tres endpoints operativos de Terminal:
  - `GET /api/asistencias/qr-dia`
  - `GET /api/asistencias/recientes`
  - `GET /api/notificaciones/terminal`
- Validación server-side del permiso `/dashboard/asistencias/terminal` en esos endpoints.
- Helpers reutilizables para:
  - roles permitidos;
  - permisos de módulo;
  - aislamiento del socio autenticado.
- Verificador estático `npm run test:auth-rbac`.

## Bloque 2 completado

El endurecimiento de familias API quedó documentado en:

`docs/security/security-auth-rbac-final-audit-v1-api-families.md`

Este bloque incorpora autenticación, rol, permiso de módulo y respuestas 401/403 uniformes en 40 archivos de rutas de Actividades, Cuotas, Avisos, Equipamientos, Infraestructura, Mantenimientos, Productos, Proveedores y Servicios.

## Próximos bloques

1. Auditar operaciones con `socioId`, `id_socio`, `usuarioId` o parámetros equivalentes.
2. Validar Master Admin y sincronización de licencia.
3. Revisar rutas protegidas restantes fuera de las familias cubiertas.
4. Ejecutar la matriz manual por rol y por URL directa.
5. Documentar hallazgos que deban resolverse específicamente con RLS.

## Base de datos

Este parche no modifica tablas, migraciones, RLS, RPC ni datos persistidos. La auditoría de políticas de Supabase se mantiene separada para `feature/database-rls-final-audit-v1`.
