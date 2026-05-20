-- Gym Master - Core integrity constraints
-- Objetivo: reforzar integridad mínima usuario/socio y consultas core.
-- Recomendación: ejecutar primero database/scripts/preflight_core_integrity.sql.

BEGIN;

-- Un usuario con rol socio debe mapear, como máximo, a un único perfil socio.
-- Si existen duplicados, este índice fallará: resolverlos antes con el preflight.
CREATE UNIQUE INDEX IF NOT EXISTS idx_socio_usuario_id_unique
ON public.socio (usuario_id)
WHERE usuario_id IS NOT NULL;

-- Índices de soporte para rutas y RPC frecuentes.
CREATE INDEX IF NOT EXISTS idx_socio_activo_creado_en
ON public.socio (activo, creado_en DESC);

CREATE INDEX IF NOT EXISTS idx_rutina_id_socio_creado_en
ON public.rutina (id_socio, creado_en DESC);

CREATE INDEX IF NOT EXISTS idx_asistencia_socio_fecha
ON public.asistencia (socio_id, fecha DESC);

CREATE INDEX IF NOT EXISTS idx_pago_socio_fecha_pago
ON public.pago (socio_id, fecha_pago DESC);

-- Reglas de consistencia para preferencias de entrenamiento del socio.
ALTER TABLE public.socio
DROP CONSTRAINT IF EXISTS socio_dias_por_semana_check;

ALTER TABLE public.socio
ADD CONSTRAINT socio_dias_por_semana_check
CHECK (dias_por_semana IS NULL OR dias_por_semana BETWEEN 1 AND 6)
NOT VALID;

-- Comentarios operativos para continuidad técnica.
COMMENT ON INDEX public.idx_socio_usuario_id_unique IS
'Garantiza relación 1 a 1 entre usuario con rol socio y perfil socio. Requerido para login socio y rutinas.';

COMMENT ON CONSTRAINT socio_dias_por_semana_check ON public.socio IS
'Valida que la cantidad de días de entrenamiento del socio esté entre 1 y 6 cuando se informe.';

COMMIT;
