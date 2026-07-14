# i18n ES/EN exportables empleados - fix script syntax v1b

Corrige el script `scripts/fix-empleados-exportables-i18n-v1.cjs` que fallaba al parsear por un template literal anidado en la línea de `filtersLabel`.

## Alcance
- Reemplaza solo el script de aplicación del patch.
- Mantiene el objetivo original: PDF + Excel de `/dashboard/empleados` respetando `locale` ES/EN.
- No toca DB, endpoints, Swagger/OpenAPI, lógica de empleados, sueldos ni RBAC.

## Validación sugerida
```bash
cd /e/gym-master-2026/sistema/gym-master
node scripts/fix-empleados-exportables-i18n-v1.cjs
rm -rf .next
npm run build
```
