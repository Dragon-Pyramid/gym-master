-- Gym Master - Validación local del RPC generar_rutina_socio para objetivo Volumen
-- Ejecutar después de aplicar las migraciones locales.

-- Socio de prueba nivel Inicial
INSERT INTO public.socio (id_socio, nombre_completo, dni, email, nivel, objetivo, dias_por_semana)
VALUES ('00000000-0000-4000-8000-000000000101', 'Socio Test Inicial', 'TEST-INICIAL', 'test-inicial@gymmaster.local', 1, 1, 3)
ON CONFLICT (id_socio) DO UPDATE
SET nivel = EXCLUDED.nivel,
    objetivo = EXCLUDED.objetivo,
    dias_por_semana = EXCLUDED.dias_por_semana;

-- Socio de prueba nivel Intermedio
INSERT INTO public.socio (id_socio, nombre_completo, dni, email, nivel, objetivo, dias_por_semana)
VALUES ('00000000-0000-4000-8000-000000000102', 'Socio Test Intermedio', 'TEST-INTERMEDIO', 'test-intermedio@gymmaster.local', 2, 1, 3)
ON CONFLICT (id_socio) DO UPDATE
SET nivel = EXCLUDED.nivel,
    objetivo = EXCLUDED.objetivo,
    dias_por_semana = EXCLUDED.dias_por_semana;

SELECT 'Inicial' AS caso, *
FROM public.generar_rutina_socio('00000000-0000-4000-8000-000000000101', 1, 1, 3);

SELECT 'Intermedio' AS caso, *
FROM public.generar_rutina_socio('00000000-0000-4000-8000-000000000102', 1, 2, 3);
