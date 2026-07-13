# I18N ES/EN Admin Dashboard Final Sweep V3 - Avisos Fix V1

## Alcance

Pantalla: `/dashboard/avisos`.

Este patch corrige textos mixtos ES/EN y mejora dark mode local en la pantalla de avisos/notices del administrador.

## Cambios principales

- Header de la página: `Avisos` / `Notices`.
- Card principal: `Listado de avisos` / `Notices list`.
- Buscador: `Buscar por título, mensaje, tipo o fecha...` / `Search by title, message, type, or date...`.
- Botón: `Nuevo aviso` / `New notice`.
- Tabla: `Título`, `Mensaje`, `Tipo`, `Fecha de envío`, `Acciones`, `Total de avisos`, caption y empty state.
- Acciones de tabla: `Ver`, `Editar`, `Eliminar` / `View`, `Edit`, `Delete`.
- Modal create/edit: `Nuevo aviso`, `Editar aviso`, labels, placeholders, checkbox y botón submit.
- Modal view: `Detalle del aviso`, `Asunto`, `Fecha de envío`, `Mensaje`.
- Editor Markdown compartido: tabs, contador, placeholder, toolbar titles y footer helper ES/EN.
- Dark mode local en page/card/table/modal/form/editor.

## Fuera de alcance

- No toca DB.
- No toca endpoints.
- No toca Swagger/OpenAPI.
- No cambia lógica de envío, edición, borrado o renderizado de avisos.
- No traduce contenido persistido de avisos ya guardados en base de datos.

## Validación sugerida

```bash
cd /e/gym-master-2026/sistema/gym-master
rm -rf .next
npm run build
```

Luego limpiar PWA generado por build:

```bash
git checkout -- public/sw.js
rm -f public/fallback-*.js
git status --short
```
