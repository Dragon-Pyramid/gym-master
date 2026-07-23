# Gym Master — i18n ES/EN Final QA — Product Core Categories Hotfix v4c

## Contexto

Durante el QA manual del alta de productos en inglés se comprobó que el formulario estaba localizado, pero las opciones del catálogo core `categoria_producto` seguían mostrando sus nombres persistidos en español.

## Causa

El selector renderizaba directamente `categoria.nombre`. La gobernanza de catálogos core ya existía en `src/utils/coreSeedI18n.ts`, pero todavía no estaba aplicada en esta pantalla.

## Corrección

- Se aplica `translateCoreCatalogName("categoria_producto", ...)` al selector de alta/edición.
- Se aplica el mismo helper al nombre de categoría utilizado por la vista de detalle y los exportables de productos.
- Se conserva como `value` el ID original de la categoría; no cambia ninguna referencia persistida.
- Las categorías personalizadas que no pertenecen al catálogo core conservan exactamente el nombre ingresado por el gimnasio.
- Se corrigen residuos visibles del mismo formulario: `Generar`, `Margen estimado`, `Margen`, `Moneda` y prefijos de ejemplo `Ej:` / `Ex:`.

## Traducciones core esperadas

| Código persistido | Español | Inglés |
|---|---|---|
| `bebidas` | Bebidas | Beverages |
| `suplementos` | Suplementos | Supplements |
| `indumentaria` | Indumentaria | Apparel |
| `accesorios` | Accesorios | Accessories |
| `snacks` | Snacks | Snacks |
| `higiene` | Higiene | Hygiene |
| `otros` | Otros | Other |

## Archivos funcionales

- `src/components/forms/ProductoForm.tsx`
- `src/app/dashboard/productos/page.tsx`
- `src/i18n/commercialUi.ts`

## Fuera de alcance

- No se modifican datos de productos ni categorías.
- No se modifica el hook de catálogos parametrizables.
- No hay cambios de base de datos, migraciones, RLS, RPC, permisos o contratos API.
- No se traducen categorías personalizadas creadas por el gimnasio.

## QA recomendado

1. Abrir `/dashboard/productos` en inglés.
2. Abrir `Add Product` y desplegar `Category`.
3. Confirmar: `Beverages`, `Snacks`, `Supplements`, `Apparel`, `Accessories`, `Hygiene`, `Other`.
4. Cambiar EN → ES sin cerrar el modal y confirmar los nombres españoles.
5. Seleccionar una categoría y crear o editar un producto; confirmar que el ID guardado no cambia.
6. Abrir el detalle y exportar PDF/Excel en inglés para comprobar el nombre localizado.
7. Confirmar que una categoría personalizada conserve su nombre original.
