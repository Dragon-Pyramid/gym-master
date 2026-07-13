# i18n ES/EN socio dashboard final sweep v1 — Dietas fix v1

## Ruta

- `/dashboard/dietas`

## Alcance

- Traducción ES/EN de la pantalla de dietas del socio.
- Traducción de header, hero, buscador, cards KPI, tabla desktop, cards mobile y estados.
- Traducción de datos visibles persistidos de presentación, como nombres de planes automáticos y objetivos comunes.
- Mejora puntual de dark mode en cards, tabla, vacíos y alertas.

## Archivos modificados

- `src/app/dashboard/dietas/page.tsx`
- `src/components/tables/DietaHistorial.tsx`

## Notas técnicas

- No modifica DB, endpoints, Swagger/OpenAPI ni lógica de dietas.
- No modifica generación real de PDF ni exportables internos.
- Los datos persistidos siguen intactos; la traducción se aplica solo en capa de presentación.
