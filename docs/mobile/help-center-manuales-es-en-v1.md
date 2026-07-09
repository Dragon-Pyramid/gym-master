# Help Center manuales ES/EN v1

## Objetivo
Agregar un centro de ayuda online dentro de Gym Master para consultar manuales indexados desde la aplicación.

## Alcance funcional
- Nueva ruta `/dashboard/ayuda`.
- Nuevo icono de ayuda en el header del dashboard.
- Nuevo acceso de menú `Ayuda / Manuales`.
- Manual de administrador para roles `admin` y `usuario`.
- Manual de socio para rol `socio`.
- Separación de contenido por rol desde la UI y el guard de rutas.
- Buscador textual sobre el manual permitido para el usuario autenticado.
- Índice por categorías y funcionalidades.
- Contenido inicial en Español e Inglés.

## Regla RBAC clave
Un socio no debe acceder al manual administrativo. El centro resuelve el manual visible a partir del rol autenticado:

- `admin` / `usuario` → manual administrativo.
- `socio` → manual de socio.

No se agrega selector para cambiar de manual entre roles.

## Archivos principales
- `src/app/dashboard/ayuda/page.tsx`
- `src/lib/help-center/manualContent.ts`
- `src/components/header/AppHeader.tsx`
- `src/components/sidebar/sidebarConfig.ts`
- `src/components/sidebar/SidebarSection.tsx`
- `src/lib/permissions/menuPermissions.ts`
- `src/i18n/dictionaries.ts`

## Alcance técnico
- Frontend-first.
- Sin DB.
- Sin endpoints nuevos.
- Sin Swagger/OpenAPI.
- Contenido local versionado para esta primera iteración.

## Validación sugerida
- Login como admin: debe ver manual administrativo.
- Login como usuario interno: debe ver manual administrativo.
- Login como socio: debe ver manual de socio.
- Cambiar idioma ES/EN y verificar títulos, índice, búsqueda y contenido.
- Buscar términos de admin como `POS`, `socios`, `pagos` desde admin.
- Buscar términos de socio como `cuota`, `rutina`, `ficha médica` desde socio.
