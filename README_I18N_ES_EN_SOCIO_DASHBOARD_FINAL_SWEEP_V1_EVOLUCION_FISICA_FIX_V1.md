# I18N ES/EN Socio Dashboard Final Sweep v1 - Evolución Física Fix v1

## Ruta

- `/dashboard/evolucion-fisica`

## Alcance

- Traducción ES/EN de pantalla socio de evolución física.
- Traducción del formulario de registro de medidas, incluyendo secciones, labels, placeholders, opciones de combos y botones.
- Traducción del panel RAG Coach de evolución física, prompts, placeholders, estados y secciones de resultado.
- Traducción de textos visibles del historial/tabla y búsqueda.
- Mejora local de dark mode para cards, formulario, panel RAG, inputs/selects/textarea y estados.

## Importante

- No toca DB.
- No toca endpoints.
- No toca Swagger/OpenAPI.
- No toca la lógica de registro, consulta, PDF, Excel ni RAG.
- No toca la silueta, animaciones, transforms, coordenadas, before/after, heatmap ni componentes visuales protegidos de evolución física.

## Archivos modificados

- `src/app/dashboard/evolucion-fisica/page.tsx`
- `src/components/forms/EvolucionSocioForm.tsx`
- `src/components/dashboard/evolucion-fisica/EvolucionFisicaRagCoachPanel.tsx`
- `src/components/tables/EvolucionSocioTable.tsx`

## QA sugerido

1. Abrir `/dashboard/evolucion-fisica` con idioma EN.
2. Validar hero, botón New evolution, formulario Register measurements y combos Body type / Reference sex.
3. Validar labels de medidas: torso, arms/legs, body composition, notes, Cancel/Register.
4. Validar panel Physical evolution RAG Coach y placeholders.
5. Validar dark mode: cards, form, inputs, selects, textarea, RAG panel e historial.
6. Confirmar que no cambió la lógica de registro ni visuales protegidos.
