# Catálogos parametrizables - CRUD base

## Objetivo

Agregar una primera capa de administración CRUD para los catálogos parametrizables de Gym Master desde `/dashboard/parametrizacion`.

## Alcance

Esta feature permite:

- crear registros en catálogos parametrizables;
- editar registros existentes;
- activar/desactivar registros sin hard delete;
- refrescar los datos vivos desde Supabase;
- mantener la pantalla de parametrización como panel operativo inicial.

## Catálogos alcanzados

El endpoint y la UI soportan los 8 catálogos foundation:

- `tipo_empleado`
- `medio_pago`
- `tipo_gasto`
- `tipo_ingreso`
- `categoria_producto`
- `tipo_equipamiento`
- `ubicacion_equipamiento`
- `tipo_mantenimiento`

## Decisiones técnicas

- Se mantiene un único endpoint `/api/parametrizacion/catalogos` con métodos `GET`, `POST` y `PATCH`.
- El endpoint usa una whitelist de tablas permitidas para evitar escrituras dinámicas inseguras.
- No se implementa hard delete; los registros se desactivan con `activo = false`.
- El código del catálogo se normaliza en backend a minúsculas, sin acentos, sin espacios y con `_`.
- Se usa `getSupabaseServerClient()` para operar desde el servidor.

## Fuera de alcance

No se integran todavía estos catálogos en formularios operativos como pagos, productos, equipamiento, mantenimientos o empleados.

## Próximos pasos recomendados

1. Integrar `medio_pago` en formularios de pagos y recibos.
2. Integrar `tipo_gasto` en otros gastos y futuros sueldos.
3. Integrar `tipo_empleado` cuando se migre entrenadores a empleados.
4. Integrar `tipo_equipamiento`, `ubicacion_equipamiento` y `tipo_mantenimiento` en equipamiento/mantenimiento avanzado.
