# Rutinas - corrección de eliminación y refresco de listado

## Objetivo

Corregir el flujo del módulo de rutinas para que:

- al eliminar una rutina, la operación persista realmente en base de datos;
- al generar o eliminar una rutina, el listado se actualice sin necesidad de presionar F5;
- el endpoint de historial evite respuestas cacheadas;
- el socio solo pueda eliminar sus propias rutinas;
- el administrador pueda operar sobre rutinas de cualquier socio.

## Decisión técnica

La tabla `public.rutina` no posee columnas `activo`, `eliminado_en` ni equivalentes para baja lógica. Su estructura actual contiene:

- `id_rutina`
- `id_socio`
- `rutina_desc`
- `creado_en`
- `actualizado_en`
- `contenido`
- `semana`
- `nombre`

Por ese motivo, esta feature implementa eliminación física controlada mediante API, validando autenticación y pertenencia antes de ejecutar el `DELETE`.

## Cambios realizados

### Backend/API

- Se creó/corrigió `DELETE /api/rutina/[id]`.
- Se mantiene compatibilidad con `GET /api/rutina/[id]` para consultas por socio desde admin.
- Se agregó `eliminarRutina()` en `rutinaService.ts`.
- Se validan permisos:
  - admin/administrador: puede eliminar cualquier rutina;
  - socio: solo puede eliminar rutinas propias.
- Se fuerza respuesta dinámica/no-cache en historial.

### Frontend

- `eliminarRutina()` en `apiClient.ts` consume el endpoint `DELETE /api/rutina/[id]`.
- `getHistorialRutinas()` agrega cache busting y `cache: 'no-store'`.
- El componente ya refresca mediante `refreshKey` y `fetchRutinas()` después de crear o eliminar.

## Validación recomendada

1. Generar una rutina como socio.
2. Confirmar que aparece en el listado sin F5.
3. Eliminar la rutina.
4. Confirmar que desaparece sin F5.
5. Refrescar la página manualmente y verificar que no reaparece.
6. Validar como admin con rutinas de distintos socios.

## Script de validación

```bash
docker exec -i supabase_db_gym-master psql -U postgres -d postgres < database/scripts/validar_rutinas_delete_refresh_flow.sql
```
