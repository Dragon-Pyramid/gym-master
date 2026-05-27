# RAG Rutinas — Dataset de prompts y corpus inicial

## Feature

`feature/rag-rutinas-dataset-prompts`

## Objetivo

Crear una base documental inicial para preparar el futuro servicio `gym-master-rag-coach`.

Esta feature no entrena directamente un modelo. Su objetivo es generar un **corpus curado y trazable** de prompts, salidas esperadas, JSON estructurado, reglas de validación y criterios de calidad para alimentar posteriormente una base de conocimiento RAG.

## Alcance de esta primera etapa

Se priorizan los objetivos comerciales y operativos más relevantes:

1. Volumen
2. Definición
3. Bajar de peso
4. Aumentar fuerza
5. Mejorar resistencia

Para cada objetivo se contempla:

- nivel inicial, intermedio y avanzado;
- frecuencia de 3, 4, 5 y 6 días por semana;
- rangos físicos base por peso corporal;
- rutina semanal completa;
- dieta base complementaria;
- salida JSON compatible con Gym Master;
- reglas de validación técnica y deportiva;
- criterio de no repetir rutinas idénticas mes a mes.

Quedan para una segunda etapa:

- 1 y 2 días por semana;
- rehabilitación física;
- salud general;
- preparación para competencia;
- condición física postparto;
- control del estrés;
- casos con lesiones, patologías o restricciones clínicas.

## Archivos agregados

```txt
docs/rag-rutinas/rag-rutinas-dataset-prompts.md
docs/rag-rutinas/rag-rutinas-json-schema.md
docs/rag-rutinas/rag-rutinas-validation-rules.md
docs/rag-rutinas/prompts/README.md
docs/rag-rutinas/prompts/prompt-maestro-rutina-dieta-json.md
docs/rag-rutinas/prompts/prompt-generacion-pdf-rutina.md
docs/rag-rutinas/prompts/prompt-generacion-pdf-dieta.md
docs/rag-rutinas/datasets/rag-rutinas-matriz-prioritaria.csv
docs/rag-rutinas/datasets/rag-rutinas-prompts-prioritarios.md
```

## Concepto de trabajo

El corpus debe funcionar como una biblioteca de referencia para el futuro RAG.

Flujo recomendado:

```txt
Prompts maestros
↓
Generación de rutina + dieta + JSON
↓
Revisión humana / curación
↓
Normalización contra ejercicios reales de Gym Master
↓
Carga a knowledge base
↓
RAG conversa con socio
↓
RAG genera JSON validado
↓
Gym Master guarda rutina formal
```

## Reglas generales para el futuro RAG

El RAG no debe generar rutinas como texto libre desconectado del sistema. Debe generar una estructura formal compatible con Gym Master y sus datos reales.

Debe contemplar:

- objetivo declarado por el socio;
- nivel del socio;
- disponibilidad semanal;
- experiencia previa;
- restricciones físicas declaradas;
- rutina anterior del socio;
- ejercicios existentes en la base;
- imágenes/GIFs y videos disponibles;
- grupos musculares trabajados;
- orden lógico de ejercicios;
- volumen total semanal;
- frecuencia muscular;
- descansos;
- intensidad;
- progresión;
- advertencias.

## Variación mensual de rutinas

Si el socio ya tiene una rutina previa, el sistema debe revisar su historial antes de generar una nueva.

Regla:

```txt
No crear una rutina idéntica a la rutina activa o del mes anterior.
```

Puede repetir algunos ejercicios si tiene sentido, pero debe evitar copiar exactamente:

- mismos días;
- mismo orden;
- mismos ejercicios completos;
- mismas series/repeticiones;
- misma distribución semanal;
- mismo volumen;
- mismos descansos.

La variación puede venir por:

- cambio de variantes;
- cambio de orden;
- ajuste de repeticiones;
- ajuste de volumen;
- cambio de enfoque muscular;
- progresión de carga;
- frecuencia muscular distinta;
- transición de fase.

## Rango físico base

Para construir prompts repetibles, se usan rangos físicos orientativos:

| Código | Peso aproximado | Uso sugerido |
|---|---:|---|
| `liviano` | 50-64 kg | Socios de menor masa corporal o principiantes livianos. |
| `medio` | 65-84 kg | Perfil promedio general. |
| `alto` | 85-105 kg | Socios con mayor peso corporal o masa muscular. |
| `muy_alto` | 106-125 kg | Usar con cuidado, especialmente en impacto/cardio. |

En esta primera matriz se priorizan `liviano`, `medio` y `alto`. El rango `muy_alto` queda para etapa posterior con reglas específicas de seguridad.

## Salida esperada por combinación

Cada combinación debe producir cuatro entregables:

1. rutina explicada en texto;
2. dieta base explicada en texto;
3. JSON estructurado de rutina;
4. JSON estructurado de dieta.

Luego se pueden generar PDFs desde esos contenidos.

## Relación con futuras features

Esta feature prepara el camino para:

```txt
feature/rag-rutinas-coach-knowledge-base
feature/rag-rutinas-assistant
gym-master-rag-coach
feature/i18n-es-en
feature/rutinas-exercise-media-catalog
feature/rutinas-exercise-media-cloudinary-import
feature/rutinas-exercise-media-equivalence-sync
```

## Criterio de aceptación

La feature se considera lista cuando existan:

- prompts maestros reutilizables;
- matriz prioritaria de combinaciones;
- formato JSON esperado;
- reglas de validación;
- documentación para producir PDFs/JSON;
- estructura lista para continuar con knowledge base RAG.
