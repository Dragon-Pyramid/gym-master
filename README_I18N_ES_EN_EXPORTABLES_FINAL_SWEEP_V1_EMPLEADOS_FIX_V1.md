# I18N ES/EN Exportables Final Sweep v1 — Empleados fix v1

Corrige la generación de PDF y Excel de `/dashboard/empleados` cuando el sistema está en inglés.

## Alcance

- PDF de empleados:
  - título, subtítulo, métricas, filtros, columnas, footer y paginación según `locale`.
  - valores visibles comunes traducidos en EN: `Administrativo`, `Activos`, `Nómina estimada`, `Área`, `Teléfono`, `Sueldo`, `Activo/Inactivo`, etc.
- Excel de empleados:
  - hoja `Employees` en EN.
  - headers EN.
  - estados y catálogos comunes traducidos para los seeds actuales.
- Reusa/asegura soporte `locale` en `src/utils/commercialReportPdf.ts`.

## No toca

- DB.
- Endpoints.
- Swagger/OpenAPI.
- Lógica de empleados, sueldos o RBAC.
- UI general fuera de exportables.

## Uso

```bash
node scripts/fix-empleados-exportables-i18n-v1.cjs
rm -rf .next
npm run build
```
