# Gestor evolución física detalle i18n fix v1

## Alcance
- Traducción ES/EN para `/dashboard/gestor-evolucion-fisica/socio/[socioId]`.
- Traducción de textos visibles del dashboard, tabla, modal de vista y etiquetas externas del estudio antes/después.

## Zona protegida
No se modifican coordenadas, SVG paths, transforms, animaciones, lógica de slider, overlay, heatmap ni cálculo de la silueta. En `EvolucionFisicaBeforeAfterStudio.tsx` solo se agregan helpers de traducción y reemplazos de textos visibles.

## Archivos
- `src/app/dashboard/gestor-evolucion-fisica/socio/[socioId]/page.tsx`
- `src/components/dashboard/evolucion-fisica/EvolucionFisicaDashboard.tsx`
- `src/components/dashboard/evolucion-fisica/EvolucionFisicaBeforeAfterStudio.tsx`
- `src/components/tables/EvolucionSocioTable.tsx`
- `src/components/modal/EvolucionFisicaViewModal.tsx`
