# i18n ES/EN commercial final sweep proveedores loading state fix v11

## Objetivo
Mejorar el estado de carga de `/dashboard/proveedores`.

## Problema
Durante la carga de proveedores, la tabla mostraba únicamente skeleton rows sin texto. Visualmente podía parecer una tabla rota o vacía.

## Ajuste
- `ProveedoresTable` ahora muestra un estado loading claro:
  - ES: `Cargando proveedores...`
  - EN: `Loading suppliers...`
- Se agrega una descripción corta:
  - ES: `Estamos preparando el listado comercial de proveedores.`
  - EN: `Preparing the commercial supplier list.`
- Se mantienen los skeletons debajo como indicador visual.
- Se agrega `role="status"`, `aria-live="polite"` y `aria-busy="true"`.

## Alcance
- Solo frontend/i18n/UX.
- No toca DB.
- No toca endpoints.
- No toca Swagger/OpenAPI.
