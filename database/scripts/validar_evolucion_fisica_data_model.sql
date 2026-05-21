\echo '1. Columnas del modelo evolucion_socio'

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'evolucion_socio'
ORDER BY ordinal_position;

\echo '2. Constraints de evolucion_socio'

SELECT
  conname AS constraint_name,
  contype AS tipo,
  pg_get_constraintdef(oid) AS definicion
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
  AND conrelid = 'public.evolucion_socio'::regclass
ORDER BY contype, conname;

\echo '3. Índices de evolucion_socio'

SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'evolucion_socio'
ORDER BY indexname;

\echo '4. Prueba transaccional de registro de evolución física'

BEGIN;

-- Usuario QA fijo. Se usa ON CONFLICT por PK, no por email,
-- para evitar fallos en baselines locales sin unique constraint sobre email.
INSERT INTO public.usuario (
  id,
  nombre,
  email,
  password_hash,
  rol,
  activo
)
VALUES (
  '00000000-0000-4000-8000-000000000901',
  'QA Evolución Física',
  'qa.evolucion.fisica@gymmaster.local',
  '$2b$10$M1ZW1vuvc83nYNiTCJkk7eK/EUHlnYMrTEHOxUYQvCo859B11tEXe',
  'socio',
  true
)
ON CONFLICT (id) DO UPDATE
SET
  nombre = EXCLUDED.nombre,
  email = EXCLUDED.email,
  rol = EXCLUDED.rol,
  activo = EXCLUDED.activo;

-- Socio QA fijo. Se usa ON CONFLICT por PK, no por email/dni,
-- para mantener compatibilidad con baselines mínimos.
INSERT INTO public.socio (
  id_socio,
  usuario_id,
  nombre_completo,
  dni,
  email,
  activo,
  fecha_alta
)
VALUES (
  '00000000-0000-4000-8000-000000000902',
  '00000000-0000-4000-8000-000000000901',
  'QA Socio Evolución Física',
  'QA-EVOL-001',
  'qa.evolucion.fisica@gymmaster.local',
  true,
  CURRENT_DATE - INTERVAL '90 days'
)
ON CONFLICT (id_socio) DO UPDATE
SET
  usuario_id = EXCLUDED.usuario_id,
  nombre_completo = EXCLUDED.nombre_completo,
  dni = EXCLUDED.dni,
  email = EXCLUDED.email,
  activo = EXCLUDED.activo,
  fecha_alta = EXCLUDED.fecha_alta;

-- Registro inicial de evolución física.
INSERT INTO public.evolucion_socio (
  id,
  socio_id,
  fecha,
  peso,
  altura,
  imc,
  cintura,
  pecho,
  cadera,
  abdomen,
  cuello,
  hombros,
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
  foto_frontal_url,
  foto_lateral_url,
  foto_espalda_url,
  origen_registro,
  es_registro_inicial,
  observaciones
)
VALUES (
  '00000000-0000-4000-8000-000000000903',
  '00000000-0000-4000-8000-000000000902',
  CURRENT_DATE,
  82.5,
  176,
  ROUND((82.5 / POWER(1.76, 2))::numeric, 2),
  91,
  103,
  98,
  94,
  39,
  118,
  35,
  35.5,
  31,
  31.2,
  58,
  58.5,
  38,
  38.5,
  22.4,
  63.1,
  'mesomorfo',
  'masculino',
  '/images/evolucion/qa-frontal.png',
  '/images/evolucion/qa-lateral.png',
  '/images/evolucion/qa-espalda.png',
  'sistema',
  true,
  'Registro QA transaccional para validar el modelo extendido de evolución física.'
)
ON CONFLICT (id) DO UPDATE
SET
  socio_id = EXCLUDED.socio_id,
  fecha = EXCLUDED.fecha,
  peso = EXCLUDED.peso,
  altura = EXCLUDED.altura,
  imc = EXCLUDED.imc,
  cintura = EXCLUDED.cintura,
  pecho = EXCLUDED.pecho,
  cadera = EXCLUDED.cadera,
  abdomen = EXCLUDED.abdomen,
  cuello = EXCLUDED.cuello,
  hombros = EXCLUDED.hombros,
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
  foto_frontal_url = EXCLUDED.foto_frontal_url,
  foto_lateral_url = EXCLUDED.foto_lateral_url,
  foto_espalda_url = EXCLUDED.foto_espalda_url,
  origen_registro = EXCLUDED.origen_registro,
  es_registro_inicial = EXCLUDED.es_registro_inicial,
  observaciones = EXCLUDED.observaciones,
  actualizado_en = now();

SELECT
  e.id,
  e.socio_id,
  s.nombre_completo,
  e.fecha,
  e.peso,
  e.altura,
  e.imc,
  e.tipo_corporal,
  e.sexo_referencia,
  e.es_registro_inicial,
  e.origen_registro
FROM public.evolucion_socio e
JOIN public.socio s ON s.id_socio = e.socio_id
WHERE e.id = '00000000-0000-4000-8000-000000000903';

ROLLBACK;

\echo '5. Resumen de registros existentes'

SELECT
  COUNT(*) AS total_registros,
  COUNT(*) FILTER (WHERE socio_id IS NULL) AS registros_sin_socio,
  MIN(fecha) AS primera_fecha,
  MAX(fecha) AS ultima_fecha
FROM public.evolucion_socio;
