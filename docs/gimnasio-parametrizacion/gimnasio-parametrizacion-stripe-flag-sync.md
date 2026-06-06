# Gym Master — Fix sincronización bandera Stripe

## Rama

`feature/gimnasio-parametrizacion-stripe-payments`

## Ajuste

Se corrige la sincronización entre la bandera `stripe_habilitado` y el estado operativo `stripe_estado`.

## Regla funcional

- Si el administrador activa “Habilitar pagos online con Stripe”, el estado pasa automáticamente a `activo`.
- Si el administrador desactiva Stripe, el estado pasa automáticamente a `inactivo`.
- Si selecciona estado `activo`, la bandera queda habilitada.
- Si selecciona `no_configurado`, `configurado` o `inactivo`, la bandera queda deshabilitada.
- El backend vuelve a normalizar la consistencia para evitar estados contradictorios.

## Motivo

Durante QA se detectó que al deshabilitar Stripe el socio quedaba correctamente bloqueado, pero al volver a habilitarlo el pago online seguía bloqueado porque el estado no quedaba sincronizado como `activo`.
