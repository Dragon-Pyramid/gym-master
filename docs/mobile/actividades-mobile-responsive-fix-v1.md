# Actividades Mobile Responsive Fix v1

## Objetivo

Corregir el único punto pendiente detectado en QA mobile: el módulo **Actividades** no estaba 100% responsive y algunos listados se desfasaban en celular.

## Alcance

Ruta principal:

- `/dashboard/actividades`

Componentes relacionados:

- `ActividadTable`
- `ActividadModal`
- `ActividadViewModal`
- `ActividadForm`

## Cambios aplicados

### Página Actividades

- Se evita overflow horizontal en el `main`.
- Se compacta padding mobile.
- Se mejora el grid de KPIs.
- Se corrige el ancho de selects y filtros.
- Los filtros de turnos pasan a layout mobile-first.
- Los botones PDF, Excel y Actualizar son full-width en mobile.
- El formulario de turnos mejora botones en mobile.

### Listado de turnos y cupos

- En mobile se reemplaza la tabla ancha por cards responsive.
- En desktop se conserva la tabla completa.
- Las cards muestran:
  - actividad;
  - turno;
  - día y horario;
  - instructor;
  - ubicación;
  - cupos;
  - estado;
  - acciones.

### Inscripciones recientes

- En mobile se reemplaza la tabla por cards.
- En desktop se conserva la tabla.
- Las acciones se acomodan en grid para evitar desbordes.

### Catálogo de actividades

- `ActividadTable` ahora renderiza:
  - cards en mobile;
  - tabla en desktop.
- Se evita que la columna de acciones desplace el contenido.
- Los botones quedan dentro del ancho disponible.

### Modales

- `ActividadModal` y `ActividadViewModal` respetan ancho mobile.
- Se agrega altura máxima y scroll interno.
- El formulario usa botones full-width en mobile.

## Validación sugerida

1. Ejecutar `npm run build`.
2. Probar `/dashboard/actividades` en DevTools con iPhone 12 Pro.
3. Validar:
   - KPIs sin overflow;
   - gráficos sin desfasarse;
   - filtros de turnos en columna;
   - turnos como cards en mobile;
   - inscripciones como cards en mobile;
   - catálogo como cards en mobile;
   - modales sin salirse de pantalla;
   - desktop mantiene tablas completas.
