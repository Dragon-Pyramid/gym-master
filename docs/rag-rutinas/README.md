# RAG Rutinas — Índice documental

Esta carpeta documenta la preparación del dataset/corpus inicial, la base de conocimiento y las integraciones iniciales para el futuro `gym-master-rag-coach`.

## Documentos

| Archivo | Descripción |
|---|---|
| `rag-rutinas-dataset-prompts.md` | Plan maestro de dataset y corpus inicial. |
| `rag-rutinas-json-schema.md` | Estructura funcional de salida JSON. |
| `rag-rutinas-validation-rules.md` | Reglas de validación deportiva/técnica. |
| `rag-rutinas-assistant-bridge.md` | Puente inicial entre Gym Master y el futuro microservicio `gym-master-rag-coach`. |
| `rag-rutinas-voice-input.md` | Entrada por voz para que el socio pueda dictar texto en el asistente. |
| `rag-rutinas-conversational-flow.md` | Evolución del asistente hacia un flujo conversacional con ayuda y resumen previo. |
| `knowledge-base/README.md` | Base de conocimiento funcional del coach de rutinas. |
| `prompts/prompt-maestro-rutina-dieta-json.md` | Prompt principal para generar rutina, dieta y JSON. |
| `prompts/prompt-generacion-pdf-rutina.md` | Prompt para PDF de rutina. |
| `prompts/prompt-generacion-pdf-dieta.md` | Prompt para PDF de dieta. |
| `datasets/rag-rutinas-matriz-prioritaria.csv` | Matriz de combinaciones prioritaria. |
| `datasets/rag-rutinas-prompts-prioritarios.md` | Bloques de parámetros para ejecutar prompts. |

## Orden recomendado de uso

```txt
1. Usar prompts para generar PDF rutina + PDF dieta + JSON.
2. Curar el contenido generado.
3. Validar reglas deportivas y técnicas.
4. Mapear ejercicios contra DB real de Gym Master.
5. Asociar imágenes/GIF/videos disponibles.
6. Incorporar contenido curado como knowledge base RAG.
7. Conectar el asistente de Gym Master con el microservicio `gym-master-rag-coach`.
```

## Experiencia esperada

La experiencia final apunta a que el socio pueda conversar naturalmente con el asistente.

Los campos actuales de objetivo, nivel y días pueden funcionar como modo rápido o fallback, pero la evolución futura deberá permitir inferir esos parámetros desde la conversación.

La entrada por voz se incorpora como ayuda de accesibilidad/UX para que el socio pueda dictar texto, revisarlo y enviarlo sin depender de escribir mucho en mobile.

## Nota

Este material es corpus/benchmark y knowledge base RAG. No debe confundirse con fine-tuning ni con entrenamiento directo del modelo.
