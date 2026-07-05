# Gym Master — Admin Socios 360 Profile v1

## Rama

`feature/admin-socios-360-profile-v1`

## Objetivo

Consolidar una vista 360° del socio para el administrador, evitando que tenga que navegar manualmente por módulos separados para entender el estado general de una persona.

## Alcance aplicado

- Pulido de `/dashboard/socios` como entrada administrativa a Socios 360.
- Header ejecutivo y métricas superiores del listado.
- Acción `360` en la tabla de socios.
- Modal de perfil 360° con información transversal.
- Consulta tolerante a fallos de módulos existentes.
- Resumen de cuota, ficha médica, rutinas, dietas, evolución física, mensajes y actividades.
- Accesos rápidos a módulos relacionados.
- Responsive mobile/desktop.
- Shell vertical `Header / Contenido / Footer` para evitar espacio blanco posterior al footer.

## Archivos modificados

- `src/app/dashboard/socios/page.tsx`
- `src/components/modal/SocioViewModal.tsx`
- `src/components/tables/SociosTable.tsx`

## Archivos nuevos

- `src/interfaces/socio360.interface.ts`
- `src/services/browser/socio360ApiClient.ts`
- `docs/mobile/admin-socios-360-profile-v1.md`

## Integraciones reutilizadas

Se reutilizan endpoints existentes:

- `/api/cuota-estado?socio_id=:id`
- `/api/rutina/:idSocio`
- `/api/dieta/socio/:id`
- `/api/evolucion_socio/:socio_id`
- `/api/socios/:id/ficha-medica/actual`
- `/api/socios/:id/ficha-medica/historial`
- `/api/admin/socios-mensajes`
- `/api/actividades/turnos-cupos`

## Decisión técnica

No se agrega migración ni endpoint nuevo. La vista 360 se arma desde el frontend con un cliente browser dedicado y llamadas tolerantes a errores. Si algún módulo no responde, el perfil base sigue visible y se muestra un aviso de resumen parcial.

## Seguridad

No se exponen datos nuevos fuera de los permisos existentes. La vista queda dentro del flujo autenticado del dashboard de administración.

## QA sugerido

1. Entrar como admin a `/dashboard/socios`.
2. Confirmar header Socios 360 y métricas superiores.
3. Buscar un socio por nombre/DNI/email/teléfono.
4. Presionar acción `360`.
5. Confirmar apertura del modal.
6. Revisar cuota, ficha médica, rutinas, dietas, evolución, mensajes y actividades.
7. Probar si algún módulo no tiene datos.
8. Probar modo claro/oscuro.
9. Probar F12 mobile.
10. Confirmar que no queda espacio blanco después del footer.
