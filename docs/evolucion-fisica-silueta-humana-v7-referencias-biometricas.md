# Evolución física - Silueta humana v7 referencias biométricas

## Resumen

Esta versión cambia el enfoque técnico para acercarse al mock ideal. En lugar de construir o deformar el cuerpo mediante geometría, usa referencias visuales humanas reales preprocesadas como assets transparentes.

## Cambios principales

- Se agregan cuatro assets:
  - male-soft
  - male-athletic
  - female-soft
  - female-athletic
- Se selecciona el sexo por `sexo_referencia`.
- Cada registro calcula un score visual independiente.
- El score mezcla visualmente la referencia soft y athletic.
- No se asume que el registro inicial sea sobrepeso.
- Permite representar pérdida de grasa, reducción de cintura, ganancia de masa muscular, aumento de brazo/muslo y recomposición corporal.

## Alcance

- No modifica base de datos.
- No modifica APIs.
- No modifica PDF.
- No modifica charts ni tabla.
- Reemplaza `EvolucionFisicaHumanSilhouette.tsx`.
- Agrega assets en `public/images/evolucion-fisica/siluetas`.

## Próximas mejoras

- Agregar un tercer estado visual para socios delgados con baja masa muscular.
- Agregar un estado muscular avanzado.
- Reutilizar estas referencias en el PDF.
- Crear variantes por sexo y tipo corporal.
