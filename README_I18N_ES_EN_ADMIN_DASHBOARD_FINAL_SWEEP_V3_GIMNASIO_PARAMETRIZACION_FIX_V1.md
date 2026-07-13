# I18N ES/EN Admin Dashboard Final Sweep V3 - Gimnasio Parametrización Fix V1

## Ruta

- `/dashboard/gimnasio-parametrizacion`

## Archivos modificados

- `src/app/dashboard/gimnasio-parametrizacion/page.tsx`

## Alcance

- Agrega uso local de `useI18n` para la pantalla de datos del gimnasio.
- Traduce labels, headings, ayudas, placeholders, mensajes de carga/éxito/error y estado Stripe.
- Traduce contenido visible de combos de condición fiscal, estado de integración Stripe y modo Stripe sin cambiar los values enviados al backend.
- Ajusta algunos estilos dark mode locales en alertas, preview, avisos y estado Stripe.

## No incluido

- No toca DB.
- No toca endpoints.
- No toca Swagger/OpenAPI.
- No cambia lógica de guardado, upload de Cloudinary ni configuración real de Stripe.
- No traduce contenido persistido de textos legales/documentos; eso queda para el sweep dedicado de exportables/DB i18n.

## Validación sugerida

```bash
cd /e/gym-master-2026/sistema/gym-master
rm -rf .next
npm run build
```

Luego limpiar artefactos PWA si aparecen:

```bash
git checkout -- public/sw.js
rm -f public/fallback-*.js
git status --short
```
