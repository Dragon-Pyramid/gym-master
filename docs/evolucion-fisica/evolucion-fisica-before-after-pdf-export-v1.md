# Evolución Física — Before/After PDF Export v1

## Objetivo

Agregar al PDF de evolución física una captura profesional del estudio visual antes/después validado en pantalla.

## Alcance

Se modifica la exportación PDF para incluir:

- mapa corporal antes/después;
- modo activo: slider, superpuesto o heatmap;
- vista activa: frente o espalda;
- etiquetas de medición antes y después;
- lectura general: Favorable, Estable o A revisar;
- uso de las siluetas ya calibradas por sexo.

## Archivos modificados

- `src/components/dashboard/evolucion-fisica/EvolucionFisicaBeforeAfterStudio.tsx`
- `src/app/dashboard/evolucion-fisica/page.tsx`
- `src/app/dashboard/gestor-evolucion-fisica/socio/[socioId]/page.tsx`
- `src/utils/evolucionFisicaPdf.ts`

## Archivo nuevo

- `src/utils/evolucionFisicaBeforeAfterSnapshots.ts`

## Cambios principales

### Estudio visual

Se agregaron atributos `data-*` al panel visual y a sus capas internas para poder capturar la composición visible desde el navegador sin alterar la UI.

### Captura para PDF

Se creó una utilidad que:

- espera el render del navegador;
- localiza el panel antes/después;
- serializa los SVG internos;
- embebe las imágenes PNG usadas como siluetas;
- compone el resultado en un canvas exportable;
- devuelve un snapshot listo para `jsPDF`.

### PDF

El PDF ahora recibe `beforeAfterVisuals` y agrega la sección:

`Estudio visual antes/después`

antes de la visualización biométrica existente.

### Vista administrativa

La pantalla:

`/dashboard/gestor-evolucion-fisica/socio/[socioId]`

ahora incorpora botón `Descargar PDF`, usando los registros del socio y la captura del estudio visual.

## Validación sugerida

1. Abrir `/dashboard/evolucion-fisica`.
2. Seleccionar un socio con al menos dos registros.
3. Elegir Frente/Espalda y Slider/Superpuesto/Heatmap.
4. Descargar PDF.
5. Confirmar que el PDF incluye la sección `Estudio visual antes/después`.
6. Repetir desde `/dashboard/gestor-evolucion-fisica/socio/[socioId]`.
7. Confirmar que el PDF respeta sexo, silueta frente/espalda y modo activo.

## Notas técnicas

- No se agregan dependencias nuevas.
- No se cambia base de datos.
- No se modifican coordenadas musculares ni calibraciones visuales.
- La captura se basa en canvas nativo del navegador y `jsPDF`.
