# Gym Master – i18n commercial modules dark hero contrast fix v2

## Objetivo
Corregir de forma puntual las hero cards comerciales que quedaban blancas en modo oscuro y no permitían leer correctamente títulos, descripciones y botones.

## Alcance
- Caja / Cashup
- Compras / Reposición
- Servicios / Packs / Promociones
- Códigos / QR / Etiquetas
- BI Packs / Promos

## Cambios
- Reemplazo de hero surfaces `bg-white` por superficies dark-friendly con gradiente oscuro.
- Botones secundarios del hero adaptados a fondos oscuros.
- Textos descriptivos del hero con contraste suficiente en dark mode.
- Se mantienen traducciones ES/EN comerciales acumuladas en `commercialUi.ts`.

## Restricciones
- No toca DB.
- No toca endpoints.
- No modifica Swagger/OpenAPI.
