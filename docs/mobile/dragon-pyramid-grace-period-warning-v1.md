# Gym Master — Dragon Pyramid grace period warning v1

## Rama

`feature/dragon-pyramid-grace-period-warning-v1`

## Objetivo

Agregar una capa informativa de advertencias comerciales para administradores del gimnasio cuando la licencia o el estado de pago SaaS de Dragon Pyramid indican riesgo operativo.

Esta feature no bloquea el sistema. Solo informa estados como pago pendiente, vencido, período de gracia, licencia próxima a vencer o candidato a suspensión futura. El bloqueo real queda reservado para `feature/dragon-pyramid-app-suspension-by-nonpayment-v1`.

## Cambios principales

- Nuevo endpoint seguro `GET /api/dragon-pyramid/license/warning` para roles `admin` y `masteradmin`.
- Nuevo helper compartido `buildDragonPyramidGraceWarning` para calcular severidad y mensajes.
- Banner visible en `/dashboard` para rol `admin` cuando existe riesgo comercial.
- Banner detallado en `/dashboard/masteradmin/license` para el usuario Dragon Pyramid Master Admin.
- Swagger actualizado con el nuevo endpoint.
- Sin cambios de base de datos.
- Sin bloqueo de login, dashboard ni rutas operativas.

## Reglas funcionales

Se genera advertencia cuando aparece alguno de estos casos:

- `payment_status = pending`
- `payment_status = overdue`
- `payment_status = grace`
- `payment_status = suspended_candidate`
- `license_status = grace`
- `license_status = suspended`
- `license_status = cancelled`
- `next_due_at` próximo o vencido
- `expires_at` próximo o vencido
- `grace_until` próximo o vencido cuando el cliente está en gracia

## Roles

- `admin`: ve aviso resumido en `/dashboard`.
- `masteradmin`: ve aviso detallado en `/dashboard/masteradmin/license`.
- `usuario`: no ve avisos comerciales en esta etapa.
- `socio`: no ve avisos comerciales.

## Seguridad

El endpoint solo expone un resumen operativo para advertencias y requiere JWT. No permite modificar licencia ni pagos.

## QA sugerido

1. Entrar como `masteradmin` a `/dashboard/masteradmin/license`.
2. Cambiar estado de pago a `overdue`, `grace` o `suspended_candidate`.
3. Guardar y confirmar que aparece advertencia en el panel Master Admin.
4. Entrar como `admin` a `/dashboard`.
5. Confirmar que aparece banner informativo.
6. Entrar como socio y confirmar que no ve aviso comercial.
7. Probar `GET /api/dragon-pyramid/license/warning` como admin.
8. Probar el mismo endpoint como socio y confirmar 403.
9. Confirmar que no se bloquea el sistema.
10. Ejecutar `npm run build`.

## Notas

Esta feature prepara la comunicación previa al bloqueo. No aplica suspensión real ni cierre de sesión. La suspensión se implementará en una feature separada para controlar cuidadosamente excepciones, soporte y recuperación.
