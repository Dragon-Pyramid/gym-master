# Gym Master - Comercial Mobile Barcode Scanner Realtime v1

## Rama

`feature/comercial-mobile-barcode-scanner-realtime-v1`

## Objetivo

Permitir que el POS/Kiosco use un celular como lector de codigos QR/barra sin comprar hardware dedicado.

## Flujo funcional

1. El cajero abre `Comercial y Stock -> POS / Kiosco`.
2. Presiona `Conectar scanner movil`.
3. Gym Master crea una sesion temporal y muestra un QR de conexion.
4. El celular abre `/mobile-scanner/{token}`.
5. El celular escanea con camara o envia codigo manual.
6. El POS consulta eventos pendientes y agrega el item al carrito cuando corresponde.

## Alcance v1

- Sesion temporal de scanner movil.
- Pantalla publica movil por token.
- Soporte de camara con `BarcodeDetector` cuando el navegador lo permite.
- Carga manual alternativa.
- Resolucion de producto por barcode/SKU.
- Resolucion de QR interno de producto/servicio usando `infraestructura_qr_codigo`.
- Eventos pendientes/procesados para comunicacion celular -> PC.
- POS procesa eventos y agrega productos/servicios al carrito.
- Packs se detectan y quedan marcados para integracion POS avanzada.

## Base de datos privada

Tablas nuevas:

- `comercial_scanner_session`
- `comercial_scanner_event`

La migracion privada no debe commitearse en el repositorio publico.

## Endpoints

- `GET /api/comercial/mobile-scanner?session_id=...`
- `POST /api/comercial/mobile-scanner`
- `GET /api/comercial/mobile-scanner/public/{token}`
- `POST /api/comercial/mobile-scanner/public/{token}`

## Consideraciones

- Algunos navegadores no soportan `BarcodeDetector`; por eso la pantalla movil incluye carga manual.
- La sesion expira por seguridad.
- No se requiere hardware adicional.
- La venta directa de packs como linea unica queda para una etapa posterior, porque `venta_detalle` soporta producto/servicio.
