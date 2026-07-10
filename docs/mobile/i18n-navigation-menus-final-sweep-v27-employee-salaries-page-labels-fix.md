# i18n navigation menus final sweep v27 - Employee salaries page labels fix

## Objetivo

Corregir remanentes puntuales de textos ES/EN en `/dashboard/empleados-sueldos`.

## Ajuste directo en page

Se actualiza `src/app/dashboard/empleados-sueldos/page.tsx` para usar `useI18n()` en textos propios de la pantalla:

- cards: `Registros`, `Total neto`, `Pagado`, `Pendiente`;
- título: `Sueldos de empleados`;
- descripción: `Registro opcional de liquidaciones, pagos y recibos del personal.`;
- acciones: `Download PDF`, `Export`, `New salary`;
- filtro de estado;
- placeholder de búsqueda;
- loading interno;
- texto inferior `Showing X of Y records`.

También se agregan `lang` y `aria-label` a los inputs `month` para respetar el idioma activo.

## Ajuste exact-only en sweep

Se agregan traducciones exactas para encabezados/estados de tabla y modales relacionados con sueldos:

- `Empleado` → `Employee`
- `Período` → `Period`
- `Bonos` → `Bonuses`
- `Neto` → `Net`
- `Pago` → `Payment`
- `Pendiente` / `pendiente` → `Pending`
- `Anulado` / `anulado` → `Canceled`
- `Detalle de sueldo` → `Salary detail`
- `Editar sueldo` → `Edit salary`
- `Registrar sueldo` → `Register salary`
- `Guardar cambios` → `Save changes`

## Alcance

- Solo frontend/i18n.
- Sin cambios en DB.
- Sin cambios en endpoints.
- Sin cambios en Swagger/OpenAPI.
- Sin cambios en lógica de sueldos.
- Sin cambios en PDF/Excel generados; esa traducción queda para futura feature global de reportes/exportaciones multiidioma.
