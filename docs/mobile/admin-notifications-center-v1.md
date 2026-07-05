# Gym Master - Admin Notifications Center v1

## Rama

`feature/admin-notifications-center-v1`

## Objetivo

Consolidar el centro de notificaciones del administrador como una vista operativa clara para revisar campañas, avisos programados, alertas de sistema, terminal y envíos a socios.

## Alcance implementado

- Pulido de `/dashboard/notificaciones` para rol administrador.
- Header ejecutivo con acciones rápidas: actualizar y nueva notificación.
- Métricas ampliadas:
  - registros filtrados;
  - enviadas;
  - programadas;
  - con error;
  - visibles en Terminal;
  - porcentaje de entrega.
- Nuevo bloque de salud operativa:
  - próximas 48 horas;
  - borradores;
  - notificaciones sin destinatarios.
- Nuevo bloque de prioridades administrativas:
  - errores de envío;
  - notificaciones programadas próximas;
  - acceso directo al detalle.
- Filtros más claros con opción para limpiar filtros activos.
- Exportación Excel/PDF preservada y ampliada con errores.
- Campanita del header mejorada con acceso al centro completo.
- Responsive mobile/desktop y shell vertical `Header / Contenido / Footer` para evitar espacio blanco luego del footer.

## Archivos modificados

- `src/app/dashboard/notificaciones/page.tsx`
- `src/components/header/HeaderNotificationsBell.tsx`
- `docs/mobile/admin-notifications-center-v1.md`

## Fuera de alcance

- No se modifican tablas ni migraciones.
- No se cambian contratos de endpoints existentes.
- No se modifica la lógica de envío/cancelación.
- No se alteran permisos RBAC.

## QA sugerido

1. Ingresar como admin a `/dashboard/notificaciones`.
2. Confirmar métricas superiores.
3. Confirmar bloque de salud operativa.
4. Confirmar bloque de prioridades.
5. Probar filtros por búsqueda, estado, tipo y fechas.
6. Probar limpiar filtros.
7. Ver detalle de una notificación desde prioridades y desde listado.
8. Crear/editar notificación.
9. Enviar/cancelar según estado.
10. Exportar Excel y PDF.
11. Abrir campanita del header y entrar al centro completo.
12. Probar mobile/F12 y confirmar que no hay scroll horizontal ni espacio blanco después del footer.
