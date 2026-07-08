# i18n ES/EN loading states fix v1

## Objetivo

Corregir textos de carga/validación que podían seguir apareciendo en Español cuando el usuario tenía seleccionado Inglés.

## Alcance

- Traducción de `Cargando dashboard...` mediante `common.loadingDashboard`.
- Traducción de `Validando acceso...` mediante `common.validatingAccess`.
- Traducción de `Validando enlace...` en recuperación de contraseña mediante `login.validatingRecoveryLink`.
- Nuevas claves base `common.validatingData` para futuros loaders progresivos.

## Impacto técnico

- No toca DB.
- No agrega endpoints.
- No modifica Swagger/OpenAPI.
- Mantiene fallback a Español cuando falte una clave.

## QA sugerido

1. Seleccionar Inglés desde login o dashboard.
2. Recargar `/dashboard`.
3. Confirmar que el loader inicial muestra `Loading dashboard...`.
4. Ingresar a una ruta protegida y confirmar que el guard muestra `Validating access...`.
5. Probar recuperación de contraseña y confirmar `Validating link...` cuando aplica.
