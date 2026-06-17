# Gym Master — Fix socio profile photo notification/admin view

## Rama

`fix/socio-profile-photo-notification-admin-view`

## Objetivo

Mejorar la experiencia visual y de datos del socio cuando todavía usa la foto/logo por defecto de Gym Master.

## Alcance

- Notificación en la campanita para socios sin foto propia.
- Click en la notificación hacia `/dashboard/perfil`.
- Modal Admin → Socios → Ver con foto del socio.
- Fallback visual al logo `/gm_logo.svg` cuando el socio no tiene foto propia.
- Helper compartido para detectar foto default.

## Sin cambios DB

No requiere migración. Usa el campo existente `socio.foto`.

## Validación sugerida

1. Ingresar como socio sin foto propia o con `/gm_logo.svg`.
2. Abrir la campanita y verificar notificación “Cargá tu foto de perfil”.
3. Hacer click y confirmar navegación a `/dashboard/perfil`.
4. Subir o sacar foto desde el perfil.
5. Verificar que la notificación desaparece al refrescar.
6. Ingresar como admin, abrir Socios → Ver y confirmar que se muestra foto propia o logo default.
