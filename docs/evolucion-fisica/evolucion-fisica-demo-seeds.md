# Evolución física - Seeds demo

## Objetivo

Esta feature incorpora datos QA específicos para validar el módulo de evolución física de Gym Master.

Se crean dos socios nuevos exclusivamente para esta área:

- QA Hombre Evolución Física
- QA Mujer Evolución Física

Sobre ambos se cargan registros históricos mensuales con métricas corporales completas.

## Alcance

La migración agrega:

- 2 usuarios QA con rol socio.
- 2 socios QA asociados a esos usuarios.
- 10 registros de evolución física, 5 para cada socio.
- Primer registro de cada socio marcado como `es_registro_inicial = true`.
- Registros posteriores simulando progresión corporal.

## Métricas incluidas

- Peso.
- Altura.
- IMC.
- Cintura.
- Pecho.
- Abdomen.
- Cadera.
- Cuello.
- Hombros.
- Bíceps izquierdo/derecho.
- Tríceps izquierdo/derecho.
- Muslo izquierdo/derecho.
- Pantorrilla izquierda/derecha.
- Porcentaje de grasa.
- Masa muscular.
- Tipo corporal.
- Sexo de referencia.
- Observaciones.

## Decisiones técnicas

No se carga `socio.sexo` en esta migración para evitar incompatibilidades con enums existentes entre baselines locales y remotos.

El sexo se conserva en `evolucion_socio.sexo_referencia`, que forma parte del modelo extendido validado en la feature anterior.

## Uso futuro

Estos datos quedan listos para validar próximas features:

- CRUD frontend de evolución física.
- Dashboard de evolución física.
- Comparación antes/después.
- Siluetas dinámicas.
- Exportación PDF.

Para siluetas dinámicas se mantiene como criterio futuro evitar carga manual de SVGs y evaluar soluciones con Canvas/WebGL/Three.js/React Three Fiber o librerías equivalentes.
