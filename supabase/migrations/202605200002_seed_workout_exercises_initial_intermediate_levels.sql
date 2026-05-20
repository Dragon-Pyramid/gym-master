-- Gym Master
-- Migration: Seed workout exercises for objective Volumen and levels Inicial/Intermedio
-- Date: 2026-05-20
-- Context:
--   The RPC public.generar_rutina_socio works for objective 1 / level 3, but fails for
--   objective 1 / level 1 and objective 1 / level 2 because public.ejercicio has no
--   exercises for those combinations.
--
-- Scope:
--   Inserts baseline exercises for:
--     - objective 1: Volumen
--     - level 1: Inicial
--     - level 2: Intermedio
--   across the main muscle groups used by the current routine generator.
--
-- Important:
--   This migration is intentionally idempotent by natural combination
--   (nombre_ejercicio + id_nivel + id_objetivo + id_gm), even though the table does
--   not currently enforce a unique constraint for that combination.

BEGIN;


-- Ensure required workout catalogs exist locally and remotely.
INSERT INTO public.nivel (id_nivel, nombre_nivel)
VALUES
  (1, 'Inicial'),
  (2, 'Intermedio'),
  (3, 'Avanzado')
ON CONFLICT (id_nivel) DO UPDATE
SET nombre_nivel = EXCLUDED.nombre_nivel,
    actualizado_en = now();

INSERT INTO public.objetivo (id_objetivo, nombre_objetivo)
VALUES
  (1, 'Volumen'),
  (2, 'Definición'),
  (3, 'Bajar de peso'),
  (4, 'Aumentar fuerza'),
  (5, 'Mejorar resistencia'),
  (6, 'Rehabilitación física'),
  (7, 'Salud general'),
  (8, 'Preparación para competencia'),
  (9, 'Condición física postparto'),
  (10, 'Control del estrés')
ON CONFLICT (id_objetivo) DO UPDATE
SET nombre_objetivo = EXCLUDED.nombre_objetivo,
    actualizado_en = now();

INSERT INTO public.grupo_muscular (id_gm, nombre_gp)
VALUES
  (1, 'Pecho'),
  (2, 'Espalda'),
  (3, 'Piernas'),
  (4, 'Bíceps'),
  (5, 'Tríceps'),
  (6, 'Hombros'),
  (7, 'Abdominales'),
  (8, 'Glúteos')
ON CONFLICT (id_gm) DO UPDATE
SET nombre_gp = EXCLUDED.nombre_gp,
    actualizado_en = now();

INSERT INTO public.dia (id_dia, nombre_dia)
VALUES
  (1, 'Lunes'),
  (2, 'Martes'),
  (3, 'Miércoles'),
  (4, 'Jueves'),
  (5, 'Viernes'),
  (6, 'Sábado')
ON CONFLICT (id_dia) DO UPDATE
SET nombre_dia = EXCLUDED.nombre_dia,
    actualizado_en = now();

SELECT setval(pg_get_serial_sequence('public.nivel','id_nivel'), COALESCE((SELECT max(id_nivel) FROM public.nivel), 1), true);
SELECT setval(pg_get_serial_sequence('public.objetivo','id_objetivo'), COALESCE((SELECT max(id_objetivo) FROM public.objetivo), 1), true);
SELECT setval(pg_get_serial_sequence('public.grupo_muscular','id_gm'), COALESCE((SELECT max(id_gm) FROM public.grupo_muscular), 1), true);
SELECT setval(pg_get_serial_sequence('public.dia','id_dia'), COALESCE((SELECT max(id_dia) FROM public.dia), 1), true);


WITH seed(nombre_ejercicio, id_nivel, id_objetivo, id_gm, imagen) AS (
  VALUES
    -- Nivel 1 - Inicial / Objetivo 1 - Volumen / Pecho
    ('Press de pecho en máquina', 1, 1, 1, NULL::text),
    ('Press plano con mancuernas livianas', 1, 1, 1, NULL::text),
    ('Aperturas con mancuernas livianas', 1, 1, 1, NULL::text),
    ('Flexiones asistidas', 1, 1, 1, NULL::text),

    -- Nivel 1 - Inicial / Espalda
    ('Jalón al pecho en polea', 1, 1, 2, NULL::text),
    ('Remo sentado en polea', 1, 1, 2, NULL::text),
    ('Pull over en polea liviano', 1, 1, 2, NULL::text),
    ('Remo con mancuerna apoyado', 1, 1, 2, NULL::text),

    -- Nivel 1 - Inicial / Piernas
    ('Prensa liviana', 1, 1, 3, NULL::text),
    ('Sentadilla goblet liviana', 1, 1, 3, NULL::text),
    ('Sillón de cuádriceps liviano', 1, 1, 3, NULL::text),
    ('Camilla de femorales liviana', 1, 1, 3, NULL::text),

    -- Nivel 1 - Inicial / Bíceps
    ('Curl con mancuernas livianas', 1, 1, 4, NULL::text),
    ('Curl alternado controlado', 1, 1, 4, NULL::text),
    ('Curl en polea baja liviano', 1, 1, 4, NULL::text),
    ('Curl martillo liviano', 1, 1, 4, NULL::text),

    -- Nivel 1 - Inicial / Tríceps
    ('Tríceps en polea con soga liviano', 1, 1, 5, NULL::text),
    ('Extensión de tríceps en polea', 1, 1, 5, NULL::text),
    ('Patada de tríceps con mancuerna liviana', 1, 1, 5, NULL::text),
    ('Fondos asistidos en banco', 1, 1, 5, NULL::text),

    -- Nivel 1 - Inicial / Hombros
    ('Press de hombros en máquina', 1, 1, 6, NULL::text),
    ('Elevaciones laterales livianas', 1, 1, 6, NULL::text),
    ('Elevaciones frontales livianas', 1, 1, 6, NULL::text),
    ('Pájaros con mancuernas livianas', 1, 1, 6, NULL::text),

    -- Nivel 1 - Inicial / Abdominales
    ('Crunch abdominal básico', 1, 1, 7, NULL::text),
    ('Plancha frontal corta', 1, 1, 7, NULL::text),
    ('Elevación de rodillas', 1, 1, 7, NULL::text),
    ('Crunch en máquina liviano', 1, 1, 7, NULL::text),

    -- Nivel 1 - Inicial / Glúteos
    ('Puente de glúteos en colchoneta', 1, 1, 8, NULL::text),
    ('Patada de glúteos en polea liviana', 1, 1, 8, NULL::text),
    ('Abducción de cadera en máquina liviana', 1, 1, 8, NULL::text),
    ('Hip thrust sin carga pesada', 1, 1, 8, NULL::text),

    -- Nivel 2 - Intermedio / Objetivo 1 - Volumen / Pecho
    ('Press plano con barra moderado', 2, 1, 1, NULL::text),
    ('Press inclinado con mancuernas moderado', 2, 1, 1, NULL::text),
    ('Apertura en banco inclinado', 2, 1, 1, NULL::text),
    ('Cruce de poleas moderado', 2, 1, 1, NULL::text),

    -- Nivel 2 - Intermedio / Espalda
    ('Dominadas asistidas', 2, 1, 2, NULL::text),
    ('Remo con barra moderado', 2, 1, 2, NULL::text),
    ('Remo en polea agarre cerrado', 2, 1, 2, NULL::text),
    ('Jalón agarre supino', 2, 1, 2, NULL::text),

    -- Nivel 2 - Intermedio / Piernas
    ('Sentadilla con barra moderada', 2, 1, 3, NULL::text),
    ('Prensa moderada', 2, 1, 3, NULL::text),
    ('Estocadas con mancuernas', 2, 1, 3, NULL::text),
    ('Peso muerto rumano con mancuernas', 2, 1, 3, NULL::text),

    -- Nivel 2 - Intermedio / Bíceps
    ('Curl con barra Z', 2, 1, 4, NULL::text),
    ('Curl inclinado con mancuernas', 2, 1, 4, NULL::text),
    ('Curl en banco Scott', 2, 1, 4, NULL::text),
    ('Martillo con mancuernas moderado', 2, 1, 4, NULL::text),

    -- Nivel 2 - Intermedio / Tríceps
    ('Rompecráneos con barra Z', 2, 1, 5, NULL::text),
    ('Tríceps en polea con barra', 2, 1, 5, NULL::text),
    ('Tríceps con soga moderado', 2, 1, 5, NULL::text),
    ('Press cerrado en banco', 2, 1, 5, NULL::text),

    -- Nivel 2 - Intermedio / Hombros
    ('Press militar con mancuernas', 2, 1, 6, NULL::text),
    ('Elevaciones laterales moderadas', 2, 1, 6, NULL::text),
    ('Vuelo posterior en banco inclinado', 2, 1, 6, NULL::text),
    ('Encogimientos de trapecio con mancuernas', 2, 1, 6, NULL::text),

    -- Nivel 2 - Intermedio / Abdominales
    ('Crunch en polea', 2, 1, 7, NULL::text),
    ('Plancha frontal extendida', 2, 1, 7, NULL::text),
    ('Elevación de piernas colgado', 2, 1, 7, NULL::text),
    ('Russian twist con disco', 2, 1, 7, NULL::text),

    -- Nivel 2 - Intermedio / Glúteos
    ('Hip thrust con barra moderado', 2, 1, 8, NULL::text),
    ('Patada de glúteos en polea', 2, 1, 8, NULL::text),
    ('Abducción de cadera en máquina', 2, 1, 8, NULL::text),
    ('Peso muerto sumo moderado', 2, 1, 8, NULL::text)
)
INSERT INTO public.ejercicio (
  nombre_ejercicio,
  id_nivel,
  id_objetivo,
  id_gm,
  imagen
)
SELECT
  s.nombre_ejercicio,
  s.id_nivel,
  s.id_objetivo,
  s.id_gm,
  s.imagen
FROM seed s
WHERE EXISTS (
  SELECT 1 FROM public.nivel n WHERE n.id_nivel = s.id_nivel
)
AND EXISTS (
  SELECT 1 FROM public.objetivo o WHERE o.id_objetivo = s.id_objetivo
)
AND EXISTS (
  SELECT 1 FROM public.grupo_muscular gm WHERE gm.id_gm = s.id_gm
)
AND NOT EXISTS (
  SELECT 1
  FROM public.ejercicio e
  WHERE lower(trim(e.nombre_ejercicio)) = lower(trim(s.nombre_ejercicio))
    AND e.id_nivel = s.id_nivel
    AND e.id_objetivo = s.id_objetivo
    AND e.id_gm = s.id_gm
);

-- Keep the serial sequence aligned after inserting rows without explicit IDs.
SELECT setval(
  pg_get_serial_sequence('public.ejercicio', 'id_ejercicio'),
  COALESCE((SELECT MAX(id_ejercicio) FROM public.ejercicio), 1),
  true
);

SELECT setval(pg_get_serial_sequence('public.ejercicio','id_ejercicio'), COALESCE((SELECT max(id_ejercicio) FROM public.ejercicio), 1), true);

COMMIT;

SELECT setval(pg_get_serial_sequence('public.ejercicio','id_ejercicio'), COALESCE((SELECT max(id_ejercicio) FROM public.ejercicio), 1), true);
