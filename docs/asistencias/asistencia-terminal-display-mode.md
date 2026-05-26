# Asistencia — Terminal display mode

## Objetivo

Agregar una pantalla de asistencia para monitor externo que permita operar con una sola notebook y una segunda pantalla HDMI.

La pantalla terminal muestra un QR grande para que el socio lo escanee con su celular y registre su asistencia. Cuando el sistema recibe el resultado, reemplaza temporalmente el QR por una pantalla de bienvenida, deuda o bloqueo, y luego vuelve automáticamente al modo espera con QR.

## Ruta

```txt
/dashboard/asistencias/terminal
```

## Uso operativo

- Notebook: dashboard administrativo.
- Monitor externo: terminal de asistencia en pantalla completa.
- Socio: escanea el QR con su celular.

## Comportamiento

### Modo espera

Muestra:

- QR grande.
- Instrucciones para el socio.
- Fecha y hora.
- Actividad reciente.

El QR apunta a:

```txt
/dashboard/control-asistencia?origen=terminal
```

### Modo resultado

Cuando llega un evento de asistencia muestra:

- Bienvenida si el socio está al día.
- Alerta de deuda si debe regularizar.
- Bloqueo si el socio está desactivado.
- Error si no se pudo registrar.

Luego vuelve automáticamente al QR después de algunos segundos.

## Seguridad

La pantalla no muestra sidebar, pagos, usuarios ni datos administrativos. Está pensada como monitor público.

## Notas de despliegue

Para probar con celular, la URL del QR debe ser accesible desde el teléfono. En producción o preview deployado en Vercel funciona mejor que en `localhost`, salvo que el celular tenga acceso a la red local y se configure una URL accesible.
