# Productos, stock y kiosco del gimnasio

## Objetivo

Crear la primera base del módulo comercial de Gym Master para gestionar productos, stock y ventas internas del gimnasio.

El módulo está pensado para operar como kiosco/tienda del gimnasio, permitiendo vender productos a socios o consumidores finales externos, controlar stock, detectar productos con bajo inventario y preparar la integración futura con compras, proveedores, devoluciones, servicios adicionales y BI financiero.

## Alcance implementado en esta etapa

- Nueva entrada de menú **Comercial / Kiosco**.
- Nueva pantalla `/dashboard/comercial` con resumen operativo.
- Métricas iniciales de productos activos, stock crítico, inventario estimado y ventas registradas.
- Accesos rápidos a Productos, Ventas, Proveedores y Servicios.
- Sección de productos que requieren reposición.
- Mejora de la pantalla de Productos:
  - cards de resumen;
  - filtro por activos, stock crítico, sin stock e inactivos/discontinuados;
  - tabla con estado comercial del producto;
  - desactivación sin borrar histórico;
  - exportación Excel actualizada;
  - selector de proveedor cuando existen proveedores cargados.
- Documentación de la evolución comercial/ERP.

## Criterio de stock crítico

En esta primera versión se usa un mínimo operativo base de 5 unidades para detectar stock crítico.

Ejemplo:

```txt
Producto: Proteína Whey 1 kg
Stock actual: 5
Estado: Stock crítico
Acción esperada: reponer stock antes de quedarse sin producto.
```

Más adelante, cuando se aplique la evolución privada de base de datos, el mínimo deberá ser parametrizable por producto o categoría.

## Productos discontinuados o inactivos

La baja de producto no debe eliminar información histórica. En esta etapa se usa la baja lógica existente (`activo = false`) y se muestra como:

```txt
Inactivo / discontinuado
```

Esto permite conservar ventas, reportes y trazabilidad.

## Ventas a socios y consumidores finales

El módulo comercial debe contemplar que una venta puede ser realizada a:

- socio;
- visitante;
- consumidor final externo.

La estructura actual todavía depende del flujo existente de ventas. La evolución posterior deberá permitir ventas sin socio obligatorio, emisión de ticket y mejor detalle de productos/servicios.

## Devoluciones, recuento físico y mermas

Quedan definidas como siguientes etapas:

- devolución de producto vendido;
- reintegro a stock si el producto vuelve en condiciones vendibles;
- registro como merma si no vuelve al inventario;
- recuento físico de stock;
- ajuste por diferencia entre stock real y stock del sistema;
- motivo del ajuste;
- usuario responsable;
- auditoría.

## Integración financiera futura

Las ventas de productos y servicios adicionales deberán alimentar el módulo de ingresos.

Las compras, reposiciones, gastos generales, mantenimiento, equipamiento, proveedores y sueldos deberán alimentar egresos.

La información final deberá permitir BI mensual de:

- ingresos por cuotas;
- ingresos por ventas;
- ingresos por servicios adicionales;
- egresos por compras;
- egresos por gastos generales;
- egresos por sueldos;
- margen comercial;
- stock crítico;
- rotación de productos;
- devoluciones y mermas.

## Seguridad del repositorio

Los cambios de base de datos relacionados con este módulo deben mantenerse fuera del repositorio público cuando sean sensibles.

Flujo recomendado:

1. Crear SQL/migraciones en ubicación local ignorada por Git.
2. Validar primero en Supabase local.
3. Aplicar remoto solo después de validar.
4. Conservar scripts reales en repositorio privado o carpeta local no versionada.
5. Versionar en este repo solo documentación funcional no sensible.

## Corrección de proveedor visible

Los listados, detalles y exportaciones de productos deben mostrar el nombre o razón social del proveedor, no el UUID interno. El UUID queda reservado para relación técnica de base de datos.

## Historial de precios y costos

Para operación real en Argentina no conviene pisar únicamente el precio del producto. El producto puede conservar un precio vigente para operar rápido, pero cada cambio de precio/costo debe quedar trazado en una estructura histórica privada de base de datos.

Campos recomendados para una futura migración privada:

- producto_id;
- costo_anterior y costo_nuevo;
- precio_venta_anterior y precio_venta_nuevo;
- moneda_referencia, por ejemplo ARS o USD;
- cotizacion_usada cuando el precio se calcule tomando dólar como referencia;
- motivo del cambio: inflación, reposición, dólar, promoción, ajuste manual;
- fecha de vigencia;
- usuario responsable;
- observaciones.

Reglas recomendadas:

- cada venta debe guardar el precio unitario vendido en ese momento;
- cada compra/reposición debe guardar el costo real de compra;
- cada cambio de precio debe generar historial;
- no recalcular ventas anteriores con el precio vigente nuevo;
- usar el historial para BI de margen, rentabilidad, reposición e inflación.

