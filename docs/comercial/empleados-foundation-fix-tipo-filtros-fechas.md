# Fix empleados: tipos, filtros y fechas calendario

## Alcance

Este ajuste complementa la feature `feature/empleados-foundation`.

## Correcciones

- Se corrige la visualización del tipo de empleado en el listado y reportes cuando Supabase no hidrata automáticamente la relación `tipo_empleado:id_tipo_empleado`.
- Se agrega hidratación manual de tipos de empleado desde `tipo_empleado` en el service backend.
- El filtro por tipo del dashboard de empleados se alimenta desde el catálogo parametrizable `tipo_empleado`, no desde los registros cargados en la tabla.
- El conteo de administrativos usa empleados con tipo hidratado.
- Se refuerza la normalización de fechas para inputs `type="date"` del formulario de empleados, manteniendo calendario nativo del navegador.

## Validaciones sugeridas

- Entrar a `/dashboard/empleados`.
- Confirmar que la columna Tipo ya no muestra `Sin tipo` cuando el empleado tiene tipo asignado.
- Confirmar que el filtro de tipo muestra Administrativo, Entrenador, Mantenimiento, Limpieza y Bar / Snack.
- Filtrar por cada tipo.
- Editar un empleado y confirmar que todas las fechas del formulario usan calendario.
- Desactivar un empleado y confirmar que puede verse filtrando por Inactivos.
- Ejecutar `npm run build`.
