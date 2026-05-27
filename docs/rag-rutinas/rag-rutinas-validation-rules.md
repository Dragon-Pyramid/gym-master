# RAG Rutinas — Reglas de validación

## Objetivo

Definir reglas para revisar salidas generadas por IA antes de incorporarlas al corpus RAG o guardarlas como rutinas reales en Gym Master.

## Validación deportiva

### Orden de ejercicios

- Los ejercicios compuestos deben ir antes que los accesorios.
- Los ejercicios técnicos deben ir antes que los metabólicos o de aislamiento.
- Los grupos grandes deben priorizarse antes que músculos pequeños, salvo objetivo específico.
- Cardio intenso no debe preceder ejercicios pesados de fuerza/hipertrofia si afecta rendimiento.

Ejemplo correcto:

```txt
Press banca → Press inclinado → Aperturas → Fondos → Tríceps polea
```

Ejemplo a revisar:

```txt
Aperturas livianas → Tríceps polea → Press banca pesado
```

### Distribución semanal

La rutina debe cubrir los grupos musculares importantes según objetivo y días disponibles:

```txt
Pecho
Espalda
Piernas
Hombros
Bíceps
Tríceps
Abdominales/Core
Glúteos
Cardio/movilidad si aplica
```

### Frecuencia muscular

- 3 días: full body, torso/pierna/full body o división equivalente.
- 4 días: torso/pierna, push/pull, superior/inferior.
- 5 días: división mixta con frecuencia controlada.
- 6 días: push/pull/legs x2 o variantes con frecuencia 2.

### Volumen

El volumen debe adaptarse al nivel:

| Nivel | Criterio |
|---|---|
| Inicial | Menor volumen, técnica, máquinas, baja complejidad. |
| Intermedio | Volumen moderado, progresión y variantes libres/máquinas. |
| Avanzado | Mayor volumen, más intensidad, variantes específicas. |

### Intensidad

- Inicial: RPE 6-7.
- Intermedio: RPE 7-8.
- Avanzado: RPE 8-9 según ejercicio y fase.

### Descanso

- Compuestos pesados: 120-180 segundos.
- Hipertrofia general: 60-120 segundos.
- Aislamiento: 45-90 segundos.
- Resistencia/metabólico: 30-75 segundos.

## Validación por objetivo

### Volumen

- Priorizar hipertrofia.
- Mantener superávit calórico controlado.
- Usar frecuencia 1-2 por grupo muscular.
- Combinar compuestos y accesorios.

### Definición

- Mantener fuerza y masa muscular.
- Incluir cardio o gasto adicional sin destruir recuperación.
- Ajustar dieta a déficit moderado.

### Bajar de peso

- Priorizar adherencia, gasto energético y seguridad articular.
- Combinar fuerza, cardio y movilidad.
- Evitar impacto excesivo en personas con peso alto.

### Aumentar fuerza

- Priorizar básicos o patrones principales.
- Menos repeticiones, mayor descanso.
- Más control técnico.
- Accesorios para soporte.

### Mejorar resistencia

- Circuitos, superseries controladas, cardio y fuerza-resistencia.
- Descansos más breves.
- Evitar cargas máximas innecesarias.

## Validación técnica contra Gym Master

Antes de guardar una rutina:

```txt
1. El objetivo debe existir en DB.
2. El nivel debe existir en DB.
3. Cada ejercicio debe mapearse a un ejercicio real o alternativa aprobada.
4. No deben insertarse ejercicios inexistentes sin pasar por catálogo.
5. Deben respetarse ejercicios activos.
6. Si hay imagen/GIF/video, debe venir desde ejercicio_media o ejercicio.
7. Si no hay media, usar fallback visual.
```

## Validación de variación mensual

Cuando el socio ya tiene rutina previa:

```txt
No repetir rutina idéntica.
```

Comparar:

- días;
- grupos musculares por día;
- ejercicios;
- orden;
- series;
- repeticiones;
- descansos;
- volumen semanal.

Si la similitud es alta, el sistema debe variar:

- variantes de ejercicios;
- orden;
- rangos de repeticiones;
- número de series;
- frecuencia muscular;
- énfasis del mes;
- método de progresión.

## Validación nutricional

La dieta debe ser coherente con el objetivo:

| Objetivo | Criterio nutricional |
|---|---|
| Volumen | Superávit controlado. |
| Definición | Déficit moderado preservando proteína. |
| Bajar de peso | Déficit sostenible, saciedad y adherencia. |
| Fuerza | Energía suficiente para rendimiento. |
| Resistencia | Carbohidratos suficientes y recuperación. |

## Seguridad

Toda salida debe incluir una advertencia básica:

```txt
Esta guía no reemplaza evaluación médica, nutricional o profesional personalizada.
```

Marcar como requiere revisión humana si:

- hay lesión o dolor;
- embarazo/postparto;
- edad avanzada con comorbilidades;
- obesidad severa;
- enfermedad metabólica;
- hipertensión;
- cirugía reciente;
- rehabilitación;
- preparación competitiva extrema.

## Checklist final

```txt
[ ] JSON válido.
[ ] Rutina tiene días solicitados.
[ ] Ejercicios ordenados correctamente.
[ ] Volumen coherente con nivel.
[ ] Objetivo y dieta coherentes.
[ ] Grupos musculares cubiertos.
[ ] No repite rutina anterior de forma idéntica.
[ ] Ejercicios existen o pueden mapearse en DB.
[ ] Incluye descansos/intensidad.
[ ] Incluye progresión.
[ ] Incluye advertencias.
[ ] Incluye mensaje final al socio.
```
