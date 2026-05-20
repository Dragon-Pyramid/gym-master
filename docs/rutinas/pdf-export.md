# Gym Master — Exportación profesional de rutinas en PDF

## Contexto

Durante la prueba funcional del módulo Rutinas se detectó que el flujo anterior de visualización/exportación no aportaba valor operativo:

- Al presionar `VER`, se abría un modal de detalle genérico que no mostraba información útil.
- El botón interno `Ver ejercicios` abría otro modal con una exportación a PDF vacía.
- El PDF generado solo incluía el título `Ejercicios por día`, sin datos del socio, rutina, días ni ejercicios.

## Objetivo de la rama

Implementar una exportación de rutina en PDF directamente desde la vista real de rutina, con un diseño útil para imprimir, compartir o entregar al socio.

## Cambios funcionales

- Se elimina el flujo visual del modal de detalle genérico al presionar `VER`.
- La acción `VER` abre directamente la vista completa de la rutina.
- Se agrega un botón `Descargar rutina` en el encabezado de la rutina, junto al botón `Volver`.
- El PDF incluye:
  - logo de Gym Master,
  - nombre del socio,
  - título de rutina,
  - fecha de creación,
  - fecha de actualización,
  - ID de rutina,
  - días ordenados,
  - ejercicios por día,
  - series,
  - repeticiones,
  - descanso,
  - imagen del ejercicio cuando exista,
  - fallback visual cuando no haya imagen.

## Cambios técnicos

### `src/components/dashboard/rutinas/RutinaDisplay.tsx`

- Se agregó el botón `Descargar rutina` en la vista de detalle.
- Se incorporó estado `exportingPdf` para evitar descargas duplicadas.
- Se integra la utilidad `descargarRutinaPdf`.
- Se mantiene la visualización de imágenes en pantalla mediante el ícono de ojo cuando el ejercicio tiene `imagen`.

### `src/utils/rutinaPdf.ts`

- Nueva utilidad client-side basada en `jsPDF`.
- Normaliza ejercicios de la rutina recibida.
- Genera un PDF A4 con encabezado visual.
- Intenta cargar el logo desde `/gm_logo.svg`.
- Intenta incluir imágenes de ejercicios cuando estén disponibles.
- Si la imagen no existe o no puede cargarse por CORS/formato, muestra `Imagen no disponible`.

### `src/app/dashboard/rutinas/page.tsx`

- Se elimina el uso del modal `RutinaModalView` para el botón `VER`.
- La visualización de rutina queda centralizada en `RutinaDisplay`.

## Consideraciones

- Los ejercicios Inicial/Intermedio cargados en la rama anterior tienen `imagen = NULL`, por lo tanto el PDF mostrará fallback para esos casos.
- Los ejercicios Avanzados que sí tengan URL de imagen deberían incluirla en el PDF si el recurso permite ser cargado desde el navegador.
- A futuro se recomienda crear una rama específica para cargar imágenes/gifs reales de ejercicios Inicial e Intermedio.

## Validaciones sugeridas

1. Ejecutar `npm run build`.
2. Iniciar sesión como socio.
3. Entrar a `Dashboard > Rutinas`.
4. Abrir una rutina con `VER`.
5. Confirmar que ya no se abre el modal genérico de detalle.
6. Confirmar que la vista completa de rutina abre correctamente.
7. Presionar `Descargar rutina`.
8. Validar que el PDF incluya encabezado, socio, días, ejercicios y datos básicos.
9. Probar con rutina Inicial/Intermedia sin imágenes.
10. Probar con rutina Avanzada con imágenes.
