# Pagos - recibo PDF verificable

## Objetivo

Agregar al módulo de pagos un recibo PDF descargable y verificable, con membrete visual de Gym Master, datos del socio, detalle de cuota abonada, período cubierto y código QR.

## Alcance implementado

- Generación de recibo PDF desde el listado de pagos.
- Botón de descarga de recibo en la tabla de pagos.
- Botón de descarga dentro del modal de detalle del pago.
- Código visible de verificación.
- Código QR embebido en el PDF.
- Endpoint público de verificación limitada:
  - `GET /api/pagos/[id]/verificar?codigo=...`
- Swagger/OpenAPI actualizado para documentar el nuevo endpoint.

## Datos incluidos en el PDF

- Logo/membrete Gym Master.
- Nombre del socio.
- ID del socio.
- Email del socio si está disponible.
- Cuota abonada.
- Período cubierto desde/hasta.
- Meses cubiertos.
- Fecha de pago.
- Fecha de vencimiento.
- Medio de pago.
- Estado del pago.
- Monto abonado.
- Registrado por.
- Observaciones si existen.
- Código de verificación.
- QR de verificación.

## Criterio de verificación

El código se genera de forma determinística a partir del ID del pago.

Ejemplo:

```txt
GM-PAGO-2D2A45DF-CA1111
```

El QR apunta al endpoint de verificación y permite validar que:

- el código corresponde al pago;
- el pago existe;
- el comprobante está asociado a un socio/cuota/monto/estado real del sistema.

## Seguridad y alcance

El endpoint de verificación devuelve un resumen limitado del pago. No modifica datos y no reemplaza procesos administrativos internos.

## Archivos modificados/agregados

- `src/utils/pagoReciboCodigo.ts`
- `src/utils/pagoReciboPdf.ts`
- `src/app/api/pagos/[id]/verificar/route.ts`
- `src/app/dashboard/pagos/page.tsx`
- `src/components/tables/PagoTable.tsx`
- `src/components/modal/PagoViewModal.tsx`
- `src/interfaces/pago.interface.ts`
- `src/lib/swagger/openApiSpec.ts`

## Validación sugerida

1. Entrar como administrador a `/dashboard/pagos`.
2. Descargar un recibo desde la tabla.
3. Descargar un recibo desde el modal de detalle.
4. Verificar que el PDF incluya QR, código, datos del socio, cuota, período, monto y estado.
5. Abrir el QR o endpoint de verificación.
6. Revisar `/swagger` y confirmar el endpoint `GET /api/pagos/{id}/verificar`.
