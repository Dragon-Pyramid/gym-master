# I18N ES/EN Admin Dashboard Final Sweep V3 — Soporte Dragon Pyramid Fix V1

## Alcance

Pantalla corregida:

- `/dashboard/soporte-dragon-pyramid`

## Cambios incluidos

- Integra `useI18n()` en la pantalla de soporte Dragon Pyramid.
- Traduce los textos estáticos del módulo en ES/EN:
  - Header y hero.
  - Cards KPI.
  - Lectura ejecutiva.
  - Nuevo ticket.
  - Tickets enviados.
  - Panel de detalle e historial.
  - Toasts, errores, placeholders y estados vacíos.
- Traduce explícitamente el contenido de combos y badges:
  - Categorías: `Fallas`, `Dudas`, `Problemas`, `Sugerencias`, `Otros`.
  - Prioridades: `Baja`, `Media`, `Alta`, `Crítica`.
  - Estados/filtros: `Todos`, `Pendientes`, `En revisión`, `Respondidos`, `Cerrados`.
- Corrige labels dinámicos de presentación:
  - `Prioridad Alta` deja de depender de traducciones globales ambiguas y muestra `Priority High` en EN.
  - `Email no confirmado`, `+48 h abierto`, `pendiente/no configurado`, etc.
- Mantiene el contenido propio escrito por usuarios/tickets sin traducir, porque es dato ingresado/manual y no catálogo UI.

## Archivos modificados

- `src/app/dashboard/soporte-dragon-pyramid/page.tsx`

## Fuera de alcance

- No toca DB.
- No toca endpoints.
- No toca Swagger/OpenAPI.
- No cambia la lógica de creación, seguimiento, respuesta ni cierre de tickets.
- No traduce contenidos libres escritos por usuarios en asuntos/descripciones/comentarios.

## Validación sugerida

```bash
cd /e/gym-master-2026/sistema/gym-master

git status --short
rm -rf .next
npm run build
```

Después del build:

```bash
git checkout -- public/sw.js
rm -f public/fallback-*.js

git status --short
```

## QA manual sugerido

Revisar `/dashboard/soporte-dragon-pyramid` en EN y ES:

- Header/hero.
- Cards KPI.
- Lectura ejecutiva.
- Formulario Nuevo ticket.
- Combos Categoría, Prioridad y Estado.
- Lista de tickets.
- Badges de prioridad/estado/categoría.
- Panel de detalle.
- Historial.
- Dark mode.
