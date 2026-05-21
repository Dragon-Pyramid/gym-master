# PR: Fix rutina delete and refresh flow

## Resumen

Esta rama corrige el flujo de creación/eliminación de rutinas para evitar que el usuario necesite presionar F5 y para asegurar que la eliminación realmente impacte en la base de datos.

## Contexto

Se detectaron dos problemas en el módulo de rutinas:

1. Después de generar una rutina, el mensaje indicaba éxito pero el listado no siempre se actualizaba hasta refrescar manualmente.
2. Al eliminar una rutina, aparecía la confirmación visual, pero la rutina podía seguir apareciendo porque no existía un endpoint de eliminación persistente correctamente conectado.

## Cambios principales

- Agregado/corregido `DELETE /api/rutina/[id]`.
- Agregado servicio `eliminarRutina()` en `rutinaService.ts`.
- Validación de permisos por rol:
  - admin/administrador puede eliminar rutinas de cualquier socio;
  - socio solo puede eliminar rutinas propias.
- Refuerzo de `getHistorialRutinas()` con `cache: 'no-store'` y cache busting.
- Respuestas API de historial con `Cache-Control: no-store`.
- Script de validación para inspeccionar estructura y datos actuales de `public.rutina`.
- Documentación técnica del flujo.

## Decisión de eliminación

La tabla `public.rutina` no tiene columna `activo` ni `eliminado_en`, por lo que esta rama usa eliminación física controlada. Si más adelante se desea trazabilidad histórica, se recomienda una feature específica para agregar baja lógica.

## Validaciones sugeridas

- [ ] `npm run build`
- [ ] Login como socio
- [ ] Generar rutina y confirmar refresh automático
- [ ] Eliminar rutina y confirmar que desaparece sin F5
- [ ] Refrescar manualmente y confirmar que no reaparece
- [ ] Login como admin
- [ ] Validar historial de rutinas asignadas
- [ ] Ejecutar script SQL de validación

## Script SQL

```bash
docker exec -i supabase_db_gym-master psql -U postgres -d postgres < database/scripts/validar_rutinas_delete_refresh_flow.sql
```
