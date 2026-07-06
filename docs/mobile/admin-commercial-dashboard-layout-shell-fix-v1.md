# Admin Commercial Dashboard Layout Shell Fix v1

## Rama

`feature/admin-commercial-dashboard-final-polish-v1`

## Contexto

Durante QA visual de `/dashboard/comercial` se detectó que, al salir de F12/mobile o al volver a desktop, el dashboard quedaba desfasado verticalmente: el sidebar ocupaba una franja superior y el contenido principal comenzaba demasiado abajo.

## Causa

El contenedor raíz había quedado como `grid` sin definición de columnas. Eso hacía que `AppSidebar` y `SidebarInset` pudieran comportarse como filas de grilla en lugar de mantener el layout lateral esperado.

## Ajuste aplicado

- Se restaura el contenedor raíz como `flex` horizontal.
- Se fija el shell a `100dvh` / `max-h-[100dvh]`.
- `SidebarInset` mantiene grilla interna `Header / Contenido / Footer`.
- El contenido central conserva scroll interno.
- Se evita el desfasaje visual y se mantiene el fix de footer sin espacio blanco.

## Archivos modificados

- `src/app/dashboard/comercial/page.tsx`

## Alcance

No modifica DB, endpoints ni Swagger.
