# I18N ES/EN Socio Dashboard Final Sweep v1 - Mensajes Fix v1

## Ruta

- `/dashboard/mensajes`

## Alcance

- Traduce la pantalla de mensajes del socio en ES/EN.
- Corrige contenido visible del combo de categorías según idioma:
  - Consulta / Query
  - Pregunta / Question
  - Reclamo / Complaint
  - Crítica / Feedback
  - Sugerencia / Suggestion
  - Otro / Other
- Traduce hero, KPI cards, formulario, placeholders, ayudas, validaciones, toasts, historial, estado vacío y cards de mensajes.
- Traduce estados dinámicos visibles: pendiente, leído, respondido y cerrado.
- Mejora dark mode local en fondo, cards, inputs, textarea, select, empty state y botón principal.

## Fuera de alcance

- No toca DB.
- No toca endpoints.
- No toca Swagger/OpenAPI.
- No toca lógica de envío, historial ni email.

## Archivos modificados

- `src/app/dashboard/mensajes/page.tsx`

## Validación sugerida

```bash
cd /e/gym-master-2026/sistema/gym-master
rm -rf .next
npm run build
```

Luego limpiar PWA:

```bash
git checkout -- public/sw.js
rm -f public/fallback-*.js
```
