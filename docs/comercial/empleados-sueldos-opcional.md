# Feature: empleados-sueldos-opcional

## Rama

`feature/empleados-sueldos-opcional`

## Objetivo

Agregar una base opcional para registrar liquidaciones y pagos de sueldo de empleados dentro de Gym Master, dejando preparada la futura integración con egresos, recibos formales, BI financiero y permisos/RBAC.

## Alcance implementado

- Nueva pantalla `/dashboard/empleados-sueldos`.
- Nueva tabla `public.empleados_sueldos`.
- Endpoints:
  - `GET /api/empleados-sueldos`
  - `POST /api/empleados-sueldos`
  - `GET /api/empleados-sueldos/{id}`
  - `PATCH /api/empleados-sueldos/{id}`
  - `DELETE /api/empleados-sueldos/{id}`
- Registro de sueldo por empleado y período.
- Estados: `pendiente`, `pagado`, `anulado`.
- Medio de pago.
- Fecha de pago con calendario.
- Sueldo base, bonos, descuentos y monto neto.
- Recibo PDF individual.
- Listado PDF membretado con timestamp.
- Exportación Excel con timestamp.
- Seed demo de sueldos para empleados existentes.
- Menú `Sueldos` en Administración.
- Swagger/OpenAPI actualizado.

## Criterios técnicos

- No se guardan contraseñas ni credenciales.
- La anulación es lógica mediante estado `anulado`.
- Los períodos se representan con el primer día del mes.
- Todos los inputs de fecha editables usan calendario.
- La visualización de fechas se mantiene en `dd/mm/yyyy`.
- La persistencia se mantiene en formato técnico compatible con DB.

## Pendientes futuros

- Integración automática con `Gastos / Egresos` al marcar sueldo como pagado.
- Recibo PDF más formal con firma/sello si el gimnasio lo requiere.
- Liquidación masiva por período.
- Integración con empleados/RBAC/usuarios.
- Reportes laborales en BI financiero.
