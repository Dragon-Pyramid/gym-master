# Notifications mobile polish v1

## Objetivo
Pulir la experiencia mobile del módulo de notificaciones y la campanita del header, manteniendo el flujo administrativo existente.

## Alcance
- Layout mobile con shell vertical `Header / Contenido / Footer` para evitar espacio blanco posterior al footer al salir de F12 mobile.
- Header visual para el centro de notificaciones.
- Métricas compactas y legibles en mobile/desktop.
- Filtros responsive para búsqueda, estado, tipo y rango de fechas.
- Cards mobile para notificaciones, evitando tabla horizontal en celular.
- Tabla desktop preservada para administración.
- Ajuste de la campanita del header para viewport mobile y scroll interno seguro.

## Archivos modificados
- `src/app/dashboard/notificaciones/page.tsx`
- `src/components/tables/NotificacionTable.tsx`
- `src/components/header/HeaderNotificationsBell.tsx`

## Notas técnicas
No se modifican endpoints ni base de datos. No requiere migración ni Swagger.
