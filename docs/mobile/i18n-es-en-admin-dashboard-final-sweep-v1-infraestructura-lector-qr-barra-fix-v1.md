# i18n ES/EN admin dashboard final sweep v1 — Infraestructura lector QR/barra fix v1

## Ruta
- `/dashboard/infraestructura/lector-qr-barra`

## Objetivo
Cerrar textos residuales en español y Spanglish visibles cuando el idioma activo es Inglés.

## Cambios
- Se agregó `useI18n()` y helper local `tx(es, en)`.
- Se tradujo el header, hero, descripción, formularios, errores, estados vacíos y resultado.
- Se tradujo el mensaje de `BarcodeDetector` no soportado.
- Se agregó helper `targetTypeLabel()` para mostrar destinos dinámicos como `Building asset`, `Building sector`, `Equipment`, `Product`, `Service` o `Pack`.

## Sin cambios
- No modifica DB.
- No modifica endpoints.
- No modifica Swagger/OpenAPI.
- No modifica la lógica del scanner ni la resolución de QR/barcodes.
