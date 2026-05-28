# RAG Rutinas — Flujo conversacional

## Objetivo

Evolucionar el asistente de rutinas hacia una experiencia más natural para el socio, reduciendo la dependencia de combos/selects visibles y priorizando texto o voz.

El socio debe poder contar su caso con sus palabras. El asistente interpreta objetivo, días, nivel, prioridades musculares y restricciones antes de generar la rutina.

## Experiencia de usuario

La pantalla principal debe ser simple:

- título claro orientado al socio;
- ejemplo breve de cómo expresarse;
- campo de texto amplio;
- dictado por voz;
- botón de ayuda;
- resumen interpretado antes de generar;
- confirmación previa.

## Ayuda contextual

El botón de ayuda explica al socio cómo pedir su rutina sin usar lenguaje técnico.

Debe incluir:

- qué objetivo puede mencionar;
- cuántos días puede entrenar;
- nivel aproximado;
- grupos musculares prioritarios;
- restricciones o molestias;
- ejemplos naturales.

## Datos mínimos recomendados

Para generar una rutina razonable, el asistente necesita detectar al menos:

- objetivo;
- cantidad de días.

El nivel puede inferirse si el socio lo expresa. Si no se detecta, se puede usar un valor por defecto conservador o pedir más información en una evolución futura.

## Confirmación previa

Antes de generar, el asistente muestra un resumen interpretado:

- objetivo;
- nivel;
- días por semana;
- prioridades musculares;
- restricciones detectadas.

El socio confirma si está correcto o ajusta el texto.

## Límites

El flujo actual sigue usando el generador formal existente como respaldo. El futuro microservicio `gym-master-rag-coach` deberá profundizar la conversación, preguntar datos faltantes y validar la rutina generada con JSON estructurado.
