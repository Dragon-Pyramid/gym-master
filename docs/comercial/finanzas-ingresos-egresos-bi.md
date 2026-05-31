# Feature: Finanzas / BI — Ingresos y Egresos

## Rama

`feature/finanzas-ingresos-egresos-bi`

## Objetivo

Consolidar un tablero financiero operativo para Gym Master que permita visualizar ingresos, egresos, resultado neto y compromisos pendientes usando los datos reales ya disponibles del sistema.

## Alcance implementado

- Nueva pantalla `/dashboard/finanzas`.
- Nuevo endpoint `GET /api/finanzas/dashboard-bi`.
- Integración en sidebar como `Finanzas / BI`.
- Integración en `/dashboard/comercial` con botón y card de acceso.
- Filtro por rango de fechas desde/hasta.
- Métricas principales:
  - ingresos totales,
  - egresos totales,
  - resultado neto,
  - compromisos pendientes.
- Serie mensual con:
  - ingresos por cuotas,
  - ingresos por ventas,
  - ingresos por servicios vendidos,
  - egresos por compras,
  - egresos por gastos,
  - resultado neto.
- Gráficas con evolución mensual.
- Resúmenes por categoría de ingresos, egresos y pendientes/vencidos.
- Exportación Excel con timestamp.
- Descarga PDF membretada con timestamp.
- Swagger/OpenAPI actualizado.

## Fuentes de datos usadas

- `pago`: ingresos por cuotas/membresías pagadas.
- `venta`: ingresos por ventas activas pagadas.
- `venta_detalle`: identificación de servicios vendidos cuando está disponible.
- `compra`: egresos por compras pagadas y compromisos por compras pendientes.
- `otros_gastos`: egresos pagados y compromisos por gastos pendientes/vencidos.

## Criterio financiero aplicado

- Ingresos: pagos con estado `pagado` y ventas activas no anuladas con estado `pagada`.
- Egresos realizados: compras `pagada` y gastos `pagado`.
- Compromisos: compras `pendiente`, gastos `pendiente` y gastos `vencido`.
- Ventas de servicios se reportan como subcategoría informativa de las ventas, sin duplicar el total de ingresos.

## Observaciones técnicas

Esta feature no requiere migración porque consume tablas existentes. El endpoint realiza agregación en la capa API y devuelve una estructura consolidada para frontend.

## Validación sugerida

1. Entrar a `/dashboard/finanzas`.
2. Validar que carguen cards financieros.
3. Cambiar rango de fechas y actualizar.
4. Revisar gráficos de ingresos/egresos y resultado neto.
5. Verificar resumen mensual.
6. Descargar PDF.
7. Exportar Excel.
8. Confirmar que el nombre de archivos incluye fecha y hora.
9. Abrir desde `/dashboard/comercial`.
10. Validar acceso desde sidebar.
