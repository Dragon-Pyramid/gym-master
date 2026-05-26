-- Gym Master - Fix seed Volumen Avanzado
-- Feature: feature/rutinas-exercise-knowledge-base-seed
-- Date: 2026-05-26
-- Purpose:
--   Completar cobertura local/remota de ejercicios para objetivo Volumen + nivel Avanzado.
--   El seed profesional anterior cubría la mayoría de objetivos/niveles, pero la validación local
--   mostró que Volumen Avanzado podía quedar sin ejercicios en un reset desde cero.
--   Esta migración es defensiva e idempotente: solo inserta ejercicios para grupos musculares
--   de Volumen Avanzado que no tengan ejercicios activos.

BEGIN;

WITH seed_ejercicios(
  nombre_ejercicio, nombre_en, id_nivel, id_objetivo, id_gm, imagen,
  descripcion, descripcion_en, tipo_ejercicio, patron_movimiento, equipamiento, dificultad,
  orden_sugerido, series_sugeridas, repeticiones_sugeridas, descanso_sugerido_seg,
  rpe_sugerido, intensidad, frecuencia_semanal_sugerida, video_youtube_url
) AS (
  VALUES
  -- Pecho
  ('Press banca plano avanzado', 'Advanced Flat Barbell Bench Press', 3, 1, 1, '/images/exercises/gym-master-exercise-fallback.svg',
   'Ejercicio principal de empuje horizontal para hipertrofia avanzada de pecho.', 'Main horizontal pushing exercise for advanced chest hypertrophy.', 'compuesto', 'empuje horizontal', 'barra/banco', 3, 1, '4-5', '6-8', 150, '8-9', 'alta', 2, NULL),
  ('Press inclinado con mancuernas avanzado', 'Advanced Incline Dumbbell Press', 3, 1, 1, '/images/exercises/gym-master-exercise-fallback.svg',
   'Variante inclinada para enfatizar porción clavicular del pectoral.', 'Incline variant emphasizing the upper chest.', 'compuesto', 'empuje inclinado', 'mancuernas/banco inclinado', 3, 1, '4', '8-10', 120, '8', 'alta', 2, NULL),
  ('Cruce de poleas avanzado', 'Advanced Cable Crossover', 3, 1, 1, '/images/exercises/gym-master-exercise-fallback.svg',
   'Aislamiento de pecho con tensión continua y control técnico.', 'Chest isolation with continuous tension and technical control.', 'aislamiento', 'aducción horizontal', 'poleas', 3, 3, '3-4', '12-15', 75, '8', 'moderada-alta', 2, NULL),
  ('Press en máquina convergente avanzado', 'Advanced Converging Machine Chest Press', 3, 1, 1, '/images/exercises/gym-master-exercise-fallback.svg',
   'Press guiado para acumular volumen de pecho con menor demanda estabilizadora.', 'Guided press for accumulating chest volume with less stabilization demand.', 'máquina', 'empuje horizontal', 'máquina convergente', 3, 2, '3-4', '8-12', 90, '8', 'moderada-alta', 2, NULL),

  -- Espalda
  ('Dominadas lastradas o asistidas avanzadas', 'Advanced Weighted or Assisted Pull-Up', 3, 1, 2, '/images/exercises/gym-master-exercise-fallback.svg',
   'Tracción vertical principal para dorsales y espalda alta.', 'Main vertical pull for lats and upper back.', 'compuesto', 'tracción vertical', 'barra de dominadas/asistencia', 3, 1, '4-5', '6-8', 150, '8-9', 'alta', 2, NULL),
  ('Remo con barra avanzado', 'Advanced Barbell Row', 3, 1, 2, '/images/exercises/gym-master-exercise-fallback.svg',
   'Remo pesado para densidad de espalda y fuerza de tracción.', 'Heavy row for back density and pulling strength.', 'compuesto', 'tracción horizontal', 'barra', 3, 1, '4', '6-10', 150, '8-9', 'alta', 2, NULL),
  ('Jalón agarre neutro avanzado', 'Advanced Neutral Grip Lat Pulldown', 3, 1, 2, '/images/exercises/gym-master-exercise-fallback.svg',
   'Tracción vertical controlada para dorsales con agarre neutro.', 'Controlled vertical pull for lats with neutral grip.', 'máquina/polea', 'tracción vertical', 'polea alta', 3, 2, '3-4', '8-12', 90, '8', 'moderada-alta', 2, NULL),
  ('Remo pecho apoyado avanzado', 'Advanced Chest Supported Row', 3, 1, 2, '/images/exercises/gym-master-exercise-fallback.svg',
   'Remo estable para espalda media reduciendo fatiga lumbar.', 'Stable row for mid-back while reducing lower-back fatigue.', 'máquina/mancuernas', 'tracción horizontal', 'banco/máquina', 3, 2, '3-4', '10-12', 90, '8', 'moderada-alta', 2, NULL),

  -- Piernas
  ('Sentadilla trasera avanzada', 'Advanced Back Squat', 3, 1, 3, '/images/exercises/gym-master-exercise-fallback.svg',
   'Ejercicio principal de pierna para fuerza e hipertrofia global.', 'Main lower-body exercise for strength and hypertrophy.', 'compuesto', 'dominante de rodilla', 'barra/rack', 3, 1, '4-5', '5-8', 180, '8-9', 'alta', 2, NULL),
  ('Prensa inclinada avanzada', 'Advanced Leg Press', 3, 1, 3, '/images/exercises/gym-master-exercise-fallback.svg',
   'Ejercicio de alto volumen para cuádriceps y glúteos.', 'High-volume exercise for quads and glutes.', 'máquina', 'dominante de rodilla', 'prensa', 3, 2, '4', '10-12', 120, '8', 'moderada-alta', 2, NULL),
  ('Peso muerto rumano avanzado', 'Advanced Romanian Deadlift', 3, 1, 3, '/images/exercises/gym-master-exercise-fallback.svg',
   'Patrón bisagra para isquiosurales, glúteos y cadena posterior.', 'Hip hinge for hamstrings, glutes, and posterior chain.', 'compuesto', 'bisagra de cadera', 'barra/mancuernas', 3, 1, '4', '6-10', 150, '8-9', 'alta', 2, NULL),
  ('Sentadilla búlgara avanzada', 'Advanced Bulgarian Split Squat', 3, 1, 3, '/images/exercises/gym-master-exercise-fallback.svg',
   'Trabajo unilateral avanzado para cuádriceps, glúteo y estabilidad.', 'Advanced unilateral work for quads, glutes, and stability.', 'unilateral', 'dominante de rodilla', 'mancuernas/banco', 3, 2, '3-4', '8-12 por pierna', 120, '8', 'moderada-alta', 2, NULL),

  -- Bíceps
  ('Curl con barra avanzado', 'Advanced Barbell Curl', 3, 1, 4, '/images/exercises/gym-master-exercise-fallback.svg',
   'Ejercicio principal para bíceps con carga progresiva.', 'Main biceps exercise for progressive loading.', 'aislamiento', 'flexión de codo', 'barra', 3, 3, '3-4', '8-10', 90, '8', 'moderada-alta', 2, NULL),
  ('Curl inclinado con mancuernas avanzado', 'Advanced Incline Dumbbell Curl', 3, 1, 4, '/images/exercises/gym-master-exercise-fallback.svg',
   'Variante con mayor estiramiento del bíceps.', 'Variation with greater biceps stretch.', 'aislamiento', 'flexión de codo', 'mancuernas/banco inclinado', 3, 3, '3', '10-12', 75, '8', 'moderada', 2, NULL),
  ('Curl predicador avanzado', 'Advanced Preacher Curl', 3, 1, 4, '/images/exercises/gym-master-exercise-fallback.svg',
   'Aislamiento guiado para controlar técnica y tensión.', 'Guided isolation for technique and tension control.', 'aislamiento', 'flexión de codo', 'banco predicador/máquina', 3, 3, '3', '10-12', 75, '8', 'moderada', 2, NULL),
  ('Curl martillo avanzado', 'Advanced Hammer Curl', 3, 1, 4, '/images/exercises/gym-master-exercise-fallback.svg',
   'Trabajo de braquial y antebrazo para complementar bíceps.', 'Brachialis and forearm work to complement biceps.', 'aislamiento', 'flexión de codo neutra', 'mancuernas/cuerda', 3, 3, '3', '10-15', 75, '8', 'moderada', 2, NULL),

  -- Tríceps
  ('Press cerrado avanzado', 'Advanced Close-Grip Bench Press', 3, 1, 5, '/images/exercises/gym-master-exercise-fallback.svg',
   'Movimiento compuesto para tríceps con transferencia al press.', 'Compound triceps movement with pressing carryover.', 'compuesto', 'empuje horizontal cerrado', 'barra/banco', 3, 1, '4', '6-8', 150, '8-9', 'alta', 2, NULL),
  ('Fondos en paralelas avanzados', 'Advanced Parallel Bar Dips', 3, 1, 5, '/images/exercises/gym-master-exercise-fallback.svg',
   'Ejercicio de empuje para tríceps y pecho inferior.', 'Pushing exercise for triceps and lower chest.', 'compuesto', 'empuje vertical', 'paralelas', 3, 1, '3-4', '6-10', 120, '8', 'alta', 2, NULL),
  ('Extensión de tríceps cuerda avanzada', 'Advanced Rope Triceps Pushdown', 3, 1, 5, '/images/exercises/gym-master-exercise-fallback.svg',
   'Aislamiento de tríceps en polea para acumulación de volumen.', 'Cable triceps isolation for volume accumulation.', 'aislamiento', 'extensión de codo', 'polea/cuerda', 3, 3, '3-4', '10-15', 75, '8', 'moderada', 2, NULL),
  ('Extensión francesa avanzada', 'Advanced French Press', 3, 1, 5, '/images/exercises/gym-master-exercise-fallback.svg',
   'Trabajo enfocado en la cabeza larga del tríceps.', 'Work focused on the long head of the triceps.', 'aislamiento', 'extensión de codo sobre cabeza', 'barra Z/mancuernas', 3, 3, '3', '10-12', 90, '8', 'moderada-alta', 2, NULL),

  -- Hombros
  ('Press militar avanzado', 'Advanced Overhead Press', 3, 1, 6, '/images/exercises/gym-master-exercise-fallback.svg',
   'Ejercicio principal de empuje vertical para deltoides.', 'Main vertical pushing exercise for delts.', 'compuesto', 'empuje vertical', 'barra/mancuernas', 3, 1, '4', '5-8', 150, '8-9', 'alta', 2, NULL),
  ('Press hombro en máquina avanzado', 'Advanced Machine Shoulder Press', 3, 1, 6, '/images/exercises/gym-master-exercise-fallback.svg',
   'Variante guiada para acumular volumen de hombro.', 'Guided variation for shoulder volume accumulation.', 'máquina', 'empuje vertical', 'máquina', 3, 2, '3-4', '8-12', 90, '8', 'moderada-alta', 2, NULL),
  ('Elevaciones laterales avanzadas', 'Advanced Lateral Raise', 3, 1, 6, '/images/exercises/gym-master-exercise-fallback.svg',
   'Aislamiento de deltoide medio con alto control técnico.', 'Middle delt isolation with high technical control.', 'aislamiento', 'abducción de hombro', 'mancuernas/polea', 3, 3, '4', '12-20', 60, '8', 'moderada', 2, NULL),
  ('Pájaros para deltoide posterior avanzado', 'Advanced Rear Delt Fly', 3, 1, 6, '/images/exercises/gym-master-exercise-fallback.svg',
   'Aislamiento de deltoide posterior y estabilidad escapular.', 'Rear delt isolation and scapular stability.', 'aislamiento', 'abducción horizontal', 'mancuernas/máquina', 3, 3, '3-4', '12-20', 60, '8', 'moderada', 2, NULL),

  -- Abdominales
  ('Elevación de piernas colgado avanzada', 'Advanced Hanging Leg Raise', 3, 1, 7, '/images/exercises/gym-master-exercise-fallback.svg',
   'Trabajo avanzado de core con énfasis en flexión controlada de cadera.', 'Advanced core work emphasizing controlled hip flexion.', 'core', 'flexión de cadera/core', 'barra', 3, 3, '3-4', '10-15', 75, '8', 'moderada-alta', 2, NULL),
  ('Crunch en polea avanzado', 'Advanced Cable Crunch', 3, 1, 7, '/images/exercises/gym-master-exercise-fallback.svg',
   'Core con carga progresiva para hipertrofia abdominal.', 'Progressive loaded core work for abdominal hypertrophy.', 'core', 'flexión de tronco', 'polea', 3, 3, '3-4', '10-15', 75, '8', 'moderada-alta', 2, NULL),
  ('Plancha con carga avanzada', 'Advanced Weighted Plank', 3, 1, 7, '/images/exercises/gym-master-exercise-fallback.svg',
   'Ejercicio anti-extensión para estabilidad del core.', 'Anti-extension exercise for core stability.', 'core', 'anti-extensión', 'peso corporal/disco', 3, 3, '3', '30-60 seg', 60, '8', 'moderada', 2, NULL),
  ('Pallof press avanzado', 'Advanced Pallof Press', 3, 1, 7, '/images/exercises/gym-master-exercise-fallback.svg',
   'Trabajo anti-rotación para estabilidad central.', 'Anti-rotation work for central stability.', 'core', 'anti-rotación', 'polea/banda', 3, 3, '3', '10-15 por lado', 60, '7-8', 'moderada', 2, NULL),

  -- Glúteos
  ('Hip thrust avanzado', 'Advanced Hip Thrust', 3, 1, 8, '/images/exercises/gym-master-exercise-fallback.svg',
   'Ejercicio principal para glúteos con carga alta.', 'Main glute exercise with high loading.', 'compuesto', 'extensión de cadera', 'barra/banco', 3, 1, '4-5', '6-10', 150, '8-9', 'alta', 2, NULL),
  ('Peso muerto sumo avanzado', 'Advanced Sumo Deadlift', 3, 1, 8, '/images/exercises/gym-master-exercise-fallback.svg',
   'Patrón de bisagra con énfasis en glúteos y aductores.', 'Hip hinge pattern emphasizing glutes and adductors.', 'compuesto', 'bisagra de cadera', 'barra', 3, 1, '4', '5-8', 180, '8-9', 'alta', 2, NULL),
  ('Abducción de cadera en máquina avanzada', 'Advanced Machine Hip Abduction', 3, 1, 8, '/images/exercises/gym-master-exercise-fallback.svg',
   'Aislamiento de glúteo medio para estabilidad y volumen.', 'Glute medius isolation for stability and volume.', 'aislamiento', 'abducción de cadera', 'máquina', 3, 3, '3-4', '12-20', 60, '8', 'moderada', 2, NULL),
  ('Patada de glúteo en polea avanzada', 'Advanced Cable Glute Kickback', 3, 1, 8, '/images/exercises/gym-master-exercise-fallback.svg',
   'Aislamiento de glúteo mayor con control de rango.', 'Glute max isolation with range control.', 'aislamiento', 'extensión de cadera', 'polea', 3, 3, '3-4', '12-15', 60, '8', 'moderada', 2, NULL)
),
inserted AS (
  INSERT INTO public.ejercicio (
    nombre_ejercicio, nombre_en, id_nivel, id_objetivo, id_gm, imagen,
    descripcion, descripcion_en, tipo_ejercicio, patron_movimiento, equipamiento, dificultad,
    orden_sugerido, series_sugeridas, repeticiones_sugeridas, descanso_sugerido_seg,
    rpe_sugerido, intensidad, frecuencia_semanal_sugerida, video_youtube_url,
    imagen_origen, activo, creado_en, actualizado_en
  )
  SELECT
    s.nombre_ejercicio, s.nombre_en, s.id_nivel, s.id_objetivo, s.id_gm, s.imagen,
    s.descripcion, s.descripcion_en, s.tipo_ejercicio, s.patron_movimiento, s.equipamiento, s.dificultad,
    s.orden_sugerido, s.series_sugeridas, s.repeticiones_sugeridas, s.descanso_sugerido_seg,
    s.rpe_sugerido, s.intensidad, s.frecuencia_semanal_sugerida, s.video_youtube_url,
    'fallback', true, now(), now()
  FROM seed_ejercicios s
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.ejercicio e
    WHERE e.id_objetivo = s.id_objetivo
      AND e.id_nivel = s.id_nivel
      AND e.id_gm = s.id_gm
      AND COALESCE(e.activo, true) = true
  )
  RETURNING id_ejercicio, nombre_ejercicio, imagen, imagen_origen
)
INSERT INTO public.ejercicio_media (id_ejercicio, tipo_media, origen, url, titulo, descripcion, es_principal, activo)
SELECT
  i.id_ejercicio,
  'imagen',
  COALESCE(i.imagen_origen, 'fallback'),
  i.imagen,
  i.nombre_ejercicio,
  'Fallback inicial para Volumen Avanzado. Reemplazar por GIF/imagen Cloudinary curada desde el panel de media de ejercicios.',
  true,
  true
FROM inserted i
WHERE NOT EXISTS (
  SELECT 1
  FROM public.ejercicio_media em
  WHERE em.id_ejercicio = i.id_ejercicio
    AND em.tipo_media = 'imagen'
    AND em.es_principal = true
    AND em.activo = true
);

COMMIT;
