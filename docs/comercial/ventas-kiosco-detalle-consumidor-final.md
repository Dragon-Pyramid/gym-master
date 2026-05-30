# Ventas de kiosco con detalle real y consumidor final

**Rama sugerida:** `feature/ventas-kiosco-detalle-consumidor-final`  
**Fecha:** 2026-05-29  
**Proyecto:** Gym Master

## Objetivo

Rediseñar el módulo de ventas comerciales/kiosco para que una venta deje de ser solo socio, fecha y total, y pase a registrar una cabecera comercial con múltiples ítems reales.

## Alcance implementado

- Venta a socio, visitante o consumidor final.
- Consumidor final sin obligación de asociar socio.
- Cabecera con tipo de cliente, nombre/documento opcional, fecha, método de pago, estado, observaciones y código de comprobante.
- Múltiples ítems por venta.
- Ítems de tipo producto o servicio.
- Precio unitario congelado al momento de la venta.
- Descuento por línea.
- Total calculado desde los detalles.
- Descuento automático de stock para productos.
- Registro de movimiento de stock.
- Anulación lógica de ventas sin borrar histórico.
- Listado mejorado con cliente, detalle de ítems, método, estado y total.
- Vista detalle de venta con tabla de ítems.
- Exportación Excel mejorada.
- Normalización de inputs de precio/stock de productos para evitar ceros iniciales y decimales accidentales.
- Corrección de respuesta de `/api/proveedores` para devolver `{ data: proveedores }`.

## Base de datos

La evolución de base se deja como script privado/local ignorado por Git:

```txt
database/private/202605291930_ventas_kiosco_detalle_consumidor_final.sql
```

Validación local privada:

```txt
database/private/validar_ventas_kiosco_detalle_consumidor_final.sql
```

No se deben commitear estos SQL en el repo público.

## Endpoints impactados

- `GET /api/ventas`
- `POST /api/ventas`
- `PUT /api/ventas`
- `DELETE /api/ventas`
- `GET /api/ventas/{id}`
- `GET /api/ventas_detalles`
- `POST /api/ventas_detalles`
- `PUT /api/ventas_detalles`
- `DELETE /api/ventas_detalles`
- `GET /api/proveedores`

## Pendientes derivados

- Devoluciones parciales/totales con reposición o merma de stock.
- Ticket/comprobante PDF profesional.
- Reportes PDF comerciales.
- Compras a proveedores y reposición de stock.
- Servicios adicionales con reportes específicos.
- Historial completo de precios y costos.
- BI financiero de ingresos/egresos.
