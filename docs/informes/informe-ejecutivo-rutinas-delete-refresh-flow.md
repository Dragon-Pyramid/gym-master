# Informe ejecutivo técnico - Rutinas delete/refresh flow

## Proyecto

Gym Master

## Rama

`feature/rutinas-delete-refresh-flow`

## Objetivo

Corregir dos comportamientos detectados en el módulo de rutinas: el listado no siempre se actualizaba automáticamente luego de crear una rutina y la eliminación no quedaba garantizada como operación persistente en base de datos.

## Diagnóstico

La UI ya mostraba un flujo de confirmación para eliminar rutinas, pero era necesario asegurar que existiera un endpoint real conectado con el servicio de base de datos. También se reforzó el refresco del historial para evitar respuestas cacheadas o estados visuales desactualizados.

La tabla `public.rutina` no dispone de columnas para baja lógica, como `activo` o `eliminado_en`. Por ello, la solución aplicada utiliza eliminación física controlada desde backend con validación de permisos.

## Implementación

Se agregó/corrigió el endpoint dinámico `/api/rutina/[id]` con soporte para `DELETE`. El servicio `rutinaService.ts` incorpora la función `eliminarRutina()`, que primero verifica la existencia de la rutina, luego valida permisos por rol y finalmente ejecuta el borrado físico.

Para mejorar el refresco visual, `getHistorialRutinas()` ahora utiliza `cache: 'no-store'` y un query param temporal. Además, el endpoint de historial responde con headers `Cache-Control: no-store`.

## Resultado esperado

- La rutina generada aparece en el listado sin presionar F5.
- La rutina eliminada desaparece inmediatamente del listado.
- La rutina eliminada no reaparece al refrescar la página.
- Los socios solo pueden eliminar rutinas propias.
- Los administradores pueden operar sobre rutinas asignadas a cualquier socio.

## Validación recomendada

1. Ejecutar `npm run build`.
2. Generar rutina como socio.
3. Confirmar actualización automática del listado.
4. Eliminar rutina.
5. Confirmar que desaparece y no reaparece al refrescar.
6. Probar el flujo desde administrador.
7. Ejecutar el script SQL `database/scripts/validar_rutinas_delete_refresh_flow.sql`.

## Observación

Si se requiere auditoría histórica de rutinas eliminadas, se recomienda una feature posterior para agregar baja lógica mediante columnas `activo`, `eliminado_en` y `eliminado_por`.
