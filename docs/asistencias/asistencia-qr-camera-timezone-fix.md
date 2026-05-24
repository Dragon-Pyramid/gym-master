# Fix - Asistencia QR: cámara móvil y hora local

## Objetivo

Corregir dos observaciones detectadas durante la prueba deployada en Vercel:

1. Las asistencias se registraban con diferencia de +3 horas por usar hora del servidor/UTC.
2. En móvil, el lector QR detectaba el código, pero la previsualización de cámara quedaba como cuadro gris.

## Cambios

### Hora local Argentina

Se actualiza `src/services/asistenciaService.ts` para registrar fecha y hora usando la zona horaria:

```txt
America/Argentina/Buenos_Aires
```

Esto impacta en:

- fecha del QR diario;
- validación de fecha del QR;
- `hora_ingreso` al crear asistencia;
- expiración diaria del QR en horario local Argentina.

### Preview del lector QR

Se ajusta `src/components/ui/RegistrarAsistenciaQR.tsx` para:

- forzar estilos sobre los elementos internos `section`, `video` y `canvas` del lector;
- usar `facingMode: { ideal: 'environment' }`;
- remount del lector al presionar **Reintentar**;
- separar mensajes de cámara de errores funcionales de asistencia.

## Alcance

No se cambia la librería `react-qr-reader` en esta rama porque el escaneo ya funciona.  
Si el preview sigue gris en algunos navegadores Android/Chrome, el próximo paso recomendado es una rama específica para reemplazar o encapsular el lector QR con una implementación basada en `getUserMedia` + detector QR.

## Validación sugerida

1. Deploy en Vercel.
2. Abrir dashboard admin y QR del día.
3. Escanear desde celular.
4. Confirmar que la asistencia se registra.
5. Confirmar que la hora nueva coincide con hora Argentina.
6. Confirmar si la previsualización de cámara ya se muestra o si continúa gris.
