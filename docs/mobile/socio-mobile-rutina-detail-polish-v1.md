# Socio mobile rutina detail polish v1

## Objetivo

Pulir la experiencia mobile del socio al consultar sus rutinas desde `/dashboard/rutinas`, dejando la vista de detalle más clara, compacta y útil en celular.

## Alcance

- Frontend only.
- Sin cambios de base de datos.
- Sin cambios backend.
- Sin cambios de Swagger/OpenAPI.
- Sin cambios de RLS.

## Cambios realizados

### Detalle de rutina

- Header del detalle más compacto y legible en mobile.
- Resumen rápido con cantidad de días, ejercicios totales, día sugerido y modo mobile.
- Chips horizontales por día para navegar la rutina sin mucho scroll.
- Día actual marcado como `Hoy` cuando coincide con el plan.
- Al abrir una rutina se expande automáticamente el día actual si existe; si no existe, se abre el primer día disponible.
- Cards de ejercicios más cómodas para celular, con numeración visible.
- Series, repeticiones y descanso separados en bloques táctiles.
- Botón de ayuda para explicar series/repeticiones conservado y más contextual.
- Botones claros para ver video e imagen del ejercicio.
- Imagen del ejercicio con tamaño más amigable para mobile.

### Listado de rutinas

- Cards del listado más limpias y app-like.
- Botón principal `Ver rutina` más claro.
- Los socios dejan de ver acciones administrativas de editar/eliminar rutinas.
- Admin/administrador conserva acciones de gestión cuando corresponde.

### Página `/dashboard/rutinas`

- El botón de impresión del listado se oculta en mobile y queda disponible en pantallas mayores.
- La vista mobile prioriza entrar al detalle y descargar el PDF desde la rutina.

## Archivos modificados

- `src/app/dashboard/rutinas/page.tsx`
- `src/components/dashboard/rutinas/RutinaDisplay.tsx`
- `docs/mobile/socio-mobile-rutina-detail-polish-v1.md`

## QA recomendado

Validar como socio en mobile:

1. Entrar a `/dashboard/rutinas`.
2. Ver listado de rutinas sin acciones de editar/eliminar.
3. Abrir una rutina.
4. Confirmar header compacto y resumen rápido.
5. Confirmar que se expande el día actual o el primer día disponible.
6. Navegar por chips de días.
7. Revisar cards de ejercicios en mobile.
8. Probar ayuda de series/repeticiones.
9. Probar `Ver video` si hay YouTube.
10. Probar `Ver imagen` si el ejercicio tiene media.
11. Descargar PDF de rutina.
12. Confirmar que no aparece scroll horizontal.

Validar como admin:

1. Entrar a `/dashboard/rutinas`.
2. Confirmar que las acciones de editar/eliminar siguen disponibles.
3. Abrir una rutina asignada y verificar que se muestra el socio si corresponde.

## Riesgo

Bajo. El cambio es de presentación y UX. No modifica contratos API ni estructura de datos.
