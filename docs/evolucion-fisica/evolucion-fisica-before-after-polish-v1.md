# Evolución Física — Before/After Polish v1

## Rama

`feature/evolucion-fisica-before-after-polish-v1`

## Objetivo

Mejorar la experiencia visual del módulo de evolución física incorporando un estudio interactivo antes/después basado en mediciones reales del socio, sin depender de assets o componentes externos copiados desde repositorios benchmark.

## Benchmark usado

Se analizaron 15 repositorios de referencia para detectar patrones útiles:

- `react-native-body-highlighter`: silueta por género, vista frontal/posterior, intensidad y partes corporales.
- `react-body-highlighter`: enfoque React web con zonas SVG clickeables.
- `react-muscle-highlighter`: referencia React/TypeScript para grupos musculares, colores e intensidad.
- `body-map`: mapa corporal SVG como inspiración visual.
- `MuscleMap`: heatmaps, multi-select, zoom, animaciones y estilos visuales.
- `wger`, `openScale`, `SparkyFitness`: métricas corporales, historial, check-ins y fotos de progreso.
- `MediaPipe`, `tfjs-models`, `mmpose`, `OpenPose`: base conceptual para una etapa posterior con pose/segmentación.
- `ExerciseDB`, `free-exercise-db`, `exercises.json`: relación futura entre ejercicios, músculos trabajados y heatmap.

## Decisión técnica

No se copian SVG, assets ni componentes externos. El componente nuevo usa una silueta SVG propia y estimativa de Gym Master, construida con formas básicas y datos del modelo `EvolucionSocio`.

Motivos:

- Evitar riesgos de licencias en assets anatómicos.
- Mantener control visual del producto Dragon Pyramid / Gym Master.
- Integrar de forma nativa con Next.js, Tailwind y el modelo actual.
- Evitar nuevas dependencias.

## Implementación

### Nuevo componente

`src/components/dashboard/evolucion-fisica/EvolucionFisicaBeforeAfterStudio.tsx`

Incluye:

- selector de medición antes/después;
- modo slider;
- modo superpuesto;
- modo heatmap;
- vista frontal/posterior;
- mapa corporal SVG propio;
- grupos corporales clickeables;
- cálculo de delta por grupo;
- lectura automática de mejoras/alertas;
- disclaimer de representación estimativa.

### Integración

`src/components/dashboard/evolucion-fisica/EvolucionFisicaDashboard.tsx`

Se incorpora el nuevo estudio visual antes del bloque de silueta humana existente, conservando los gráficos y tabla comparativa actuales.

## Métricas consideradas

- Peso
- Pecho
- Abdomen
- Cintura
- Cadera
- Hombros
- Bíceps promedio
- Tríceps promedio
- Antebrazo promedio
- Muslo promedio
- Pantorrilla promedio
- Porcentaje de grasa
- Masa muscular
- IMC

## Reglas de interpretación

- Cintura y abdomen: menor valor suele ser favorable.
- Bíceps, tríceps, hombros, muslo, pantorrilla, pecho y masa muscular: mayor valor suele ser favorable cuando el objetivo es desarrollo muscular.
- Peso y cadera: métricas neutrales; se interpretan en contexto.
- Cambios leves se muestran como estables.
- Faltantes se muestran como sin dato.

## Sin migración DB

Esta feature no modifica base de datos. Usa campos existentes de `evolucion_socio`.

## Validación funcional

1. Entrar a `/dashboard/evolucion-fisica` o al gestor admin de evolución física.
2. Seleccionar un socio con al menos dos mediciones.
3. Verificar que aparece el bloque “Estudio visual antes/después”.
4. Cambiar medición antes y después.
5. Probar modo slider.
6. Probar modo superpuesto.
7. Probar modo heatmap.
8. Alternar frente/espalda.
9. Hacer clic en grupos corporales.
10. Validar que se muestren antes, después, delta y lectura del grupo.
11. Confirmar que los gráficos existentes siguen funcionando.
12. Confirmar que la exportación PDF anterior no se rompe.

## Próximas iteraciones sugeridas

- Fotos de progreso frontal/lateral/espalda con comparador visual.
- SVG anatómico propio más detallado por género.
- Heatmap por músculos trabajados desde rutinas.
- Cruce con ExerciseDB/free-exercise-db para relacionar ejercicios y músculos.
- IA client-side con TensorFlow.js o MediaPipe para segmentación/alineación de postura.
