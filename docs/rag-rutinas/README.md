# RAG Rutinas — Índice documental

Esta carpeta documenta la preparación del dataset/corpus inicial y la base de conocimiento para el futuro `gym-master-rag-coach`.

## Documentos

| Archivo | Descripción |
|---|---|
| `rag-rutinas-dataset-prompts.md` | Plan maestro de dataset y corpus inicial. |
| `rag-rutinas-json-schema.md` | Estructura funcional de salida JSON. |
| `rag-rutinas-validation-rules.md` | Reglas de validación deportiva/técnica. |
| `prompts/prompt-maestro-rutina-dieta-json.md` | Prompt principal para generar rutina, dieta y JSON. |
| `prompts/prompt-generacion-pdf-rutina.md` | Prompt para PDF de rutina. |
| `prompts/prompt-generacion-pdf-dieta.md` | Prompt para PDF de dieta. |
| `datasets/rag-rutinas-matriz-prioritaria.csv` | Matriz de combinaciones prioritaria. |
| `datasets/rag-rutinas-prompts-prioritarios.md` | Bloques de parámetros para ejecutar prompts. |
| `knowledge-base/README.md` | Base de conocimiento funcional del coach de rutinas. |

## Orden recomendado de uso

```txt
1. Usar prompts para generar PDF rutina + PDF dieta + JSON.
2. Curar el contenido generado.
3. Validar reglas deportivas y técnicas.
4. Mapear ejercicios contra DB real de Gym Master.
5. Asociar imágenes/GIF/videos disponibles.
6. Incorporar contenido curado como knowledge base RAG.
```

## Nota

Este material es corpus/benchmark y knowledge base RAG. No debe confundirse con fine-tuning ni con entrenamiento directo del modelo.
