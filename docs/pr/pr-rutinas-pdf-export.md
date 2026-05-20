# PR: Exportación profesional de rutinas en PDF

## Descripción

Este PR mejora el flujo de visualización y exportación de rutinas en Gym Master.

Durante las pruebas funcionales se detectó que, al ingresar a una rutina, el sistema abría un modal de detalle genérico que no aportaba información útil. Dentro de ese modal existía una opción para ver ejercicios/exportar PDF, pero el archivo generado quedaba vacío, mostrando únicamente el texto `Ejercicios por día`.

Con este cambio, la visualización se simplifica: al presionar `VER`, el usuario accede directamente a la vista completa de la rutina. Desde esa vista se incorpora un botón `Descargar rutina`, ubicado junto al botón `Volver`, que genera un PDF estructurado con la información real de la rutina.

## Cambios principales

### Frontend

- Se elimina la apertura del modal genérico de detalle al presionar `VER`.
- La acción `VER` muestra directamente la vista completa de la rutina.
- Se agrega el botón `Descargar rutina` en el encabezado de la vista de rutina.
- Se incorpora feedback visual mientras se genera el PDF.
- Se mantiene el botón `Volver` para regresar al listado.

### Exportación PDF

Se agrega una nueva utilidad:

- `src/utils/rutinaPdf.ts`

El PDF generado incluye:

- logo de Gym Master,
- nombre del socio,
- título de la rutina,
- fecha de creación,
- fecha de actualización,
- ID de rutina,
- días ordenados,
- ejercicios por día,
- series,
- repeticiones,
- descanso,
- imagen del ejercicio cuando exista,
- fallback `Imagen no disponible` cuando no exista imagen o no pueda cargarse.

### Limpieza de flujo anterior

- Se elimina el uso de `RutinaModalView` desde `src/app/dashboard/rutinas/page.tsx`.
- La vista de rutina queda centralizada en `RutinaDisplay`.

## Archivos modificados

- `src/app/dashboard/rutinas/page.tsx`
- `src/components/dashboard/rutinas/RutinaDisplay.tsx`
- `src/utils/rutinaPdf.ts`
- `docs/rutinas/pdf-export.md`

## Validaciones sugeridas

- `npm run build`
- Login como socio.
- Ingresar a `Dashboard > Rutinas`.
- Presionar `VER` sobre una rutina.
- Confirmar que ya no aparece el modal genérico de detalle.
- Presionar `Descargar rutina`.
- Confirmar que el PDF incluye datos reales de la rutina.
- Probar rutina Inicial o Intermedia sin imágenes.
- Probar rutina Avanzada con imágenes.

## Notas

Los ejercicios cargados recientemente para niveles Inicial e Intermedio tienen `imagen = NULL`, por lo que el PDF mostrará un fallback visual para esos ejercicios. Esto no representa un error de exportación, sino una falta de datos visuales en el catálogo de ejercicios. Se recomienda trabajar luego una rama específica para cargar imágenes/gifs de ejercicios Inicial e Intermedio.
