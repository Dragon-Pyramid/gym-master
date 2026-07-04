# Dragon Pyramid masteradmin responsive fix v1

## Feature
`feature/dragon-pyramid-license-control-foundation-v1`

## Alcance
Ajuste responsive puntual de `/dashboard/masteradmin/license` para viewport mobile/F12.

## Problema detectado
La pantalla de control de licencia funcionaba correctamente en desktop y en flujo de autenticación, pero al activar F12 mobile el contenido quedaba más ancho que el viewport:

- header con título y botón `Salir` sin adaptación mobile;
- hero y cards con contenido interno que podía forzar overflow horizontal;
- layout lateral de conexión futura demasiado temprano para viewports angostos;
- endpoint largo sin contención de overflow.

## Cambios realizados
- Se agregó `overflow-x-hidden` y `max-w-full` en el shell principal.
- El header pasa a layout vertical en mobile y horizontal desde `sm`.
- El botón `Salir` pasa a ancho completo en mobile.
- Las cards principales usan `min-w-0` y `w-full` para respetar el viewport.
- El grid principal pasa a dos columnas recién desde `xl`.
- El badge de estado ocupa ancho completo en mobile.
- El endpoint de sincronización tiene scroll horizontal interno controlado.
- Los botones de formulario quedan full-width en mobile.

## No modifica
- DB.
- Endpoints.
- Swagger.
- Seguridad del secret.
- Login masteradmin.
- Comportamiento funcional de licencia.

## QA sugerido
1. Entrar a `/auth/login/masteradmin`.
2. Confirmar redirección a `/dashboard/masteradmin/license`.
3. Activar F12 mobile iPhone 12 Pro / 390px.
4. Confirmar que no hay scroll horizontal.
5. Confirmar que el botón `Salir` queda visible.
6. Confirmar que cards y formulario se apilan correctamente.
7. Probar modo desktop.
8. Ejecutar `npm run build`.
