# I18N ES/EN Admin Dashboard Final Sweep V3 - Perfil Fix V1

## Ruta

- `/dashboard/perfil`

## Alcance

- Traduce la pantalla de perfil personal en ES/EN.
- Traduce hero, estado de cuenta, datos de cuenta, accesos rápidos y recomendación de seguridad.
- Traduce el bloque de foto de perfil, botones de subir/sacar/guardar/cambiar/cancelar foto y modal de cámara.
- Traduce labels dinámicos de rol, estado, datos no registrados y estado de contraseña.
- Mantiene la lógica de autenticación, carga de usuario, cámara y upload sin cambios funcionales.

## Archivos modificados

- `src/app/dashboard/perfil/page.tsx`
- `src/components/perfil/ProfileCard.tsx`
- `src/components/perfil/ProfileDetails.tsx`
- `src/components/perfil/ProfileImage.tsx`

## No incluido

- No toca DB.
- No toca endpoints.
- No toca Swagger/OpenAPI.
- No modifica lógica de upload/cámara/permisos.
