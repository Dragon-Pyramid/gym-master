# Gym Master — Historial de precios y costos de productos

## Objetivo

El módulo comercial del gimnasio debe conservar trazabilidad de los cambios de precios y costos de los productos. En contextos con inflación o precios de referencia en dólar, como Argentina, no es recomendable pisar el precio sin conservar historial.

## Criterio recomendado

El producto puede mantener campos vigentes para operación rápida:

- precio de venta actual;
- costo actual;
- stock actual;
- proveedor actual.

Pero cada cambio relevante debe generar un registro histórico para auditoría, reportes y BI.

## Datos recomendados para historial

Una futura migración privada debería contemplar una estructura similar a `producto_precio_historial` con:

- producto_id;
- precio_costo_anterior;
- precio_costo_nuevo;
- precio_venta_anterior;
- precio_venta_nuevo;
- moneda_referencia: ARS, USD u otra;
- cotizacion_usada cuando el precio se calcule desde dólar;
- margen estimado;
- fecha de vigencia;
- motivo del cambio: inflación, reposición, dólar, promoción, ajuste manual;
- usuario responsable;
- observaciones;
- timestamps de auditoría.

## Reglas de negocio

- Cada venta debe guardar el precio unitario real vendido en ese momento.
- Cada compra/reposición debe guardar el costo real de compra.
- Cambiar el precio actual del producto no debe modificar ventas históricas.
- Cambiar el costo actual del producto no debe modificar compras históricas.
- El historial debe permitir analizar margen, rentabilidad, rotación, inflación y reposición.

## Casos de uso

Preguntas que el sistema debería poder responder:

- ¿A cuánto compré este producto hace tres meses?
- ¿A cuánto lo vendía antes del último aumento?
- ¿Cuál era el margen al momento de la venta?
- ¿Qué productos aumentaron más?
- ¿Qué proveedor modificó más sus precios?
- ¿Conviene reponer este producto con el costo actual?

## Relación con compras y ventas

El historial de precios debe complementarse con:

- compras/reposiciones de stock;
- ventas y tickets;
- devoluciones;
- ajustes de stock;
- mermas;
- BI financiero.

## Seguridad del repositorio

La migración SQL real de esta estructura no debe versionarse en el repositorio público. Debe mantenerse como script privado/local o en un repositorio privado de base de datos.
