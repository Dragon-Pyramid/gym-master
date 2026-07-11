# i18n ES/EN admin dashboard final sweep — Asistencias aforo fix v1

## Rama
`feature/i18n-es-en-admin-dashboard-final-sweep-v1`

## Alcance
Corrección puntual de textos residuales en `/dashboard/asistencias/aforo` cuando la plataforma está en idioma Inglés.

## Problema detectado
En la vista de salida y aforo todavía aparecían textos en Español y una mezcla generada por traducción parcial como `Currentizando...`.

Textos detectados:
- Control de salida y aforo
- Monitoreo operativo en vivo de personas dentro del gimnasio.
- Capacidad máxima
- Configurable por entorno
- Entradas de hoy
- Salidas de hoy
- Abiertas antiguas
- Última lectura
- Socios dentro ahora / Members dentro ahora
- No hay socios dentro en este momento.
- Movimientos recientes
- Todavía no hay movimientos registrados hoy.
- Volver al listado
- Actualizando / Currentizando

## Cambios realizados
- Se incorporó `useI18n()` en la página de aforo.
- Se agregó helper local `text(es, en)` para traducciones quirúrgicas sin cambiar contratos.
- Se tradujeron títulos, subtítulos, cards, botones, estados vacíos, confirmaciones, toasts y filas de movimientos.
- Se agregó traducción segura para `estado` y `mensaje_estado` del aforo.
- Se reemplazó el texto de refresco en Inglés por `Refreshing...` para evitar la mezcla `Currentizando...`.

## Archivos modificados
- `src/app/dashboard/asistencias/aforo/page.tsx`

## Sin cambios en
- Base de datos.
- Migraciones.
- Endpoints.
- Swagger/OpenAPI.
- Permisos/RBAC.
- Servicios de asistencia/aforo.
- Terminal QR.

## QA sugerido
1. Entrar a `/dashboard/asistencias/aforo`.
2. Cambiar idioma a Inglés.
3. Confirmar que no aparece Español en títulos, cards, botones, estados vacíos ni refresco.
4. Presionar `Refresh` y confirmar `Refreshing...`.
5. Validar estado `Normal` y mensaje `Normal occupancy. Operational capacity is available.`.
6. Probar modo claro y oscuro.
7. Probar F12 mobile y volver a desktop.
8. Confirmar que no hay scroll horizontal ni espacio blanco después del footer.

## Nota
Esta corrección queda dentro del sweep final de i18n admin y no requiere documentación Swagger porque no modifica contratos API.
