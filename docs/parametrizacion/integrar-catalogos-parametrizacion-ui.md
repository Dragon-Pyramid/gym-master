# Integración de catálogos parametrizables en UI

## Objetivo

Conectar la pantalla `/dashboard/parametrizacion` con los catálogos reales creados en la base de datos.

## Alcance

Esta fase agrega lectura real de datos, sin modificar formularios existentes ni crear CRUD todavía.

## Cambios incluidos

- Nueva API interna `GET /api/parametrizacion/catalogos`.
- Nuevo servicio frontend `parametrizacionService.ts`.
- Nueva interfaz `parametrizacion.interface.ts`.
- Pantalla `/dashboard/parametrizacion` con conteos reales por catálogo.
- Botón para actualizar datos.
- Cards con totales, activos, inactivos y ejemplos reales.
- Ajuste de navegación para mostrar `Parametrización` en el menú de administradores.

## Catálogos leídos

- `tipo_empleado`
- `medio_pago`
- `tipo_gasto`
- `tipo_ingreso`
- `categoria_producto`
- `tipo_equipamiento`
- `ubicacion_equipamiento`
- `tipo_mantenimiento`

## Decisión técnica

La API utiliza `getSupabaseServerClient()` para leer catálogos desde servidor y evitar problemas con RLS o exposición innecesaria de lógica de acceso en el navegador.

La ruta se marca con:

```ts
export const dynamic = "force-dynamic";
```

para evitar errores de prerender estático en Next.js.

## Fuera de alcance

- CRUD de catálogos.
- Integración de selects en formularios.
- Migración de entrenadores a empleados.
- Módulo de sueldos.
- Módulo de notificaciones.
