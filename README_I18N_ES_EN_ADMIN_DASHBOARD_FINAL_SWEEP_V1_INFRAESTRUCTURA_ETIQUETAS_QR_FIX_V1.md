# Patch - i18n ES/EN admin dashboard final sweep v1 - infraestructura etiquetas QR fix v1

## Objetivo
Corregir textos hardcodeados y mezclas ES/EN en la pantalla `/dashboard/infraestructura/etiquetas-qr`.

## Cambios principales
- Se incorporó `useI18n()` con helper `tx(es, en)`.
- Se tradujo el hero, formularios, selección A4, lista de códigos, estados vacíos y loading.
- Se tradujeron tipos de destino y subtítulos QR.
- Se adaptó la impresión A4 para mostrar título, botón e indicación en el idioma activo.

## Archivo modificado
- `src/app/dashboard/infraestructura/etiquetas-qr/page.tsx`
