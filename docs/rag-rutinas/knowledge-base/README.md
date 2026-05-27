# RAG Rutinas — Knowledge Base Coach

## Propósito

Esta carpeta define la base de conocimiento funcional para el futuro microservicio `gym-master-rag-coach`.

No es una implementación del RAG todavía. Es la capa documental/operativa que define cómo debe razonar el coach antes de generar una rutina o dieta compatible con Gym Master.

## Principios de diseño

El RAG no debe crear rutinas como una lista suelta de ejercicios. Debe construir una planificación semanal coherente según:

- objetivo del socio;
- nivel de entrenamiento;
- días disponibles;
- historial de rutinas previas;
- frecuencia muscular semanal;
- orden correcto de ejercicios;
- volumen, intensidad y descanso;
- ejercicios reales disponibles en la base de datos;
- media asociada: imágenes, GIFs y videos;
- idioma de salida;
- seguridad y advertencias.

## Estructura

| Carpeta / archivo | Descripción |
|---|---|
| `entrenamiento-reglas-generales.md` | Reglas generales de programación de entrenamiento. |
| `objetivos/` | Reglas específicas por objetivo comercial/deportivo. |
| `niveles/` | Reglas por nivel: inicial, intermedio, avanzado. |
| `distribucion-semanal/` | Plantillas recomendadas según cantidad de días. |
| `progresion-mensual.md` | Cómo evolucionar rutinas mes a mes. |
| `evitar-rutina-repetida.md` | Comparación contra rutina anterior del socio. |
| `uso-ejercicios-db.md` | Cómo usar ejercicios reales de Gym Master. |
| `media-ejercicios.md` | Uso de imagen/GIF/YouTube en web, PDF y mobile. |
| `salida-json-rag.md` | Contrato esperado de salida JSON. |
| `fuentes/criterios-curacion.md` | Criterios para curar respuestas/PDF/JSON antes de usarlos como conocimiento. |

## Flujo esperado del futuro RAG

```txt
Socio conversa con Gym Master Coach
↓
RAG identifica objetivo, nivel, días, restricciones e idioma
↓
RAG consulta reglas de esta knowledge base
↓
RAG consulta ejercicios reales disponibles en Gym Master
↓
RAG revisa rutina anterior del socio
↓
RAG genera JSON estructurado y explicación breve
↓
Backend valida JSON contra DB y reglas de seguridad
↓
Gym Master guarda la rutina formal
↓
Socio ve la rutina en el menú Rutinas
```

## Prioridad actual

La primera etapa del conocimiento se concentra en objetivos comerciales frecuentes:

1. Volumen.
2. Definición.
3. Bajar de peso.
4. Aumentar fuerza.
5. Mejorar resistencia.

Luego se ampliará a objetivos sensibles o más específicos:

- Rehabilitación física.
- Salud general.
- Preparación para competencia.
- Condición física postparto.
- Control del estrés.

## Relación con otras features

Esta knowledge base se apoya en features ya creadas o planificadas:

- `feature/rutinas-exercise-knowledge-base-seed`
- `feature/rutinas-exercise-media-catalog`
- `feature/rutinas-exercise-media-cloudinary-import`
- `feature/rutinas-exercise-media-equivalence-sync`
- `feature/rag-rutinas-dataset-prompts`
- futura `feature/rag-rutinas-assistant`

## Nota operativa

Este contenido debe ser usado como conocimiento recuperable/criterio de validación. No reemplaza evaluación profesional humana ni debe venderse como diagnóstico médico o nutricional.
