# i18n ES/EN socio dashboard revert hero stability v1

## Objetivo
Revertir el ajuste visual de estabilidad aplicado al hero desktop del dashboard socio porque empeoró la composición web.

## Alcance
- Restaura `DashboardInitialContent.tsx` a la versión estable previa al fix de hero stability.
- Conserva el trabajo de i18n del dashboard socio.
- Conserva el fix de build de accesos rápidos.
- No toca DB, endpoints ni Swagger/OpenAPI.

## QA
- Validar `/dashboard` como socio en desktop/web.
- Confirmar que el hero vuelve a la composición visual anterior.
- Confirmar que mobile sigue correcto.
- Confirmar que los textos ES/EN del dashboard socio siguen funcionando.
