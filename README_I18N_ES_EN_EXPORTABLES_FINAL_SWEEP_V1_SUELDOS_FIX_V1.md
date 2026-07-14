# i18n ES/EN exportables sueldos - fix v1

Corrige los exportables de `/dashboard/empleados-sueldos` para que respeten el idioma activo del sistema.

## Alcance
- Excel de sueldos de empleados:
  - nombre de hoja;
  - columnas;
  - estados;
  - medios de pago;
  - concepto demo mensual cuando el idioma es EN.
- PDF listado de sueldos:
  - título, subtítulo, métricas, filtros, columnas, estados, medios, footer y paginado.
- PDF recibo individual:
  - título, subtítulo, branding genérico, métricas, filtros, columnas, concepto, footer y paginado.
- Reusa/asegura soporte `locale` en `commercialReportPdf.ts`.

## No incluido
- No toca DB.
- No toca endpoints.
- No toca Swagger/OpenAPI.
- No cambia cálculos de sueldos, pagos ni recibos.

## Validación sugerida
```bash
cd /e/gym-master-2026/sistema/gym-master
node scripts/fix-sueldos-exportables-i18n-v1.cjs
rm -rf .next
npm run build
```

Luego probar en EN:
- `/dashboard/empleados-sueldos` → Download PDF.
- `/dashboard/empleados-sueldos` → Export.
- Acción recibo de un sueldo → PDF individual.

Esperado: encabezados y textos base en inglés: `Employee salaries`, `Records`, `Total net`, `Paid`, `Pending`, `Status`, `From`, `To`, `Search`, `Details`, `Page X of Y`, `Salary receipt`, `Base salary`, `Bonuses`, `Discounts`, `Payment method`, `Bank transfer`, `Cash`, `Pending`, `Paid`.
