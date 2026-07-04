# Dragon Pyramid app suspension by nonpayment v1

## Objetivo

Implementar la primera capa real de suspensión operativa de Gym Master controlada por la licencia local Dragon Pyramid.

Esta feature usa la base creada en las features previas:

- `dragon-pyramid-license-control-foundation-v1`
- `dragon-pyramid-client-payment-status-v1`
- `dragon-pyramid-grace-period-warning-v1`

## Alcance

Cuando la licencia local queda en estado:

- `suspended`
- `cancelled`

el shell protegido de `/dashboard` bloquea el acceso operativo de:

- `admin`
- `usuario`
- `socio`

El acceso reservado de Dragon Pyramid permanece disponible para regularizar, reactivar o sincronizar la licencia.

## Rutas que permanecen disponibles

- `/auth/login`
- `/auth/login/masteradmin`
- `/dashboard/masteradmin/license`
- `/api/dragon-pyramid/license`
- `/api/dragon-pyramid/license/suspension-status`
- `/api/internal/dragon-pyramid/license-sync`

## Implementación

Se agregó un estado seguro de suspensión:

- `src/utils/dragonPyramidSuspension.ts`
- `src/app/api/dragon-pyramid/license/suspension-status/route.ts`

El `DashboardRouteGuard` consulta este estado para usuarios operativos y muestra una pantalla de suspensión antes de renderizar módulos del dashboard.

## Criterio de seguridad

- `suspended_candidate` no bloquea todavía; sigue siendo advertencia comercial.
- `suspended` y `cancelled` bloquean operación.
- `masteradmin` queda excluido del bloqueo para poder reactivar.
- El endpoint de sincronización interna sigue funcionando para futura Dragon Pyramid Platform.
- Si el endpoint de suspensión falla temporalmente, el guard aplica fail-open para evitar bloqueo accidental por error técnico.

## Pruebas sugeridas

1. Ingresar como `masteradmin` a `/dashboard/masteradmin/license`.
2. Cambiar licencia a `suspended`.
3. Entrar como `admin` a `/dashboard` y confirmar pantalla de suspensión.
4. Entrar como `usuario` y confirmar bloqueo.
5. Entrar como `socio` y confirmar bloqueo genérico sin detalles comerciales.
6. Confirmar que `/auth/login/masteradmin` sigue disponible.
7. Confirmar que `/dashboard/masteradmin/license` sigue disponible para `masteradmin`.
8. Reactivar licencia como `active`.
9. Confirmar que admin/socio vuelven a operar.
10. Probar `cancelled` y repetir bloqueo.
11. Probar `suspended_candidate` y confirmar que no bloquea.
12. Ejecutar `npm run build`.

## DB

No requiere migración. Reutiliza la tabla de licencia existente.
