# Gym Master — Respaldo / Exportación del negocio

## Rama

`feature/admin-respaldo-exportacion-negocio`

## Objetivo

Habilitar un módulo administrativo para exportar datos operativos del gimnasio en formatos útiles, sin exponer secretos ni know-how interno de Dragon Pyramid.

## Alcance implementado

- Pantalla `/dashboard/respaldo-negocio` para administradores.
- Endpoints:
  - `GET /api/admin/respaldo-negocio`
  - `POST /api/admin/respaldo-negocio/exportar`
- Exportación en formato Excel `.xlsx`.
- Exportación en formato JSON `.json`.
- Selección de módulos exportables.
- Auditoría en `public.admin_respaldo_exportacion`.
- Swagger/OpenAPI actualizado.

## Datos exportables

Incluye datos operativos del negocio:

- Socios
- Usuarios internos sin hashes de contraseña
- Empleados
- Sueldos
- Cuotas
- Pagos
- Asistencias
- Ventas y detalle de ventas
- Compras y detalle de compras
- Productos / stock
- Proveedores
- Servicios
- Gastos / egresos
- Mensajes de socios
- Tickets de soporte Dragon Pyramid

## Exclusiones explícitas

No se exportan:

- `password_hash`
- tokens
- secretos
- variables de entorno
- migraciones privadas
- dumps completos de base de datos
- scripts operativos internos
- datasets propietarios
- lógica de generación de rutinas/dietas
- know-how técnico o comercial de Dragon Pyramid

## Alcance futuro documentado

Más adelante, esta base se integrará con una feature de offboarding SaaS:

`feature/saas-client-offboarding-export`

Regla futura: si un gimnasio deja de pagar o decide abandonar el servicio, se podrá habilitar por dos semanas un dashboard restringido solo a exportación de datos de negocio.
