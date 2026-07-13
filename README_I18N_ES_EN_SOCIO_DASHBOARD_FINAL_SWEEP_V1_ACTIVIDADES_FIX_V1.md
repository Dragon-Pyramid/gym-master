# I18N ES/EN - Socio dashboard final sweep v1 - Actividades fix v1

## Ruta

- `/dashboard/actividades`

## Objetivo

Corregir textos mixtos ES/EN visibles para el socio en la pantalla de actividades, clases, cupos e inscripciones, incluyendo cards, filtros, estados, acciones y datos de presentación.

## Archivos modificados

- `src/app/dashboard/actividades/page.tsx`

## Cambios incluidos

- Agrega `useI18n` y helper local `tx` para alternar textos ES/EN.
- Traduce el encabezado del socio:
  - `Solicitud de inscripción` / `Enrollment request`
  - `Actividades y clases` / `Activities and classes`
  - descripción principal.
- Traduce KPIs:
  - `Turnos activos` / `Active shifts`
  - `Cupos libres` / `Free slots`
  - `Pendientes` / `Pending`
  - `Mis inscripciones` / `My enrollments`
- Traduce el bloque `Mis cupos e inscripciones` y sus estados vacíos/carga.
- Traduce filtros del socio:
  - placeholder de búsqueda.
  - combo de días: `Todos los días`, `Lunes`, `Martes`, etc. / `All days`, `Monday`, `Tuesday`, etc.
- Traduce cards de turnos:
  - días de semana.
  - cupos libres/lista de espera.
  - instructor, ubicación, ocupación, inscriptos, libres, espera.
  - botones: solicitar inscripción, solicitar lista de espera, cancelar solicitud/inscripción.
- Traduce estados de inscripción del socio:
  - `Solicitud pendiente` / `Pending request`
  - `Inscripción aprobada` / `Enrollment approved`
  - `Asistencia registrada` / `Attendance recorded`
  - `Ausencia registrada` / `Absence recorded`
  - `Cancelada` / `Cancelled`
- Traduce mensajes/toasts del flujo de solicitud/cancelación.
- Agrega traducción de presentación para valores dinámicos frecuentes, sin tocar datos persistidos:
  - `A confirmar` / `To be confirmed`
  - `Sala principal` / `Main room`
  - `Sala funcional` / `Functional room`
  - `Box entrenamiento` / `Training box`
  - observaciones demo frecuentes.

## Alcance

No se modifican:

- DB.
- Endpoints.
- Swagger/OpenAPI.
- Lógica de inscripción/cancelación.
- Cupos, ocupación ni cálculos.
- RBAC/auth.
- Exportables PDF/Excel.

## Validación recomendada

```bash
cd /e/gym-master-2026/sistema/gym-master
rm -rf .next
npm run build
```

Luego limpiar PWA:

```bash
git checkout -- public/sw.js
rm -f public/fallback-*.js
git status --short
```
