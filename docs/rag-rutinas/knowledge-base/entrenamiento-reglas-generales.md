# Reglas generales de entrenamiento para Gym Master Coach

## Objetivo

Definir criterios mínimos que toda rutina generada por IA debe respetar antes de ser guardada en Gym Master.

## 1. Orden de ejercicios dentro de una sesión

Regla general:

```txt
calentamiento → ejercicio principal → ejercicios secundarios → accesorios → core/cardio/movilidad
```

### Prioridad de orden

1. Ejercicios técnicos o compuestos.
2. Patrones principales del día.
3. Ejercicios secundarios multiarticulares.
4. Aislamiento/accesorios.
5. Core, movilidad o cardio complementario.

### Ejemplo correcto

```txt
Press banca plano
Press inclinado con mancuernas
Aperturas en polea
Fondos asistidos
Extensión de tríceps en polea
```

### Ejemplo a evitar

```txt
Aperturas livianas
Extensión de tríceps
Press banca pesado
```

Motivo: fatiga músculos estabilizadores y reduce rendimiento/técnica del ejercicio principal.

## 2. Cobertura muscular semanal

Toda rutina debe cubrir, según objetivo y días:

- Pecho.
- Espalda.
- Piernas/cuádriceps.
- Femorales.
- Glúteos.
- Hombros.
- Bíceps.
- Tríceps.
- Core/abdominales.
- Cardio/movilidad cuando corresponda.

## 3. Frecuencia muscular

Frecuencia recomendada por disponibilidad:

| Días/semana | Enfoque recomendado |
|---:|---|
| 1 | Full body de mantenimiento/adherencia. |
| 2 | Full body A/B o torso/pierna básico. |
| 3 | Full body, torso/pierna/full body o push-pull-legs adaptado. |
| 4 | Torso/pierna x2 o push/pull x2. |
| 5 | División mixta con frecuencia 1-2 según prioridad. |
| 6 | PPL x2, agonista/antagonista o frecuencia 2 controlada. |

## 4. Volumen semanal orientativo

| Nivel | Series efectivas por grupo/semana | Observación |
|---|---:|---|
| Inicial | 6-10 | Priorizar técnica y adherencia. |
| Intermedio | 8-14 | Progresión y variedad moderada. |
| Avanzado | 12-20 | Mayor especialización y recuperación controlada. |

Ajustar por objetivo, edad, recuperación, lesión y experiencia.

## 5. Intensidad/RPE

| Nivel | RPE recomendado |
|---|---|
| Inicial | 6-7 |
| Intermedio | 7-8 |
| Avanzado | 8-9 |

No todos los ejercicios deben ir al fallo. El fallo muscular debe reservarse para casos concretos y ejercicios seguros.

## 6. Descanso

| Tipo de ejercicio | Descanso sugerido |
|---|---:|
| Compuestos pesados | 120-180 s |
| Hipertrofia general | 60-120 s |
| Aislamiento | 45-90 s |
| Circuitos/metabólico | 30-75 s |

## 7. Progresión

El RAG debe indicar una regla de progresión simple:

```txt
Cuando completes el rango superior de repeticiones con técnica correcta en todas las series, aumentá la carga de forma moderada la próxima sesión.
```

También puede variar:

- carga;
- repeticiones;
- series;
- tempo;
- descanso;
- dificultad de variante;
- densidad de trabajo.

## 8. Seguridad

Marcar para revisión humana cuando haya:

- lesión actual;
- dolor persistente;
- embarazo/postparto;
- rehabilitación;
- hipertensión, diabetes, enfermedad renal/cardiovascular;
- cirugía reciente;
- obesidad severa;
- edad avanzada con comorbilidades;
- preparación competitiva extrema.

## 9. Idioma

Toda salida debe poder generarse en:

- español;
- inglés.

La estructura interna puede mantenerse en español, pero el RAG debe contemplar `nombre_en` y campos traducibles cuando estén disponibles.
