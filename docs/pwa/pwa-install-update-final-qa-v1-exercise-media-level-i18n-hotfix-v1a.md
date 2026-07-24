# Gym Master — PWA Install/Update Final QA v1

## Hotfix v1a: niveles ES/EN en Exercise Media

### Hallazgo de QA
Durante la validación de la PWA instalada en Microsoft Edge, la pantalla `/dashboard/rutinas/media` mostraba los niveles core en español aunque el locale activo fuera inglés.

### Corrección
Se reutiliza `translateCoreLevel` para localizar los niveles controlados por Gym Master en:

- filtro de niveles;
- tabla del catálogo multimedia;
- panel de detalle;
- equivalencias automáticas de nivel origen/destino.

### Gobernanza de datos
La corrección solo traduce niveles core conocidos, por ejemplo:

- Inicial → Beginner
- Intermedio → Intermediate
- Avanzado → Advanced
- Experto → Expert

Los valores no reconocidos o personalizados se conservan sin modificación. No se alteran IDs ni datos persistidos.

### Impacto
- Sin cambios de base de datos.
- Sin migraciones.
- Sin cambios de API, RLS, RPC o permisos.
- Sin cambios en instalación, manifest, service worker o política de caché.
