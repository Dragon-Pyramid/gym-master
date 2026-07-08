# i18n ES/EN auth public pages v1

## Objetivo

Completar la internacionalización inicial ES/EN de las pantallas de autenticación y páginas públicas base de Gym Master, continuando sobre la foundation de i18n.

## Alcance implementado

- `/auth/login`
- `/auth/login/admin`
- `/auth/login/socio`
- `/auth/login/masteradmin`
- `/auth/forgot-password`
- `/auth/reset-password`
- `/auth/change-password`
- `/offline`
- Estados de acceso restringido/suspensión dentro del guard de dashboard.

## Cambios principales

- Traducción de recuperación de contraseña.
- Traducción de reset de contraseña.
- Traducción de cambio obligatorio/manual de contraseña.
- Traducción de políticas de contraseña.
- Traducción de mensajes estándar de error/success en auth.
- Selector ES/EN visible también en recuperación, reset y cambio de contraseña.
- Traducción de página offline pública.
- Traducción de textos operativos del `DashboardRouteGuard` relacionados con acceso restringido, cambio de usuario, reintento y acceso reservado Dragon Pyramid.
- Helper `translateAuthMessage` para normalizar mensajes conocidos de API/auth sin exponer textos mixtos ES/EN.

## Seguridad y contratos

- No toca DB.
- No agrega migraciones.
- No agrega endpoints.
- No modifica Swagger/OpenAPI.
- No cambia el contrato de recuperación ni login.
- No cambia la lógica de autenticación; solo adapta copy, UI y fallback i18n.

## QA sugerido

1. Entrar a `/auth/login` y cambiar ES/EN.
2. Validar `/auth/login/admin`, `/auth/login/socio`, `/auth/login/masteradmin`.
3. Probar `/auth/forgot-password?rol=socio`.
4. Probar `/auth/forgot-password?rol=admin`.
5. Probar `/auth/reset-password` sin token.
6. Probar `/auth/reset-password?token=invalid`.
7. Probar `/auth/change-password` con usuario que debe cambiar contraseña.
8. Revisar errores/toasts básicos en ES/EN.
9. Entrar a `/offline` y confirmar textos traducidos.
10. Forzar una ruta sin permisos y confirmar estado de acceso restringido en ES/EN.
11. Probar modo claro/oscuro, mobile F12 y recarga con idioma persistido.
