# Dragon Pyramid License Admin Panel — Grace Action Fix v1

## Objetivo
Corregir la acción rápida **Poner en gracia** del panel Master Admin para respetar la restricción de fechas de la tabla `dragon_pyramid_license_control`.

## Problema detectado
La acción rápida intentaba aplicar `license_status = grace` y `payment_status = grace`, pero conservaba un `next_due_at` o `expires_at` futuro mientras generaba un `grace_until` a 7 días desde el momento actual. En escenarios donde el vencimiento previo era posterior a la fecha de gracia, PostgreSQL rechazaba el update por la restricción `dragon_pyramid_license_dates_check`.

## Corrección aplicada
Al ejecutar **Poner en gracia**, ahora se establece:

- `license_status = grace`
- `payment_status = grace`
- `next_due_at = now`
- `expires_at = now`
- `grace_until = now + 7 días`

De esta forma, el período de gracia queda semánticamente correcto: primero vence la licencia/pago y luego se habilita una ventana temporal de gracia.

## Alcance
- No toca DB.
- No toca APIs.
- No toca Swagger.
- No modifica las acciones de suspensión, cancelación, trial, pago al día ni pago vencido.
- No cambia la regla de bloqueo: `grace` advierte, pero no bloquea.
