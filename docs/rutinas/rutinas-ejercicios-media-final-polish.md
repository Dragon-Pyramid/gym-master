# Gym Master — Rutinas / Ejercicios / Media final polish

## Rama

`feature/rutinas-ejercicios-media-final-polish`

## Objetivo

Preparar el catálogo visual de ejercicios para que pueda alimentar con mayor calidad la experiencia web, mobile, PDF y el futuro RAG de rutinas/dietas.

Esta rama no modifica la lógica de generación de rutinas ni la base de datos. Su foco es mejorar la auditoría visual y operativa del banco de media.

## Cambios incluidos

### Catálogo visual de ejercicios

Ruta impactada:

`/dashboard/rutinas/media`

Se agregó un bloque de preparación del catálogo para RAG y experiencia mobile con:

- cobertura de imágenes en Cloudinary;
- cobertura de videos YouTube;
- estimación de base completa;
- accesos rápidos para ver pendientes de imagen;
- accesos rápidos para ver pendientes de video;
- acceso rápido para revisar YouTube;
- limpieza de filtros de auditoría.

### Calidad por ejercicio

Cada ejercicio ahora muestra un estado comercial/técnico:

- `Completo`: imagen segura + video + revisión suficiente;
- `Revisar video`: imagen y video existentes, pero video pendiente de validación final;
- `Parcial`: tiene imagen o video, pero no ambos;
- `Pendiente`: falta imagen segura y video.

### Mobile del catálogo

En celulares, el catálogo deja de depender de una tabla horizontal y muestra cards táctiles por ejercicio con:

- imagen principal;
- nombre;
- grupo muscular / objetivo;
- estado de calidad;
- estado de imagen;
- estado de video;
- accesos rápidos a video ES/EN cuando existen.

### Panel de detalle

El panel lateral agrega una lectura directa del estado del ejercicio para socio/RAG, indicando si falta imagen Cloudinary o video de técnica.

## Recorrido de validación

1. Ir a `/dashboard/rutinas/media`.
2. Verificar el bloque “Preparación del catálogo para RAG y experiencia mobile”.
3. Usar “Ver pendientes de imagen”.
4. Usar “Ver pendientes de video”.
5. Usar “Revisar YouTube”.
6. Usar “Limpiar auditoría”.
7. Probar en desktop que la tabla mantiene acciones de edición y acceso a videos ES/EN.
8. Probar en DevTools mobile, idealmente `iPhone 12 Pro` y `Pixel 7`, que se muestran cards sin scroll horizontal.
9. Seleccionar un ejercicio y validar que el panel de detalle muestre el estado para socio/RAG.

## Validación técnica

```bash
npm run build
npm run test:e2e
```

## Observaciones

No requiere migración de base de datos ni cambios SQL.

Esta rama prepara la calidad visual del catálogo antes de una futura integración RAG fuerte, evitando que el asistente recomiende ejercicios sin media o con videos pendientes de revisión.
