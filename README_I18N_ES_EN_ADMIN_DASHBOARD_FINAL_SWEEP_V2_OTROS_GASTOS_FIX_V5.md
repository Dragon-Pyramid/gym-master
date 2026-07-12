# Gym Master — i18n ES/EN Admin Dashboard Final Sweep v2 — Otros Gastos fix v5

## Alcance
Ruta: `/dashboard/otros-gastos`.

Fix incremental sobre `otros_gastos_fix_v4`.

## Corrección
El combo `Expense type` ya traducía el nombre del tipo, pero la descripción dinámica debajo del combo seguía mostrando textos en español para algunos valores del catálogo/DB.

Este fix amplía el resolver de presentación para cubrir las descripciones de todos los tipos conocidos del combo:

- Unclassified / sin tipo
- Salaries
- Maintenance
- Services
- Supplies
- Rent
- Taxes
- Cleaning
- Marketing
- Other
- Utilities / servicios públicos
- Repair / repairs
- Professional fees

También agrega heurística defensiva por palabras clave para variantes de descripciones provenientes de DB, por ejemplo:

- `Luz, agua, internet, software u otros servicios.` → `Electricity, water, internet, software, or other services.`
- descripciones de sueldos/jornales/liquidaciones
- mantenimiento/equipamiento/infraestructura/reparación
- insumos/oficina/suministros
- alquiler/renta/local/depósito
- impuestos/tasas/fiscal/retenciones
- limpieza/higiene/desinfección
- marketing/publicidad/comunicación/campañas

## Archivo modificado
- `src/utils/otrosGastosI18n.ts`

## Seguridad
No toca DB, endpoints, Swagger/OpenAPI, lógica de gastos, comprobantes ni uploads.
