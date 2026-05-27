# Criterios de curación del conocimiento

## Objetivo

Definir cómo revisar y aceptar rutinas/dietas/PDF/JSON generados para alimentar el corpus del RAG.

## El contenido se acepta si

- Respeta objetivo, nivel y días.
- Tiene orden de ejercicios coherente.
- Usa volumen e intensidad razonables.
- Incluye progresión.
- Incluye advertencias.
- Puede mapearse a ejercicios reales de Gym Master.
- No contradice reglas de seguridad.
- No copia una rutina anterior de forma idéntica.

## El contenido se rechaza o marca para revisión si

- Recomienda ejercicios incompatibles con lesión/restricción.
- Tiene volumen excesivo para iniciales.
- Propone déficit/superávit extremo.
- Usa ejercicios inexistentes sin alternativa real.
- Mezcla objetivos contradictorios sin explicación.
- No cubre grupos musculares básicos.
- No respeta cantidad de días solicitada.

## Etiquetas sugeridas

```txt
aprobado
requiere_revision
rechazado
pendiente_mapeo_ejercicios
pendiente_media
pendiente_traduccion
```

## Relación con PDFs

Los PDF de rutina/dieta sirven como material humano/comercial, pero el JSON estructurado es el insumo técnico principal para automatización y RAG.
