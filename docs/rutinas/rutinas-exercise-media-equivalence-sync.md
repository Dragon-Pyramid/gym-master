# Rutinas - Sincronización de media entre ejercicios equivalentes

## Rama

`feature/rutinas-exercise-media-equivalence-sync`

## Objetivo

Reutilizar imágenes/GIFs y videos ya cargados en ejercicios equivalentes para reducir carga manual de media. La fuente prioritaria es el objetivo **Volumen** en nivel **Avanzado**, porque contiene la mayor cobertura de imágenes/GIFs reales.

## Alcance

La feature agrega un proceso administrativo para:

- detectar ejercicios equivalentes por nombre canónico y grupo muscular;
- previsualizar candidatos antes de modificar datos;
- aplicar sincronización solo en ejercicios con fallback o imagen vacía;
- copiar imagen, origen, `cloudinary_public_id`, video YouTube y `youtube_video_id`;
- crear/actualizar la media principal en `ejercicio_media`;
- evitar sobrescribir ejercicios que ya tienen media real.

## Endpoint

`POST /api/rutinas/ejercicios-media/equivalence-sync`

Payload de previsualización:

```json
{
  "apply": false,
  "limit": 500
}
```

Payload de aplicación:

```json
{
  "apply": true,
  "limit": 500
}
```

Requiere rol administrador.

## Criterio de seguridad

El matching no usa fuzzy matching destructivo. Solo sincroniza cuando existe coincidencia canónica conservadora y mismo grupo muscular. Las coincidencias dudosas deben revisarse manualmente en futuras iteraciones.

## UI

En `/dashboard/rutinas/media` se agregan botones para:

- detectar equivalencias;
- aplicar equivalencias;
- ver reporte de fuentes, candidatos, aplicados y pendientes.

## Validación

Ejecutar:

```bash
docker exec -i supabase_db_gym-master psql -U postgres -d postgres < database/scripts/validar_rutinas_exercise_media_equivalence_sync.sql
```

## Relación futura

Esta feature complementa la importación a Cloudinary. Más adelante se puede evolucionar a:

- reporte de candidatos dudosos;
- alias administrables desde DB;
- matching semántico asistido por IA;
- sincronización masiva posterior a importación Cloudinary.
