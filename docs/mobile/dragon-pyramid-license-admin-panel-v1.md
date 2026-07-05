# Dragon Pyramid License Admin Panel v1

## Rama

`feature/dragon-pyramid-license-admin-panel-v1`

## Objetivo

Consolidar el panel interno de Master Admin de Dragon Pyramid dentro de Gym Master, usando la base ya construida de licencia, estado de pago, advertencias, suspensión y reactivación.

## Alcance implementado

- Mejora de `/dashboard/masteradmin/license` como panel operativo central.
- Resumen ampliado de licencia, pago, estado operativo, vencimiento y monto esperado.
- Nuevo bloque **Panel operativo Master Admin**.
- Acciones rápidas:
  - Marcar al día.
  - Activar trial por 14 días.
  - Poner en gracia por 7 días.
  - Marcar pago vencido.
  - Suspender servicio.
  - Cancelar servicio.
- Confirmación previa para acciones críticas de suspensión/cancelación.
- Línea visual básica de última validación, última reactivación y última suspensión.
- Mantenimiento de acceso reservado por `/auth/login/masteradmin`.
- Responsive mobile/desktop preservado.
- Footer dentro del shell controlado sin espacio blanco posterior.

## Reglas operativas

- `suspended` y `cancelled` bloquean el acceso operativo de admin, usuarios y socios.
- `overdue`, `grace` y `suspended_candidate` advierten, pero no bloquean por sí solos.
- Master Admin puede seguir entrando para regularizar o reactivar.
- La futura Dragon Pyramid Platform seguirá usando `/api/internal/dragon-pyramid/license-sync`.

## Base de datos

No requiere migración. Reutiliza la estructura ya aplicada y validada en features anteriores de licencia/pago.

## Archivos modificados

- `src/app/dashboard/masteradmin/license/page.tsx`
- `docs/mobile/dragon-pyramid-license-admin-panel-v1.md`

## QA sugerido

1. Entrar con masteradmin a `/auth/login/masteradmin`.
2. Confirmar acceso directo a `/dashboard/masteradmin/license`.
3. Ver el nuevo panel operativo.
4. Probar acción rápida **Marcar al día**.
5. Probar **Activar trial**.
6. Probar **Poner en gracia**.
7. Probar **Marcar vencido** y validar advertencia sin bloqueo.
8. Probar **Suspender servicio** y confirmar bloqueo operativo.
9. Probar **Cancelar servicio** y confirmar bloqueo operativo.
10. Reactivar servicio y confirmar que admin/socio vuelven a operar.
11. Probar F12 mobile y desktop.
12. Ejecutar `npm run build`.
