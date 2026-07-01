# Rutinas - Ayuda de series y repeticiones v1

## Objetivo

Agregar una ayuda contextual para socios principiantes en la vista detalle de rutina, explicando en lenguaje simple la notación técnica de series y repeticiones.

## Problema detectado

La rutina mostraba indicaciones como `3-4 × 8-12` o `4 × 15-12-10-8`, entendibles para entrenadores o usuarios avanzados, pero poco claras para socios que recién comienzan.

## Solución aplicada

Se agregó un botón de información junto al badge de series/repeticiones de cada ejercicio. Al tocarlo, se abre un modal pequeño con una explicación adaptada al formato detectado.

## Ejemplos soportados

- `3 × 10`: explica que debe hacer 3 series de 10 repeticiones por serie.
- `3-4 × 8-12`: explica que debe hacer entre 3 a 4 series de entre 8 a 12 repeticiones por serie.
- `4 × 15-12-10-8`: explica una rutina piramidal descendente y recomienda subir el peso progresivamente manteniendo buena técnica.

## Alcance técnico

- Frontend only.
- Sin cambios en base de datos.
- Sin cambios backend.
- Sin modificar la generación de rutinas.
- Compatible con mobile y desktop.

## Archivo modificado

- `src/components/dashboard/rutinas/RutinaDisplay.tsx`

## Validación contra dump 2026-07-01

Se revisó el dump `backup_completo_gym_master_01072026` y la ayuda cubre los formatos reales encontrados en rutinas, ejercicios y reglas de generación:

- Series fijas: `3`, `4`, `5`.
- Rangos de series: `2-3`, `3-4`, `4-5`.
- Repeticiones fijas: `8`, `10`, `12`, `15`.
- Rangos de repeticiones: `3-5`, `4-8`, `8-12`, `10-15`, `12-15`, `12-20`, `15-20`.
- Series piramidales: `15-12-10-8`, `15-12-10`, `12-10-10-8`.
- Repeticiones por lado: `10-15 por lado`.
- Indicaciones por tiempo: `30-60 seg`.

La lógica evita explicar como “repeticiones” los ejercicios por tiempo y conserva la aclaración “por lado” cuando corresponde.
