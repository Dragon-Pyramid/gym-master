# Informe ejecutivo — Rutinas: fallback visual para ejercicios sin imagen

## 1. Resumen ejecutivo

Se incorporó una mejora en el módulo de rutinas para resolver el problema visual detectado en ejercicios de niveles Inicial e Intermedio que no tenían imagen asociada.

El sistema ya podía generar rutinas para esos niveles, pero al no existir valor en la columna `imagen`, algunos componentes visuales no mostraban el botón/ícono de visualización o no tenían recurso para exportación.

## 2. Objetivo

Agregar un fallback visual controlado, versionado y seguro para ejercicios sin imagen, evitando inconsistencias visuales y preparando la base para una carga posterior de imágenes reales.

## 3. Cambios incorporados

- Asset SVG local para imagen no disponible.
- Migración SQL defensiva para completar `public.ejercicio.imagen`.
- Script de validación SQL.
- Documentación técnica de la feature.

## 4. Impacto funcional

- Las rutinas Iniciales e Intermedias tendrán un recurso visual disponible.
- Se reduce la diferencia de comportamiento entre rutinas avanzadas y rutinas de menor nivel.
- El PDF de rutinas tendrá un fallback visual cuando el ejercicio no tenga imagen real.

## 5. Alcance excluido

No se cargaron imágenes reales por ejercicio. Esta tarea requiere una curaduría posterior de recursos gráficos/gifs/videos y validación de licencias.

## 6. Próximos pasos sugeridos

- Validar migración en Supabase local.
- Aplicar remoto con Supabase CLI.
- Probar generación de rutina Inicial e Intermedia.
- Exportar PDF de rutina.
- Planificar carga de imágenes reales por grupo muscular.
