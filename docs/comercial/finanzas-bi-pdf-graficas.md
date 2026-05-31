# Finanzas / BI - Gráficas en PDF

## Objetivo

Se mejora la descarga PDF de `Finanzas / BI` para incluir las gráficas principales del dashboard dentro del reporte exportado.

## Alcance

- El PDF de BI financiero ahora incluye:
  - Gráfico de barras de ingresos vs egresos.
  - Gráfico de línea de resultado neto mensual.
- Las gráficas se generan con `jsPDF` a partir de la misma serie mensual usada por el dashboard.
- No se agregan dependencias externas.
- No se modifica base de datos.
- Se mantiene el nombre de archivo con timestamp.

## Validación sugerida

1. Entrar a `/dashboard/finanzas`.
2. Seleccionar un rango de fechas con datos.
3. Descargar PDF.
4. Confirmar que el PDF muestra cards, gráficas BI y tabla mensual.
5. Validar que ingresos, egresos y resultado coincidan con la pantalla.
