# i18n ES/EN commercial modules v1

## Objetivo
Completar una primera pasada de internacionalización ES/EN sobre la experiencia comercial visible de Gym Master.

## Alcance
- Dashboard comercial principal (`/dashboard/comercial`).
- POS/Kiosco y scanner móvil.
- Caja/Cashup.
- Stock ledger y alertas de reposición.
- Compras, proveedores y reposición.
- Servicios, packs, promociones y cupones.
- Códigos, QR y etiquetas comerciales.
- BI de packs/promociones.

## Implementación
- Se agrega `src/i18n/commercialUi.ts` como helper de traducción de superficie para textos comerciales.
- Se integra `useI18n()` en páginas comerciales para resolver ES/EN sin tocar rutas, endpoints ni DB.
- Se traducen títulos, subtítulos, métricas, botones, placeholders, toasts, empty states y textos operativos principales.
- Se normalizan estados y labels frecuentes como `Crítico`, `Sin stock`, `Bajo mínimo`, métodos de pago y acciones de POS.

## Restricciones
- No se modifican modelos ni tablas.
- No se agregan endpoints.
- No se modifica Swagger/OpenAPI.
- Los datos libres cargados por administración se preservan tal como están en base de datos.
