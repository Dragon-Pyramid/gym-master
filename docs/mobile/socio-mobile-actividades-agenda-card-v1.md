# Socio Mobile - Actividades / Agenda Card v1

## Objetivo

Agregar una tarjeta mobile en el dashboard del socio para consultar rápidamente actividades, horarios y cupos disponibles del gimnasio.

## Alcance

- Frontend mobile para rol `socio`.
- Reutiliza el dashboard existente de actividades/turnos/cupos.
- No agrega tablas, columnas ni migraciones.
- No modifica backend ni reglas de autenticación.
- No afecta la vista desktop del dashboard socio.

## Cambios principales

- Nueva tarjeta `SocioMobileActividadesAgendaCard`.
- Integración en `DashboardInitialContent` dentro del home mobile del socio.
- Consulta de datos mediante `fetchActividadesTurnosCuposDashboard()`.
- Muestra próximos turnos activos ordenados por ocurrencia semanal.
- Resalta actividades de hoy.
- Informa cupos disponibles, horario, inscriptos, ubicación y vigencia.
- Agrega accesos directos a `/dashboard/actividades`.
- Estados contemplados: carga, error, sin turnos activos y agenda disponible.

## Archivos modificados

- `src/components/dashboard/DashboardInitialContent.tsx`
- `src/components/dashboard/socio/SocioMobileActividadesAgendaCard.tsx`
- `docs/mobile/socio-mobile-actividades-agenda-card-v1.md`

## Validación sugerida

1. Iniciar sesión como socio desde Android o emulación mobile.
2. Abrir `/dashboard`.
3. Verificar tarjeta `Agenda del gimnasio`.
4. Confirmar que lista actividades activas próximas.
5. Verificar cupos, horarios, ubicación e inscriptos.
6. Probar botones `Ver agenda` y `Actividades`.
7. Confirmar que desktop no se ve afectado.

## Resultado esperado

El socio puede ver desde el home mobile qué actividades o clases están disponibles, cuándo se dictan y si quedan cupos, sin navegar primero por el módulo completo.
