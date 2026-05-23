# Pagos - Recibo PDF descargable desde Mi cuenta del socio

## Objetivo

Extender la feature de recibo PDF verificable para que el socio también pueda descargar sus propios comprobantes desde su historial de pagos.

## Alcance

Se agrega el botón **Recibo** en:

```txt
/dashboard/mi-cuenta/historial-pagos
```

El socio puede descargar el mismo recibo PDF verificable que utiliza administración, con:

- membrete Gym Master;
- datos del socio;
- detalle del pago;
- período cubierto;
- monto abonado;
- medio de pago;
- estado;
- código verificable;
- QR de verificación.

## Seguridad

El endpoint `/api/mi-cuenta/pagos` continúa filtrando los pagos por el socio autenticado:

```txt
.eq('socio_id', socioId)
```

Por lo tanto, el socio solo recibe sus propios pagos y el botón de recibo se genera únicamente con los datos de ese historial.

## Cambios técnicos

### Frontend

Archivo:

```txt
src/app/dashboard/mi-cuenta/historial-pagos/page.tsx
```

Cambios:

- importa `descargarPagoReciboPdf`;
- agrega acción `handleDownloadReceipt`;
- agrega columna **Recibo**;
- agrega botón de descarga por cada pago.

### API

Archivo:

```txt
src/app/api/mi-cuenta/pagos/route.ts
```

Cambios:

- agrega datos del socio en la respuesta;
- conserva el filtro por socio autenticado;
- mantiene compatibilidad con el historial existente.

### Swagger

Archivo:

```txt
src/lib/swagger/openApiSpec.ts
```

Cambio:

- se actualiza la descripción de `GET /api/mi-cuenta/pagos` indicando que la respuesta permite generar recibo PDF verificable desde Mi cuenta.

## Validación funcional

1. Iniciar sesión como socio.
2. Entrar a `/dashboard/mi-cuenta/historial-pagos`.
3. Ver la columna **Recibo**.
4. Descargar el recibo PDF de un pago.
5. Verificar que el PDF muestre nombre, ID, email, cuota, período, monto, estado y QR.
6. Escanear el QR o abrir la URL de verificación.
