# Media de ejercicios: imagen, GIF y YouTube

## Propósito

Definir cómo el RAG debe usar recursos visuales asociados a ejercicios.

## Fuentes de media

- `ejercicio.imagen`
- `ejercicio.imagen_origen`
- `ejercicio.cloudinary_public_id`
- `ejercicio.video_youtube_url`
- `ejercicio.youtube_video_id`
- `ejercicio_media`

## Reglas

1. Priorizar media Cloudinary.
2. Si no hay Cloudinary, usar imagen/GIF externa validada.
3. Si no hay media real, usar fallback visual.
4. Para PDF, usar imagen estática o primer frame cuando corresponda.
5. Para web/mobile, mostrar GIF o imagen real.
6. Para explicación técnica, mostrar botón de YouTube si existe.

## Fuente prioritaria para sincronización

Volumen Avanzado contiene la mayor cobertura de GIFs/imágenes reales y debe usarse como fuente prioritaria para copiar media a ejercicios equivalentes.

## Criterio de equivalencia

Copiar media solo si:

- el nombre normalizado coincide de forma segura;
- el grupo muscular coincide;
- el destino tiene fallback o imagen vacía;
- no se pisa media real existente.

## Ejemplo

```txt
Volumen Avanzado → Press de banca → GIF real
Definición Inicial → Press de banca → fallback
Resultado → Definición Inicial recibe media real
```

## YouTube

El video debe ser complementario, no obligatorio. Debe validarse:

- que sea URL de YouTube válida;
- que corresponda al ejercicio;
- que no contradiga la técnica indicada;
- que pueda mostrarse como enlace/card.
