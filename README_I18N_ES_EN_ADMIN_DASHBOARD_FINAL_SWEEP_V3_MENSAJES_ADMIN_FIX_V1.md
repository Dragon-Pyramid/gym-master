# i18n ES/EN Admin Dashboard Final Sweep v3 - Mensajes Admin Fix v1

## Alcance
Pantalla: `/dashboard/mensajes-admin`
Archivo modificado: `src/app/dashboard/mensajes-admin/page.tsx`

## Cambios
- Traduce la pantalla de mensajes de socios del administrador según el idioma activo ES/EN.
- Cubre header, KPI cards, bandeja de entrada, filtros, estados, buscador, vacíos/loading, panel de detalle y acciones de respuesta/cierre.
- Traduce labels de estado: pendiente/leído/respondido/cerrado.
- Traduce fallback de socio/sin email/sin nombre y toasts de acciones.
- Mejora dark mode local en cards, bandeja, detalle, inputs, textarea, selección de mensaje y alertas.

## Fuera de alcance
- No modifica DB.
- No modifica endpoints.
- No modifica Swagger/OpenAPI.
- No cambia la lógica de lectura, respuesta, cierre ni envío de email.
