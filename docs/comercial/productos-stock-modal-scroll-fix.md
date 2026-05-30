# Fix UX — Scroll general en modales

**Fecha:** 2026-05-30  
**Rama:** `feature/productos-stock-devoluciones-ajustes`

## Objetivo

Evitar que modales extensos obliguen a reducir el zoom del navegador para poder ver todo el contenido o acceder a secciones inferiores.

## Alcance

Se ajustó el componente base `DialogContent` para que todos los modales que usan `src/components/ui/dialog.tsx` tengan:

- altura máxima basada en viewport;
- scroll vertical cuando el contenido supera la altura visible;
- comportamiento consistente en formularios, detalles y modales extensos;
- compatibilidad con modales que ya tienen clases específicas de tamaño.

## Archivo modificado

- `src/components/ui/dialog.tsx`

## Validación sugerida

- Abrir detalle de producto con historial de precios/costos y movimientos de stock.
- Abrir modal de movimiento de stock.
- Abrir modales grandes de socios, usuarios, ventas, rutinas, dietas y proveedores.
- Confirmar que no hace falta reducir zoom del navegador.
- Confirmar que el botón cerrar sigue accesible.
- Confirmar que el scroll queda dentro del modal.

## Impacto

No requiere migración ni cambios de API. Es un ajuste visual/UX transversal.
