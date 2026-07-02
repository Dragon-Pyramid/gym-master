# Socio mobile profile polish v1

## Rama

`feature/socio-mobile-profile-polish-v1`

## Objetivo

Pulir la experiencia mobile de la pantalla **Mi perfil** para que el socio pueda revisar su cuenta, actualizar su foto y acceder rápido a las secciones principales desde el celular.

## Alcance

- Rediseño mobile-first de `/dashboard/perfil`.
- Header visual con estado de cuenta y rol.
- Card de perfil más compacta y clara.
- Foto/avatar con flujo existente de subir foto y sacar foto.
- Datos de cuenta en cards legibles.
- Accesos rápidos para socio:
  - Ficha médica.
  - Rutinas.
  - Dietas.
  - Evolución física.
  - Pagos.
  - Mensajes.
- Accesos rápidos alternativos para admin/usuario interno.
- Mensaje de seguridad para cambio de contraseña.
- Corrección preventiva del layout: se evita usar un `<main>` interno para no reactivar el padding residual de la bottom nav mobile ni generar espacio en blanco después del footer.

## Fuera de alcance

- No modifica la base de datos.
- No agrega endpoints.
- No toca Swagger/OpenAPI.
- No cambia permisos/RBAC.
- No modifica el flujo de Cloudinary ni la cámara del perfil.

## Archivos modificados

- `src/app/dashboard/perfil/page.tsx`
- `src/components/perfil/ProfileCard.tsx`
- `src/components/perfil/ProfileDetails.tsx`
- `docs/mobile/socio-mobile-profile-polish-v1.md`

## Validación sugerida

### Socio mobile

1. Entrar a `/dashboard/perfil`.
2. Confirmar que no hay scroll horizontal.
3. Confirmar que no queda espacio en blanco después del footer al salir de F12 mobile.
4. Revisar foto/avatar.
5. Probar Subir foto.
6. Probar Sacar foto.
7. Confirmar datos principales.
8. Probar accesos rápidos: ficha médica, rutinas, dietas, evolución, pagos y mensajes.
9. Probar modo claro/oscuro.

### Admin / usuario interno

1. Entrar a `/dashboard/perfil`.
2. Confirmar que la pantalla no rompe.
3. Confirmar accesos rápidos de perfil operativo.
4. Confirmar que el menú superior sigue funcionando.
