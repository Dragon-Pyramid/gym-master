# I18N ES/EN Socio Dashboard Final Sweep v1 — Rutinas fix v1

## Ruta

- `/dashboard/rutinas`

## Objetivo

Corregir textos mixtos ES/EN y mejorar el modo oscuro de la pantalla de rutinas del menú socio, sin modificar lógica funcional, DB, endpoints, Swagger/OpenAPI, generación PDF ni servicios de rutinas.

## Cambios incluidos

### Traducción UI ES/EN

- Header: `Rutinas / Routines`.
- Título de sección:
  - `Mis rutinas / My routines`.
  - `Rutinas asignadas a socios / Routines assigned to members` para admin.
- Filtros:
  - `Filtros / Filters`.
  - `Niveles / Levels`.
  - `Objetivos / Goals`.
  - placeholder `Buscar rutinas... / Search routines...`.
- Acciones:
  - `Imprimir listado / Print list`.
  - `Generar rutina / Generate routine`.
  - `Ver rutina / View routine`.
  - `Editar / Edit`.
  - `Eliminar / Delete`.
  - `Eliminando... / Deleting...`.
- Estados y mensajes:
  - `Cargando... / Loading...`.
  - errores y toasts de carga/eliminación.
  - confirm de eliminación.

### Traducción de datos dinámicos de presentación

- Valores comunes de filtros y rutina:
  - `Definición / Definition`.
  - `Volumen / Volume`.
  - `Bajar de peso / Lose weight`.
  - `Fuerza / Strength`.
  - `Resistencia / Endurance`.
  - `Inicial / Beginner`.
  - `Intermedio / Intermediate`.
  - `Avanzado / Advanced`.
- Títulos automáticos:
  - `Rutina auto ... / Auto routine ...`.
  - `Rutina semana ... / Week routine ...`.
  - `Rutina #... / Routine #...`.
- Bloque gráfico superior:
  - `RUTINAS / ROUTINES`.
  - `ENTRENA CON PROPÓSITO / TRAIN WITH PURPOSE`.

### Dark mode

- Fondo general del listado.
- Card principal de página.
- Header interno de filtros.
- Popover de filtros.
- Inputs y botones.
- Cards del listado de rutinas.
- Footer/acciones de cada card.
- Botones de ver/editar/eliminar.

## Archivos modificados

- `src/app/dashboard/rutinas/page.tsx`
- `src/components/dashboard/rutinas/RutinaDisplay.tsx`

## Validación sugerida

```bash
cd /e/gym-master-2026/sistema/gym-master
rm -rf .next
npm run build
```

Luego limpiar artefactos PWA:

```bash
git checkout -- public/sw.js
rm -f public/fallback-*.js
```

## QA manual

- Revisar `/dashboard/rutinas` en idioma EN y ES.
- Revisar modo claro y oscuro.
- Revisar filtro, buscador, botón print, botón generar y listado.
- Abrir una rutina y validar que el detalle siga funcionando.

## Alcance excluido

- No se modifica DB.
- No se modifican endpoints.
- No se modifica Swagger/OpenAPI.
- No se modifica lógica de rutinas, sesiones, marcado de ejercicios ni PDF.
- Los textos internos de PDF quedan para el sweep específico de exportables.
