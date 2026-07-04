# Dragon Pyramid client payment status v1

## Objetivo

Agregar a la foundation de licencia Dragon Pyramid la capa comercial de estado de pago del cliente SaaS para Gym Master.

## Alcance

- Amplía el modelo local `dragon_pyramid_license_control` con estado de pago, último pago, próximo vencimiento, monto esperado, moneda, plan y notas comerciales.
- Actualiza el panel reservado `/dashboard/masteradmin/license` para editar y visualizar el estado comercial.
- Permite que el endpoint interno `/api/internal/dragon-pyramid/license-sync` reciba datos comerciales desde la futura Dragon Pyramid Platform.
- Mantiene el flujo protegido por rol `masteradmin` y por secret interno de sincronización.
- No bloquea todavía el sistema del cliente. La suspensión real queda para una feature posterior.

## Estados de pago

- `paid`: cliente al día.
- `pending`: pago pendiente.
- `overdue`: pago vencido.
- `grace`: cliente en gracia comercial.
- `suspended_candidate`: cliente candidato a suspensión futura.
- `unknown`: sin dato comercial todavía.

## Seguridad

El repo público no versiona migraciones ni scripts SQL privados. La migración se aplica mediante el flujo operativo local/remoto de Supabase y los artefactos SQL quedan resguardados localmente.
