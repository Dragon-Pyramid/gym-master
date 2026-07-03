# Ficha médica admin review polish v1

## Rama

`feature/ficha-medica-admin-review-polish-v1`

## Alcance

Pulido del flujo de revisión de ficha médica desde el dashboard, con foco en administración y compatibilidad socio.

## Cambios principales

- Se agregó un encabezado operativo para ficha médica con métricas de revisión.
- Para roles `admin` y `usuario`, se incorporó selector de socio con búsqueda por nombre, DNI, email o teléfono.
- Se muestra contexto del socio seleccionado antes de abrir ficha actual, nueva carga o historial.
- Se mejoró la pestaña de ficha actual con estado de apto médico, próxima revisión y cantidad de documentos adjuntos.
- Se mejoró la pestaña historial con cards más legibles, estado vacío y botones de documentos.
- Se preserva la experiencia del socio usando su propio `id_socio` cuando no es rol revisor.
- Se corrigió el layout vertical con shell `Header / Contenido / Footer` para evitar espacio blanco después del footer al salir de F12 mobile.

## Archivos modificados

- `src/app/dashboard/ficha-medica/page.tsx`
- `src/components/ficha-medica/Tabs.tsx`
- `src/components/ficha-medica/TabActual.tsx`
- `src/components/ficha-medica/TabHistorial.tsx`

## Validación sugerida

1. Ingresar como admin o usuario operativo a `/dashboard/ficha-medica`.
2. Buscar un socio por nombre, DNI, email o teléfono.
3. Seleccionar un socio y revisar pestaña Actual.
4. Descargar PDF de ficha si existe.
5. Revisar apto médico, próxima revisión y documentos.
6. Abrir pestaña Historial y validar cards/documentos/modal de detalle.
7. Abrir pestaña Nueva y confirmar que registra sobre el socio seleccionado.
8. Ingresar como socio y confirmar que solo ve su propia ficha.
9. Probar modo claro/oscuro.
10. Salir de F12 mobile y confirmar que no queda espacio blanco después del footer.

## Base de datos / API

No requiere migraciones.
No modifica endpoints ni Swagger.
