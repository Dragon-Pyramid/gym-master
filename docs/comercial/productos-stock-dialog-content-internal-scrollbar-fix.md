# Fix scroll interno general en DialogContent

## Objetivo

Corregir modales largos que quedaban cortados en pantallas 1920x1080 o menores, obligando a reducir el zoom del navegador.

## Cambio aplicado

Se reforzó `src/components/ui/dialog.tsx` para que `DialogContent` tenga:

- altura máxima basada en viewport;
- scroll vertical interno en el propio panel del modal;
- `overscroll-contain` para evitar arrastre accidental del fondo;
- `scrollbar-gutter: stable` para reservar espacio del scrollbar;
- botón de cierre sticky para mantenerlo accesible al desplazarse.

## Alcance

Aplica a todos los modales que usan `DialogContent`, incluyendo detalle de producto, movimiento de stock, usuarios, socios, ventas, proveedores, rutinas y dietas.

## Validación sugerida

- Abrir detalle de producto largo en `/dashboard/productos`.
- Verificar que el scroll aparezca en el borde derecho del modal.
- Confirmar que se puede llegar al final del modal sin reducir el zoom del navegador.
- Confirmar que tablas internas con scroll propio siguen funcionando correctamente.
