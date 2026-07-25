# Security Auth & RBAC Final Audit v1 — API families hardening

## Rama

`feature/security-auth-rbac-final-audit-v1`

## Bloque

Bloque 2 — Protección server-side de APIs heredadas y permisos por familia funcional.

## Objetivo

Cerrar rutas privadas que todavía podían ejecutarse sin una validación uniforme de JWT, rol y permiso de módulo. El guard del dashboard continúa siendo una barrera de experiencia de usuario; la autorización definitiva ahora se aplica dentro de los handlers API alcanzados por este bloque.

## Alcance protegido

Se endurecieron 40 archivos de rutas distribuidos en estas familias:

- Actividades y turnos/cupos.
- BI de cuotas y pagos.
- Avisos.
- Equipamientos, alertas, mantenimiento BI y preventivos.
- Infraestructura edilicia, órdenes, checklists y QR.
- Mantenimientos de equipos.
- Productos, historial y movimientos de stock.
- Proveedores.
- Servicios.

## Política aplicada

Cada handler protegido ejecuta, antes de consultar o modificar datos:

1. Validación estricta de `Authorization: Bearer <token>`.
2. Rechazo de tokens de Terminal fuera de los endpoints autorizados.
3. Validación del rol permitido.
4. Validación del permiso de menú asociado al módulo.
5. Respuesta uniforme con `401` o `403` para fallas de autenticación/autorización.

La infraestructura compartida incorpora:

- `authorizeDashboardRequest(...)` para componer autenticación, rol y permiso.
- `requireAnyDashboardPermission(...)` para APIs compartidas por más de un módulo.
- `authorizationErrorResponse(...)` para no convertir rechazos de seguridad en errores `500`.

## Reglas relevantes por dominio

### Actividades

- Admin, usuario interno y socio pueden consultar actividades y turnos si poseen el permiso `Actividades`.
- Solo admin y usuario interno autorizado pueden crear, modificar o eliminar actividades y turnos.
- El socio conserva la posibilidad de solicitar/cancelar su propia inscripción mediante las comprobaciones de propiedad existentes.

### Comercial

- Las lecturas de productos, proveedores y servicios conservan compatibilidad con los módulos que legítimamente las consumen, incluido POS/Kiosco.
- Las mutaciones permanecen vinculadas al permiso específico de Productos, Proveedores o Servicios.
- Los movimientos de stock requieren acceso a Stock Ledger o Productos.

### Infraestructura

- Mantenimiento edilicio, activos, sectores, órdenes y checklists requieren el permiso correspondiente.
- Etiquetas QR y lector QR/barra comparten únicamente los endpoints QR necesarios.
- El resto de los módulos no obtiene acceso por esa compatibilidad.

### Cuotas y pagos

El dashboard BI de cuotas requiere el permiso `Pagos`, asociado a `/dashboard/bi-cuotas-pagos`.

## Clientes actualizados

Los clientes browser que antes llamaban rutas ahora protegidas sin Bearer agregan `authHeader()`:

- `infraestructuraMantenimientoClient.ts`
- `equipamientoPreventivoClient.ts`
- `equipamientoService.ts` para alertas y BI
- `cuotasPagosBiApiClient.ts`

## Verificación automática

```bash
npm run test:auth-rbac
```

El gate comprueba:

- aislamiento del token de Terminal;
- helpers de rol y permisos simples/múltiples;
- protección de los 40 archivos de rutas;
- preservación de respuestas 401/403;
- ausencia de uso directo de `authMiddleware` sin permiso de módulo en estas familias;
- encabezados Bearer en los clientes actualizados;
- reglas críticas de Actividades, POS/Kiosco, Stock Ledger, Cuotas e Infraestructura QR.

## QA manual sugerido

### Usuario autorizado

- Abrir cada módulo desde el menú.
- Confirmar carga de listados, detalles y métricas.
- Ejecutar una operación segura de creación/edición cuando exista un dato de prueba.
- Confirmar respuestas `200/201` y ausencia de regresiones visuales.

### Usuario sin permiso del módulo

- Intentar la URL del dashboard manualmente.
- Ejecutar la API correspondiente con su JWT normal.
- Confirmar `403`, sin datos parciales ni respuesta `500`.

### Socio

- Confirmar lectura e inscripción propia en Actividades.
- Confirmar bloqueo `403` en Avisos administrativos, Equipamientos, Infraestructura, Cuotas BI, Productos, Proveedores y Servicios.

### Sin token y token de Terminal

- Sin Bearer: `401`.
- Token de Terminal contra cualquier ruta de este bloque: `403`.

## Base de datos

Este bloque no modifica tablas, migraciones, RLS, RPC ni datos persistidos. La seguridad de tenant y las políticas de acceso a nivel de Supabase se auditarán en `feature/database-rls-final-audit-v1`.
