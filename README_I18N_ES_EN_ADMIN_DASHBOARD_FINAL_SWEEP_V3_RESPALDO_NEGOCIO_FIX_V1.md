# i18n ES/EN Admin Dashboard Final Sweep V3 — Respaldo negocio fix v1

## Ruta

- `/dashboard/respaldo-negocio`

## Alcance

Este patch corrige residuos ES/EN de la pantalla de respaldo/exportación del negocio y mejora el modo oscuro local.

## Cambios principales

- Agrega `useI18n()` a la pantalla.
- Traduce header de página:
  - `Respaldo / Exportación` / `Backup / Export`
  - `Exportación segura de datos operativos` / `Secure operational data export`
  - `Respaldo del negocio` / `Business backup`
- Traduce acciones y estados:
  - `Actualizar` / `Refresh`
  - `Generando...` / `Generating...`
  - `Completado` / `Completed`
  - `Generando` / `Generating`
  - `Sin registros` / `No records`
- Traduce cards/resumen:
  - `Módulos disponibles` / `Available modules`
  - `Seleccionados` / `Selected`
  - `Última exportación` / `Last export`
- Traduce panel de módulos:
  - `Módulos exportables` / `Exportable modules`
  - `Seleccionar todos` / `Select all`
  - `Deseleccionar todos` / `Deselect all`
  - `Cargando módulos...` / `Loading modules...`
- Traduce labels/descripciones dinámicas de módulos recibidos desde API sin modificar backend ni DB:
  - Datos del gimnasio, Socios, Usuarios internos, Empleados, Sueldos, Cuotas/Fees, Pagos, Asistencias, Ventas, Detalle de ventas, Compras, Detalle de compras, Productos/stock, Proveedores, Servicios, Gastos/egresos, Mensajes de socios, Tickets Dragon Pyramid.
- Traduce historial:
  - `Historial reciente` / `Recent history`
  - `Formato` / `Format`
  - `Registros` / `Records`
  - `Módulos` / `Modules`
  - `Todavía no hay exportaciones registradas.` / `No exports registered yet.`
- Mejora dark mode local de:
  - hero/card superior,
  - KPI cards,
  - cards de módulos seleccionados/no seleccionados,
  - historial reciente,
  - badges de estado.

## Fuera de alcance

- No toca DB.
- No toca endpoints.
- No toca Swagger/OpenAPI.
- No modifica la lógica de exportación Excel/JSON.
- No traduce columnas internas del archivo exportado; eso queda para el sweep específico de exportables/PDF/Excel/tickets/labels.

## Validación sugerida

```bash
cd /e/gym-master-2026/sistema/gym-master
rm -rf .next
npm run build
```

Luego limpiar PWA si corresponde:

```bash
git checkout -- public/sw.js
rm -f public/fallback-*.js
git status --short
```
