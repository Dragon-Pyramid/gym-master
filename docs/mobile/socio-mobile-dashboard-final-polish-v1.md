# Socio mobile dashboard final polish v1

## Objetivo

Cerrar el pulido UX del dashboard mobile del socio luego de incorporar las tarjetas principales del home.

## Cambios realizados

- Se mantiene el feed priorizado del dashboard mobile.
- Se agrega una franja compacta de accesos rápidos con scroll horizontal.
- Se reemplaza la grilla vertical de atajos secundarios por accesos tipo app más livianos.
- Se reduce el scroll total del dashboard mobile sin eliminar funcionalidades.
- Se acortan textos descriptivos de secciones para mejorar lectura en celular.
- Se conserva el orden funcional:
  - Prioridad / Acceso y estado
  - Hoy / Entrenamiento y agenda
  - Progreso / Evolución física
  - Comunicación / Soporte
- Se mantiene la experiencia desktop sin cambios funcionales.

## Alcance

- Frontend only.
- Sin cambios de base de datos.
- Sin cambios backend.
- Sin cambios de autenticación.
- Sin cambios de RBAC.

## Archivos modificados

- `src/components/dashboard/DashboardInitialContent.tsx`
- `docs/mobile/socio-mobile-dashboard-final-polish-v1.md`

## QA recomendado

Validar como socio en mobile:

- `/dashboard`
- Scroll general del feed.
- Accesos rápidos horizontales.
- Botones internos de cada tarjeta.
- Bottom navigation.
- Vista desktop del dashboard.
