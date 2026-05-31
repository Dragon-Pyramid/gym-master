# Empleados foundation

## Objetivo

Se incorpora una base formal de empleados para Gym Master, reemplazando progresivamente el módulo legacy de entrenadores. El nuevo módulo permite administrar personal administrativo, entrenadores, mantenimiento, limpieza y bar/snack desde una estructura común.

## Alcance funcional

- Nueva pantalla `/dashboard/empleados`.
- Nuevo endpoint `GET /api/empleados`.
- Nuevo endpoint `POST /api/empleados`.
- Nuevo endpoint `GET /api/empleados/{id}`.
- Nuevo endpoint `PATCH /api/empleados/{id}`.
- Nuevo endpoint `DELETE /api/empleados/{id}` con baja lógica.
- Alta, edición, detalle, filtros y desactivación de empleados.
- Exportación Excel con timestamp.
- PDF membretado con timestamp.
- Métricas de empleados activos, administrativos y nómina estimada.
- Redirect legacy desde `/dashboard/entrenadores` hacia `/dashboard/empleados`.
- Sidebar actualizado para mostrar “Empleados” en lugar de “Entrenadores”.
- Swagger/OpenAPI actualizado.

## Modelo de datos

Se crea `public.empleados` con datos personales y laborales básicos:

- nombre completo,
- DNI,
- email,
- teléfono,
- dirección,
- fecha de nacimiento,
- fecha de alta,
- tipo de empleado,
- puesto,
- área,
- tipo de contratación,
- turno,
- sueldo base de referencia,
- fecha de inicio,
- fecha de baja,
- horarios / disponibilidad,
- observaciones,
- relación opcional futura con `usuario`,
- estado activo/inactivo.

## Seed demo

La migración carga empleados demo realistas, dos por tipo principal:

- Administrativo,
- Entrenador,
- Mantenimiento,
- Limpieza,
- Bar / Snack.

Este seed sirve para QA, demos comerciales y futura feature de sueldos.

## Decisión técnica

Gustavo autorizó reemplazar el módulo actual de entrenadores si conviene técnicamente. Por seguridad y trazabilidad, esta feature no borra tablas legacy; crea una estructura limpia de empleados y redirige la navegación de entrenadores hacia el nuevo módulo.

## Pendientes futuros

- `feature/empleados-sueldos-opcional`: liquidación/historial de sueldos.
- `feature/empleados-rbac-menu-permissions`: permisos de menú para empleados administrativos.
- `feature/auth-usuarios-socios-normalizacion`: relación formal entre empleado y usuario/login.
