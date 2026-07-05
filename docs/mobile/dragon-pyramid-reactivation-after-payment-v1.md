# Dragon Pyramid Reactivation After Payment v1

## Rama

`feature/dragon-pyramid-reactivation-after-payment-v1`

## Objetivo

Cerrar el ciclo comercial de licencia Dragon Pyramid para Gym Master: después de que un cliente regulariza el pago, Master Admin puede levantar la suspensión operativa sin tocar la base manualmente.

## Alcance

- Se agrega endpoint protegido `POST /api/dragon-pyramid/license/reactivate` para rol `masteradmin`.
- Se agrega acción visible en `/dashboard/masteradmin/license` cuando el cliente está suspendido, cancelado, vencido, en gracia o candidato a suspensión.
- La reactivación deja `license_status = active` y `payment_status = paid`.
- Registra `reactivated_at` y `last_payment_at`.
- Limpia `suspended_at` y `suspension_reason`.
- Mantiene `next_due_at`, monto, moneda y plan comercial si se cargan desde el formulario.
- El endpoint interno `license-sync` puede ejecutar la misma reactivación cuando Dragon Pyramid Platform envíe `reactivate: true` o `status: active` + `paymentStatus: paid`.

## Seguridad

- Solo `masteradmin` puede ejecutar la reactivación manual.
- La sincronización externa sigue protegida con `DRAGON_PYRAMID_LICENSE_SYNC_SECRET`.
- No se abren rutas para admin común, usuario ni socio.

## No incluye

- No crea la plataforma madre Dragon Pyramid.
- No integra pasarela de pagos real Dragon Pyramid.
- No agrega migración DB: reutiliza campos existentes de licencia y pago.
- No versiona SQL privado.

## QA sugerido

1. Poner licencia en `suspended` desde Master Admin.
2. Confirmar que admin/socio quedan bloqueados.
3. Entrar como `masteradmin` a `/dashboard/masteradmin/license`.
4. Presionar `Reactivar servicio`.
5. Confirmar que licencia queda `active` y pago `paid`.
6. Confirmar que desaparece la pantalla de suspensión para admin/socio.
7. Probar sync interno con `reactivate: true` y secret correcto.
8. Probar que secret incorrecto sigue devolviendo `401`.
