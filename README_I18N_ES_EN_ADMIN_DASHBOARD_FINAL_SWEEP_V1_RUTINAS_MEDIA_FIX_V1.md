# I18N ES/EN Admin Dashboard Final Sweep v1 - Rutinas Media Fix v1

## Alcance
- Ruta: `/dashboard/rutinas/media`.
- Traduce UI fija ES/EN del catálogo visual de ejercicios/media.
- Mejora dark mode local del módulo para que no quede como una pantalla light dentro del dashboard negro.

## No toca
- DB.
- Endpoints/API.
- Swagger/OpenAPI.
- Lógica de Cloudinary, YouTube, fallback, importación, equivalencias o RAG.
- Nombres de ejercicios persistidos en DB.

## Archivo modificado
- `src/app/dashboard/rutinas/media/page.tsx`

## QA sugerido
- Revisar `/dashboard/rutinas/media` en ES y EN.
- Revisar dark mode: métricas, cards, formularios, tabla, panel derecho, botones y badges.
- Confirmar que los nombres de ejercicios siguen viniendo de DB sin traducirse temporalmente.
- Ejecutar `npm run build`.
