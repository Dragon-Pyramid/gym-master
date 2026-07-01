# Socio mobile dashboard priority feed v1

## Rama

`feature/socio-mobile-dashboard-priority-feed-v1`

## Objetivo

Reordenar el dashboard mobile del socio para que funcione como un feed priorizado tipo app, evitando que las tarjetas queden como una lista larga sin jerarquía visual.

## Cambios principales

- Se agrega un wrapper visual reusable para secciones mobile del socio.
- Se agrupan las tarjetas existentes por prioridad funcional:
  - **Prioridad / Acceso y estado**: QR de ingreso, pagos/recibos y ficha médica.
  - **Hoy / Entrenamiento y agenda**: rutina/dieta diaria y actividades del gimnasio.
  - **Progreso / Evolución física**: resumen de evolución del socio.
  - **Comunicación / Soporte del gimnasio**: mensajes y contacto con administración.
- Se reduce ruido visual moviendo accesos repetidos a una zona de atajos secundarios.
- Se mantiene intacta la experiencia desktop del dashboard del socio.

## Alcance técnico

- Frontend only.
- No requiere cambios de base de datos.
- No requiere cambios backend.
- No modifica permisos/RBAC.
- No altera autenticación.
- Reutiliza tarjetas mobile ya implementadas en features anteriores.

## Archivos modificados

- `src/components/dashboard/DashboardInitialContent.tsx`
- `docs/mobile/socio-mobile-dashboard-priority-feed-v1.md`

## QA sugerido

Validar como socio desde mobile o emulación Android:

1. Abrir `/dashboard`.
2. Confirmar que el home se ordena por secciones:
   - Acceso y estado
   - Entrenamiento y agenda
   - Evolución física
   - Soporte del gimnasio
   - Atajos secundarios
3. Confirmar que las tarjetas existentes siguen funcionando.
4. Confirmar que no aparece navegación a módulos restringidos por RBAC.
5. Confirmar que desktop mantiene el layout anterior.

## Resultado esperado

El dashboard mobile del socio queda más claro, jerarquizado y usable como pantalla principal de una PWA instalada.
