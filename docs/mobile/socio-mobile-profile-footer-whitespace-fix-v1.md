# Socio mobile profile footer whitespace fix v1

Fix local para evitar espacio sobrante después del footer en `/dashboard/perfil` al alternar entre F12 mobile y desktop.

## Cambios
- Se cambia el shell interno de `SidebarInset` en Perfil a una grilla de tres filas: header, contenido y footer.
- El footer queda anclado al final del viewport cuando el contenido es corto y fluye correctamente cuando el contenido es largo.
- Se elimina la dependencia de `flex-1` en el contenido principal de la página Perfil.

## Alcance
- No modifica DB.
- No modifica endpoints.
- No modifica Swagger.
- No cambia lógica de perfil, foto ni permisos.

## Nota
Este fix es local para cerrar la rama. Queda pendiente una feature global para auditar todas las páginas del dashboard y evitar este patrón en toda la aplicación.
