# Pagos - Recibo PDF verificable - Fix de diseño

## Objetivo

Corregir detalles visuales detectados en el recibo PDF verificable de pagos.

## Cambios aplicados

- Logo del encabezado:
  - mantiene proporción cuadrada para evitar deformación/ovalado;
  - se renderiza en blanco sobre fondo azul oscuro para mejorar contraste.
- Datos del socio:
  - se reordena el bloque en vertical: nombre, ID socio y email;
  - se corrige el mapeo server-side para propagar `socio.email` al PDF.
- Detalle del pago:
  - se aumenta la altura de la card para evitar que el badge de estado pise contenido.
- Verificación del comprobante:
  - se ajusta ancho interno, texto, tamaño de fuente y wrapping;
  - el código de verificación queda separado y no pisa el texto descriptivo.

## Archivos modificados

- `src/utils/pagoReciboPdf.ts`
- `src/services/server/pagoServerService.ts`

## Validación sugerida

1. Ejecutar `npm run build`.
2. Restaurar archivos PWA generados si corresponde.
3. Descargar un recibo desde `/dashboard/pagos`.
4. Verificar visualmente:
   - logo blanco y no deformado;
   - datos del socio ordenados;
   - email visible si existe;
   - badge `Pagado` sin solapar texto;
   - bloque QR sin desbordes.
