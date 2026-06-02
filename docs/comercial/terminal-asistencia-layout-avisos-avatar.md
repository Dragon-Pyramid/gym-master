# Terminal de asistencia: layout 50/50, avisos grandes y avatares

## Feature
`feature/notificaciones-admin-base`

## Objetivo
Mejorar la pantalla `/dashboard/asistencias/terminal` para monitores externos de 21 a 23 pulgadas.

## Cambios
- La pantalla divide el área principal en dos columnas equivalentes en desktop:
  - card izquierda: QR e instrucciones de asistencia;
  - card derecha: actividad reciente / avisos de Terminal.
- El panel derecho gana ancho para que las promociones y avisos temporizados se vean más grandes.
- Los avisos conservan relación visual 5:4 y usan textos con estilo neón/glow.
- Cada registro reciente de asistencia muestra avatar del socio.
- Si el socio no tiene avatar, se muestra el logo de Gym Master como fallback.
- El QR permanece siempre visible y la publicidad sigue cediendo prioridad cuando ingresa un socio.

## Criterio UX
La Terminal está pensada para pantallas LED/monitor externo, por eso el contenido debe ser legible a distancia. El panel derecho debe alternar entre actividad reciente y avisos sin ocultar nunca el QR.
