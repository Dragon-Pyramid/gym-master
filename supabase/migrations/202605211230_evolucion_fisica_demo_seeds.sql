-- -----------------------------------------------------------------------------
-- Gym Master
-- Feature: evolucion-fisica-demo-seeds
-- Migration: 202605211230_evolucion_fisica_demo_seeds.sql
--
-- Objetivo:
-- Crear datos QA específicos para evolución física, sin reutilizar socios
-- existentes. Se crean un socio hombre y una socia mujer, con registros
-- históricos suficientes para validar el futuro frontend, dashboard, siluetas
-- antes/después y exportación PDF.
--
-- Password QA común para usuarios demo: GymMaster2026!
-- Nota: no se inserta public.socio.sexo para evitar incompatibilidades con
-- enums existentes entre baselines locales/remotos. El sexo usado para la
-- evolución queda registrado en evolucion_socio.sexo_referencia.
-- -----------------------------------------------------------------------------

-- -----------------------------------------------------------------------------
-- 1. Usuarios QA
-- -----------------------------------------------------------------------------
INSERT INTO public.usuario (
  id,
  nombre,
  email,
  password_hash,
  rol,
  activo
)
VALUES
  (
    '00000000-0000-4000-8000-000000000921',
    'QA Hombre Evolución',
    'qa.hombre.evolucion@gymmaster.local',
    '$2b$10$M1ZW1vuvc83nYNiTCJkk7eK/EUHlnYMrTEHOxUYQvCo859B11tEXe',
    'socio',
    true
  ),
  (
    '00000000-0000-4000-8000-000000000922',
    'QA Mujer Evolución',
    'qa.mujer.evolucion@gymmaster.local',
    '$2b$10$M1ZW1vuvc83nYNiTCJkk7eK/EUHlnYMrTEHOxUYQvCo859B11tEXe',
    'socio',
    true
  )
ON CONFLICT (id) DO UPDATE
SET
  nombre = EXCLUDED.nombre,
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  rol = EXCLUDED.rol,
  activo = EXCLUDED.activo;

-- -----------------------------------------------------------------------------
-- 2. Socios QA específicos para evolución física
-- -----------------------------------------------------------------------------
INSERT INTO public.socio (
  id_socio,
  usuario_id,
  nombre_completo,
  dni,
  email,
  activo,
  fecha_alta,
  nivel,
  objetivo,
  dias_por_semana,
  fecnac
)
VALUES
  (
    '00000000-0000-4000-8000-000000000923',
    '00000000-0000-4000-8000-000000000921',
    'QA Hombre Evolución Física',
    'QA-EVOL-H-001',
    'qa.hombre.evolucion@gymmaster.local',
    true,
    DATE '2026-01-15',
    2,
    1,
    4,
    DATE '1992-04-12'
  ),
  (
    '00000000-0000-4000-8000-000000000924',
    '00000000-0000-4000-8000-000000000922',
    'QA Mujer Evolución Física',
    'QA-EVOL-M-001',
    'qa.mujer.evolucion@gymmaster.local',
    true,
    DATE '2026-01-15',
    2,
    1,
    4,
    DATE '1995-08-25'
  )
ON CONFLICT (id_socio) DO UPDATE
SET
  usuario_id = EXCLUDED.usuario_id,
  nombre_completo = EXCLUDED.nombre_completo,
  dni = EXCLUDED.dni,
  email = EXCLUDED.email,
  activo = EXCLUDED.activo,
  fecha_alta = EXCLUDED.fecha_alta,
  nivel = EXCLUDED.nivel,
  objetivo = EXCLUDED.objetivo,
  dias_por_semana = EXCLUDED.dias_por_semana,
  fecnac = EXCLUDED.fecnac;

-- -----------------------------------------------------------------------------
-- 3. Registros de evolución física QA
-- -----------------------------------------------------------------------------
INSERT INTO public.evolucion_socio (
  id,
  socio_id,
  fecha,
  peso,
  altura,
  imc,
  cintura,
  bicep,
  tricep,
  pierna,
  gluteos,
  pantorrilla,
  pecho,
  cadera,
  abdomen,
  cuello,
  hombros,
  antebrazo_izquierdo,
  antebrazo_derecho,
  biceps_izquierdo,
  biceps_derecho,
  triceps_izquierdo,
  triceps_derecho,
  muslo_izquierdo,
  muslo_derecho,
  pantorrilla_izquierda,
  pantorrilla_derecha,
  porcentaje_grasa,
  masa_muscular,
  tipo_corporal,
  sexo_referencia,
  origen_registro,
  es_registro_inicial,
  observaciones
)
VALUES
  -- Hombre QA: evolución progresiva positiva
  (
    '00000000-0000-4000-8000-000000000931',
    '00000000-0000-4000-8000-000000000923',
    DATE '2026-01-20',
    92.0, 178, ROUND((92.0 / POWER(1.78, 2))::numeric, 2),
    104, 34, 30, 62, 104, 39,
    108, 105, 101, 42, 121,
    29, 29.5, 34, 34.5, 30, 30.5, 62, 62.5, 39, 39.2,
    28.5, 58.0,
    'endomorfo', 'masculino', 'sistema', true,
    'Registro inicial QA hombre. Base para comparación antes/después.'
  ),
  (
    '00000000-0000-4000-8000-000000000932',
    '00000000-0000-4000-8000-000000000923',
    DATE '2026-02-20',
    90.4, 178, ROUND((90.4 / POWER(1.78, 2))::numeric, 2),
    101.5, 35, 30.5, 62.5, 104.5, 39.4,
    109.5, 104, 98.5, 41.5, 122,
    29.4, 29.8, 35, 35.2, 30.5, 30.8, 62.5, 63, 39.4, 39.5,
    26.8, 59.4,
    'endomorfo', 'masculino', 'sistema', false,
    'Primer mes: baja cintura y leve mejora de masa muscular.'
  ),
  (
    '00000000-0000-4000-8000-000000000933',
    '00000000-0000-4000-8000-000000000923',
    DATE '2026-03-20',
    88.8, 178, ROUND((88.8 / POWER(1.78, 2))::numeric, 2),
    99, 36, 31, 63.5, 105.5, 40,
    111, 103, 96, 41, 123,
    30, 30.2, 36, 36.1, 31, 31.2, 63.5, 64, 40, 40.1,
    25.2, 60.8,
    'mixto', 'masculino', 'sistema', false,
    'Segundo control: mejora visual esperada para silueta dinámica.'
  ),
  (
    '00000000-0000-4000-8000-000000000934',
    '00000000-0000-4000-8000-000000000923',
    DATE '2026-04-20',
    87.1, 178, ROUND((87.1 / POWER(1.78, 2))::numeric, 2),
    96.5, 36.8, 31.4, 64.2, 106, 40.4,
    112.5, 102, 94.5, 40.6, 124,
    30.4, 30.6, 36.8, 37, 31.4, 31.5, 64.2, 64.8, 40.4, 40.6,
    23.4, 62.2,
    'mixto', 'masculino', 'sistema', false,
    'Tercer control: baja de grasa y aumento de perímetros musculares.'
  ),
  (
    '00000000-0000-4000-8000-000000000935',
    '00000000-0000-4000-8000-000000000923',
    DATE '2026-05-20',
    85.9, 178, ROUND((85.9 / POWER(1.78, 2))::numeric, 2),
    94.5, 37.5, 32, 65, 107, 41,
    114, 101, 92.5, 40, 125,
    30.8, 31, 37.5, 37.7, 32, 32.1, 65, 65.5, 41, 41.2,
    21.8, 63.7,
    'mesomorfo', 'masculino', 'sistema', false,
    'Último control QA hombre. Resultado positivo para comparación antes/después.'
  ),

  -- Mujer QA: evolución progresiva positiva
  (
    '00000000-0000-4000-8000-000000000941',
    '00000000-0000-4000-8000-000000000924',
    DATE '2026-01-20',
    68.5, 164, ROUND((68.5 / POWER(1.64, 2))::numeric, 2),
    82, 27, 24, 56, 101, 36,
    91, 103, 86, 34, 102,
    24, 24.2, 27, 27.2, 24, 24.1, 56, 56.5, 36, 36.3,
    31.2, 39.8,
    'endomorfo', 'femenino', 'sistema', true,
    'Registro inicial QA mujer. Base para comparación antes/después.'
  ),
  (
    '00000000-0000-4000-8000-000000000942',
    '00000000-0000-4000-8000-000000000924',
    DATE '2026-02-20',
    67.1, 164, ROUND((67.1 / POWER(1.64, 2))::numeric, 2),
    80, 27.5, 24.2, 56.5, 100.5, 36.2,
    91.5, 102, 83.8, 33.7, 102.5,
    24.2, 24.4, 27.5, 27.6, 24.2, 24.4, 56.5, 57, 36.2, 36.4,
    29.8, 40.6,
    'endomorfo', 'femenino', 'sistema', false,
    'Primer mes: baja abdomen/cintura y mejora leve de masa muscular.'
  ),
  (
    '00000000-0000-4000-8000-000000000943',
    '00000000-0000-4000-8000-000000000924',
    DATE '2026-03-20',
    65.8, 164, ROUND((65.8 / POWER(1.64, 2))::numeric, 2),
    78.4, 28, 24.8, 57.2, 100, 36.5,
    92.4, 101.2, 81.6, 33.3, 103,
    24.5, 24.7, 28, 28.1, 24.8, 25, 57.2, 57.8, 36.5, 36.7,
    28.1, 41.4,
    'mixto', 'femenino', 'sistema', false,
    'Segundo control: progresión sostenida, útil para gráficos y silueta.'
  ),
  (
    '00000000-0000-4000-8000-000000000944',
    '00000000-0000-4000-8000-000000000924',
    DATE '2026-04-20',
    64.4, 164, ROUND((64.4 / POWER(1.64, 2))::numeric, 2),
    76.5, 28.5, 25.2, 58, 99.2, 37,
    93, 100, 79.4, 33, 103.5,
    24.8, 25, 28.5, 28.7, 25.2, 25.4, 58, 58.4, 37, 37.2,
    26.6, 42.1,
    'mixto', 'femenino', 'sistema', false,
    'Tercer control: mejora notable de composición corporal.'
  ),
  (
    '00000000-0000-4000-8000-000000000945',
    '00000000-0000-4000-8000-000000000924',
    DATE '2026-05-20',
    63.2, 164, ROUND((63.2 / POWER(1.64, 2))::numeric, 2),
    74.8, 29, 25.6, 58.7, 98.5, 37.5,
    94, 99, 77.5, 32.6, 104.2,
    25.1, 25.3, 29, 29.1, 25.6, 25.8, 58.7, 59.2, 37.5, 37.7,
    25.1, 43.0,
    'mesomorfo', 'femenino', 'sistema', false,
    'Último control QA mujer. Resultado positivo para comparación antes/después.'
  )
ON CONFLICT (id) DO UPDATE
SET
  socio_id = EXCLUDED.socio_id,
  fecha = EXCLUDED.fecha,
  peso = EXCLUDED.peso,
  altura = EXCLUDED.altura,
  imc = EXCLUDED.imc,
  cintura = EXCLUDED.cintura,
  bicep = EXCLUDED.bicep,
  tricep = EXCLUDED.tricep,
  pierna = EXCLUDED.pierna,
  gluteos = EXCLUDED.gluteos,
  pantorrilla = EXCLUDED.pantorrilla,
  pecho = EXCLUDED.pecho,
  cadera = EXCLUDED.cadera,
  abdomen = EXCLUDED.abdomen,
  cuello = EXCLUDED.cuello,
  hombros = EXCLUDED.hombros,
  antebrazo_izquierdo = EXCLUDED.antebrazo_izquierdo,
  antebrazo_derecho = EXCLUDED.antebrazo_derecho,
  biceps_izquierdo = EXCLUDED.biceps_izquierdo,
  biceps_derecho = EXCLUDED.biceps_derecho,
  triceps_izquierdo = EXCLUDED.triceps_izquierdo,
  triceps_derecho = EXCLUDED.triceps_derecho,
  muslo_izquierdo = EXCLUDED.muslo_izquierdo,
  muslo_derecho = EXCLUDED.muslo_derecho,
  pantorrilla_izquierda = EXCLUDED.pantorrilla_izquierda,
  pantorrilla_derecha = EXCLUDED.pantorrilla_derecha,
  porcentaje_grasa = EXCLUDED.porcentaje_grasa,
  masa_muscular = EXCLUDED.masa_muscular,
  tipo_corporal = EXCLUDED.tipo_corporal,
  sexo_referencia = EXCLUDED.sexo_referencia,
  origen_registro = EXCLUDED.origen_registro,
  es_registro_inicial = EXCLUDED.es_registro_inicial,
  observaciones = EXCLUDED.observaciones,
  actualizado_en = now();

-- -----------------------------------------------------------------------------
-- 4. Resumen informativo
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_total integer;
BEGIN
  SELECT COUNT(*)
  INTO v_total
  FROM public.evolucion_socio
  WHERE socio_id IN (
    '00000000-0000-4000-8000-000000000923',
    '00000000-0000-4000-8000-000000000924'
  );

  RAISE NOTICE 'Seeds demo de evolución física aplicados. Registros QA: %', v_total;
END $$;
