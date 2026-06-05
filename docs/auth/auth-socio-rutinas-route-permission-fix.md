# Gym Master — Fix permiso ruta Rutinas socio

## Rama

`feature/auth-usuarios-socios-normalizacion`

## Motivo

Durante QA de la normalización `usuario ↔ socio`, un socio nuevo pudo iniciar sesión y generar una rutina, pero al intentar ingresar a `/dashboard/rutinas` recibió el bloqueo:

> USTED NO TIENE ACCESO A ESTE MENÚ

El problema no estaba en la creación del socio ni en la rutina generada. La ruta `/dashboard/rutinas` no estaba mapeada explícitamente en `DASHBOARD_ROUTE_PERMISSIONS`, por lo que el guard la trataba como ruta no mapeada y solo permitía acceso a administradores.

## Ajuste aplicado

Se agregó una regla explícita para:

- Ruta: `/dashboard/rutinas`
- Permiso requerido: `Asistente de Rutinas`
- Roles permitidos: `socio`, `admin`
- Matching: prefijo (`exact: false`)

La ruta administrativa `/dashboard/rutinas/media` se mantiene protegida por el permiso `Media de Ejercicios`, porque su path es más específico y el algoritmo de permisos ordena primero las rutas más largas.

## Impacto

- El socio con permiso `Asistente de Rutinas` puede ingresar a `/dashboard/rutinas`.
- No se habilita acceso administrativo a media de ejercicios para socios.
- No requiere migración de base de datos.
- No modifica datos existentes.
