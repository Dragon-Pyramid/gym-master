# Fix — Scroll externo general en modales

Fecha: 2026-05-30  
Rama: `feature/productos-stock-devoluciones-ajustes`

## Motivo

Durante la validación del detalle de producto, el modal quedaba demasiado alto para el viewport cuando incluía historial de precios/costos y movimientos de stock. Aunque algunas tablas internas tenían scroll propio, el contenedor general del modal no permitía recorrer cómodamente el contenido completo sin reducir el zoom del navegador.

## Cambio aplicado

Se ajustó el componente base `src/components/ui/dialog.tsx` para que el viewport del modal tenga un contenedor externo con scroll vertical.

Esto permite que todos los modales basados en `DialogContent` puedan desplazarse cuando su contenido supera el alto disponible de pantalla.

## Alcance

- Aplica a modales de productos, socios, usuarios, ventas, proveedores, rutinas, dietas y demás componentes que usen `DialogContent`.
- No requiere migración de base de datos.
- No modifica lógica de negocio.
- Mantiene el cierre del modal y el overlay.

## Validación recomendada

- Abrir detalle de producto con historial y movimientos de stock.
- Confirmar que el modal puede desplazarse sin reducir zoom del navegador.
- Verificar que el botón cerrar siga accesible.
- Probar modales largos de usuarios, socios y ventas.
