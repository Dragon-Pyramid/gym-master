# Comercial Stock Alerts Final v1

## Rama

`feature/comercial-stock-alerts-final-v1`

## Objetivo

Consolidar el módulo de stock comercial como un centro de alertas operativas para detectar productos sin stock, críticos o bajo mínimo antes de que impacten ventas en POS/Kiosco.

## Alcance

- Se pulió `/dashboard/comercial/stock-ledger` como tablero de alertas finales de stock.
- Se agregó header ejecutivo para alertas comerciales.
- Se agregaron alertas prioritarias por producto.
- Se agregó cálculo de unidades sugeridas para reposición.
- Se agregó indicador de salud de inventario.
- Se agregaron filtros por estado de stock.
- Se agregó acción rápida para preparar ingreso de stock desde una alerta.
- Se corrigió el shell vertical con `Header / Contenido / Footer` para evitar espacio blanco después del footer.
- Se mejoró contraste claro/oscuro.

## Reglas funcionales

- `sin_stock` y `critico` se muestran como alertas prioritarias.
- `bajo_minimo` se muestra como advertencia de reposición.
- `ok` queda disponible como filtro para control operativo.
- La acción `Preparar ingreso` solo carga el formulario de movimiento; no registra stock automáticamente.
- El operador debe confirmar ubicación, cantidad y motivo antes de registrar el movimiento.

## Seguridad y datos

No se agregan migraciones ni se modifica estructura de base de datos. La feature reutiliza datos existentes del stock ledger comercial.

## QA sugerido

1. Entrar como admin a `/dashboard/comercial/stock-ledger`.
2. Confirmar header de alertas de stock.
3. Revisar alertas prioritarias.
4. Probar filtros `Sin stock`, `Crítico`, `Bajo mínimo` y `OK`.
5. Probar búsqueda por producto, SKU o barcode.
6. Presionar `Preparar ingreso` desde una alerta.
7. Confirmar que el formulario queda precargado para compra/ingreso.
8. Registrar un movimiento válido.
9. Confirmar que se actualizan métricas y alertas.
10. Probar modo claro/oscuro.
11. Probar F12 mobile y desktop.
12. Confirmar que no hay scroll horizontal ni espacio blanco después del footer.
