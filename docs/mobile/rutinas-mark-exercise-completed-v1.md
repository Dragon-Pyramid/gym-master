# Rutinas - marcado de ejercicios completados v1

## Feature

`feature/rutinas-mark-exercise-completed-v1`

## Objetivo

Mejorar la experiencia mobile del socio dentro del detalle de rutina, permitiendo marcar ejercicios como completados durante el entrenamiento y visualizar el avance personal de la rutina.

## Alcance funcional

- Se agrega progreso personal por rutina en el detalle de `/dashboard/rutinas`.
- El socio puede marcar cada ejercicio como completado.
- El socio puede reabrir un ejercicio marcado por error.
- Se muestra avance general de la rutina en porcentaje.
- Se muestra contador `completados / total` por rutina y por día.
- Se agrega botón para reiniciar el progreso local de la rutina.
- Los ejercicios completados cambian visualmente con badge y resaltado verde.
- La funcionalidad se limita al rol socio para no contaminar la revisión administrativa.

## Persistencia

No se agrega migración ni tabla nueva. El progreso se guarda en `localStorage` por usuario y rutina.

Motivo: en el estado actual del schema no existe una tabla formal de sesiones de entrenamiento o historial de ejercicios completados. Para esta feature se prioriza una experiencia usable y segura sin inventar persistencia de negocio. La persistencia histórica multi-dispositivo queda para la siguiente feature del roadmap: `feature/rutinas-training-session-history-v1`.

## Layout

Se ajusta `/dashboard/rutinas` a shell vertical `Header / Contenido / Footer` con `100dvh` y scroll interno del contenido para reducir el riesgo de espacio blanco luego del footer al salir de F12 mobile.

## Archivos modificados

- `src/app/dashboard/rutinas/page.tsx`
- `src/components/dashboard/rutinas/RutinaDisplay.tsx`

## Sin cambios

- No modifica DB.
- No modifica endpoints.
- No modifica Swagger.
- No modifica generación de rutinas.
- No modifica PDF de rutinas.

## QA sugerido

1. Entrar como socio a `/dashboard/rutinas`.
2. Abrir una rutina.
3. Confirmar que aparece el bloque de avance personal.
4. Marcar ejercicios como completados.
5. Confirmar que sube el porcentaje.
6. Cambiar de día y confirmar contador por día.
7. Reabrir un ejercicio completado.
8. Reiniciar progreso.
9. Recargar la página y confirmar que el progreso se mantiene en el dispositivo.
10. Entrar como admin y confirmar que el flujo de gestión de rutinas no queda contaminado con acciones personales de progreso.
11. Probar modo mobile/F12 y salida a desktop para validar footer.
