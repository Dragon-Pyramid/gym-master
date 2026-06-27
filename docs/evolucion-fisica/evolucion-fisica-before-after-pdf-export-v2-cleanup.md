# Evolución Física — PDF Export v2 Cleanup

## Objetivo

Ajustar el PDF de evolución física según QA visual:

1. Quitar del reporte la sección `Estudio visual antes/después`.
2. Renombrar la sección final a `Informe biométrico`.
3. Cambiar el detalle debajo del título por:
   `Comparativa de métricas de composición corporal basada en registros reales del socio.`
4. Quitar las imágenes de silueta dentro de los cards biométricos, manteniendo los cards y las métricas.

## Archivos modificados

- `src/utils/evolucionFisicaPdf.ts`
- `src/app/dashboard/evolucion-fisica/page.tsx`
- `src/app/dashboard/gestor-evolucion-fisica/socio/[socioId]/page.tsx`

## Cambios técnicos

- Se elimina la llamada a `addBeforeAfterVisualSection(...)`.
- Se elimina la captura `captureBeforeAfterStudioSnapshots()` desde las pantallas de exportación.
- `addBiometricCard(...)` ya no recibe ni renderiza imágenes de silueta.
- Las métricas biométricas se mantienen dentro de los cards de `Antes` y `Ahora`.
- El encabezado `Visualización biométrica` pasa a `Informe biométrico`.

## Validación sugerida

1. Generar PDF desde `/dashboard/evolucion-fisica`.
2. Generar PDF desde `/dashboard/gestor-evolucion-fisica/socio/[socioId]`.
3. Confirmar que no aparece la página/sección `Estudio visual antes/después`.
4. Confirmar que la sección final se titula `Informe biométrico`.
5. Confirmar que los cards `Antes` y `Ahora` no muestran siluetas.
6. Confirmar que las métricas de los cards siguen visibles.
