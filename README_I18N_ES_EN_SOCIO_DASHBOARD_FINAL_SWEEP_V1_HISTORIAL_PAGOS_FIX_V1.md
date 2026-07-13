# I18N ES/EN - Socio Dashboard Final Sweep V1 - Historial de pagos Fix V1

## Alcance

Pantalla: `/dashboard/mi-cuenta/historial-pagos`

## Cambios

- Traducción ES/EN del encabezado, hero, KPIs, bloque de último comprobante y detalle de pagos.
- Traducción de tabla desktop y cards mobile: fecha de pago, cuota, período, meses, método, estado, monto y recibo.
- Traducción de estados/métodos visibles: `Pagado/Pendiente/Cancelado`, `Efectivo/Transferencia/Stripe`.
- Traducción defensiva de descripciones dinámicas frecuentes de cuotas, por ejemplo `Cuota mensual` -> `Monthly fee`.
- Traducción de empty/loading states, toasts y títulos de descarga.
- Se mantiene intacta la lógica de pagos, generación de recibos PDF, endpoints y modelos.

## No incluido

- No se traducen internamente los PDFs/recibos generados; eso queda para el sweep específico de exportables.
- No se modifica DB, API Routes, Swagger/OpenAPI ni lógica de negocio.

## Validación sugerida

```bash
npm run build
```

QA manual en ES/EN + light/dark:

- `/dashboard/mi-cuenta/historial-pagos`
- Hero y KPIs.
- Último comprobante disponible.
- Tabla desktop y cards mobile.
- Botones de recibo.
- Empty/loading states si corresponde.
