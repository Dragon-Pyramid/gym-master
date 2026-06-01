# Empleados Sueldos — Recibo A5 y branding futuro

## Alcance del fix

Se ajusta la generación del recibo individual de sueldo para que use formato A5 vertical.

## Motivo

El recibo de sueldo no es un reporte administrativo general sino un comprobante individual. El formato A5 vertical mejora la lectura, impresión y entrega del documento.

## Branding y consideración legal

Los empleados registrados pertenecen al gimnasio cliente, no a Dragon Pyramid ni a Gym Master. Por este motivo, el recibo individual no debe quedar conceptualmente atado al branding propietario de Gym Master como empleador.

En esta etapa se deja preparado el generador PDF para permitir branding por documento mediante parámetros.

En una feature futura de parametrización del gimnasio, el recibo deberá tomar automáticamente:

- nombre del gimnasio cliente;
- logo del gimnasio cliente;
- datos fiscales o legales del gimnasio si corresponden;
- texto de pie legal configurable.

## Archivos modificados

- `src/utils/commercialReportPdf.ts`
- `src/app/dashboard/empleados-sueldos/page.tsx`

## Validación sugerida

1. Ir a `/dashboard/empleados-sueldos`.
2. Descargar recibo PDF individual.
3. Confirmar formato A5 vertical.
4. Confirmar que el nombre del archivo no duplique timestamp.
5. Confirmar que el listado general de sueldos conserva PDF A4 horizontal.
