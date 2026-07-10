# i18n navigation menus final sweep v1

## Objetivo

Auditar y reforzar traducciones ES/EN en navegación, menús y títulos de pantalla.

## Ajustes incluidos

### Helper centralizado de navegación

Se agrega `src/i18n/navigationLabels.ts` para centralizar traducciones de:

- grupos del sidebar;
- items del sidebar;
- títulos recibidos por `AppHeader`;
- variantes con mayúsculas/minúsculas o acentos.

### Sidebar

`SidebarSection` deja de tener mapas locales duplicados y usa el helper centralizado:

- `translateNavigationGroup`
- `translateNavigationItem`

Esto reduce la posibilidad de que nuevos menús queden en Español cuando el idioma activo es Inglés.

### Header / títulos de pantalla

`AppHeader` ahora traduce el `title` que recibe antes de renderizarlo.

Esto cubre títulos que todavía llegaban como literal Español desde páginas antiguas, por ejemplo:

- `Mis actividades`
- `Ficha médica`
- `Evolución física`
- `Gestor de Rutinas`
- `Gestor de Dietas`
- `Detalles de Venta`
- `Detalle de Rutina`
- `Detalle de Dieta`
- `Detalle de Evolución Física`
- `Ranking y bonificación mensual`
- `Códigos y etiquetas comerciales`
- `Alertas de stock comercial`

### Permisos de menú

El bloque de permisos de menú dentro de `UserForm` ahora traduce:

- título del bloque;
- descripción;
- aviso de rol administrador;
- aviso para usuario interno;
- grupos;
- items/módulos.

## Alcance

- Solo frontend/i18n.
- No toca DB.
- No toca endpoints.
- No toca Swagger/OpenAPI.
- No modifica permisos ni reglas de acceso.
- No cambia rutas existentes.
