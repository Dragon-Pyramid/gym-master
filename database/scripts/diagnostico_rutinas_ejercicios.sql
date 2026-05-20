-- Gym Master - Diagnóstico de catálogos y ejercicios por objetivo/nivel
SELECT o.id_objetivo, o.nombre_objetivo, n.id_nivel, n.nombre_nivel, count(e.id_ejercicio) AS total_ejercicios
FROM public.objetivo o
CROSS JOIN public.nivel n
LEFT JOIN public.ejercicio e
  ON e.id_objetivo = o.id_objetivo
 AND e.id_nivel = n.id_nivel
WHERE o.id_objetivo = 1
GROUP BY o.id_objetivo, o.nombre_objetivo, n.id_nivel, n.nombre_nivel
ORDER BY o.id_objetivo, n.id_nivel;

SELECT gm.id_gm, gm.nombre_gp, n.id_nivel, n.nombre_nivel, count(e.id_ejercicio) AS total_ejercicios
FROM public.grupo_muscular gm
CROSS JOIN public.nivel n
LEFT JOIN public.ejercicio e
  ON e.id_gm = gm.id_gm
 AND e.id_nivel = n.id_nivel
 AND e.id_objetivo = 1
WHERE gm.id_gm BETWEEN 1 AND 8
GROUP BY gm.id_gm, gm.nombre_gp, n.id_nivel, n.nombre_nivel
ORDER BY gm.id_gm, n.id_nivel;
