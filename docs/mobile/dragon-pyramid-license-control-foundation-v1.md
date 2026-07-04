# Dragon Pyramid License Control Foundation v1

## Feature

`feature/dragon-pyramid-license-control-foundation-v1`

## Objetivo

Dejar a Gym Master preparado para obedecer en el futuro a una plataforma madre de Dragon Pyramid, sin construir todavía el dashboard global multi-producto.

Esta primera etapa agrega una puerta reservada:

- `/auth/login/masteradmin`

Y una vista interna por instancia:

- `/dashboard/masteradmin/license`

## Alcance

- Rol interno `masteradmin`.
- Login reservado para Dragon Pyramid.
- Pantalla mínima de control local de licencia.
- Estados de licencia: `active`, `trial`, `grace`, `suspended`, `cancelled`.
- API autenticada para consultar/actualizar licencia local.
- Endpoint interno preparado para sincronización futura desde Dragon Pyramid Platform.
- SQL privado para tabla singleton de licencia local.

## Decisión de arquitectura

No se crea todavía la plataforma madre Dragon Pyramid.

Gym Master queda preparado para ser controlado por una futura aplicación central:

`Dragon Pyramid Platform -> Producto -> Cliente -> Suspender/Reactivar -> sync con instancia Gym Master`

## Seguridad

La ruta secreta no es la única seguridad. También se agregan:

- rol específico `masteradmin`;
- guard de rutas dashboard;
- endpoints con validación server-side;
- endpoint de sincronización preparado con `DRAGON_PYRAMID_LICENSE_SYNC_SECRET`;
- tabla no expuesta para `anon` ni `authenticated`.

## Nota DB

Los SQL de migración y validación quedan como artefactos privados de operación y no se suben al repositorio público.

## Fuera de alcance

- Suspensión real del sistema.
- Bloqueo de login por falta de pago.
- Reactivación automática.
- Dashboard madre multi-producto.
- Facturación Dragon Pyramid.

Estas capacidades quedan para features posteriores del roadmap.
