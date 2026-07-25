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

## Bloque 3 completado

El endurecimiento de recursos sensibles quedó documentado en:

`docs/security/security-auth-rbac-final-audit-v1-sensitive-resources.md`

Este bloque incorpora autorización por módulo y propiedad del socio en Socios, Pagos, Ficha médica, Rutinas, Dietas, Evolución física, Mensajes, Notificaciones y analítica sensible. También aísla la gestión de licencia al rol Master Admin y reduce la exposición del verificador público de recibos.

## Próximos pasos de la rama

1. Ejecutar build y matriz manual completa del Bloque 3.
2. Corregir únicamente regresiones detectadas durante QA.
3. Realizar el gate consolidado de los tres bloques.
4. Preparar PR e informe técnico de cierre.
5. Registrar para la auditoría RLS cualquier riesgo que dependa de Supabase y no de la API.

## Base de datos

Este parche no modifica tablas, migraciones, RLS, RPC ni datos persistidos. La auditoría de políticas de Supabase se mantiene separada para `feature/database-rls-final-audit-v1`.
