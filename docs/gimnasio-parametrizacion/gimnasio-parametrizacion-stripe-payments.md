# Gym Master — Parametrización Stripe por gimnasio

## Alcance

La feature `feature/gimnasio-parametrizacion-stripe-payments` agrega control funcional para habilitar o deshabilitar pagos online con Stripe por gimnasio.

## Reglas principales

- Los pagos manuales administrativos siguen funcionando siempre.
- Si Stripe no está habilitado y activo, el socio no puede iniciar checkout online.
- El endpoint `/api/pagar-cuota` bloquea la vista previa y la creación de sesión Stripe cuando la configuración no está activa.
- La pantalla `/dashboard/mi-cuenta/pagar-cuota` muestra un mensaje claro cuando los pagos online no están disponibles.
- La configuración vive dentro de `gimnasio_parametrizacion` y no guarda claves secretas.

## Campos agregados

- `stripe_habilitado`
- `stripe_estado`
- `stripe_modo`
- `stripe_public_key`
- `stripe_account_reference`
- `stripe_observaciones`

## Seguridad

Las claves secretas de Stripe deben seguir en variables de entorno seguras. No se guardan secrets en base de datos ni se exponen al frontend.
