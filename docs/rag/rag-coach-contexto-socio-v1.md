# Gym Master - RAG Coach Contexto Socio v1

## Rama

`feature/rag-coach-contexto-socio-v1`

## Objetivo

Enriquecer el Coach IA unificado con contexto real del socio para que sus respuestas sean menos genéricas y más útiles.

Esta feature no guarda información privada del socio como corpus RAG global. El contexto se construye en tiempo de ejecución y se usa solo para orientar la conversación actual.

## Contexto usado

El servicio server-side construye un resumen a partir de:

- Datos básicos del socio: nivel, objetivo, días por semana, edad si existe.
- Rutinas recientes.
- Dietas recientes.
- Evolución física reciente.
- Asistencia de los últimos 30 y 7 días.
- Ficha médica básica permitida, transformada en restricciones preventivas seguras.

## Archivos principales

- `src/services/server/ragCoachSocioContextService.ts`
- `src/services/server/ragCoachUnifiedChatService.ts`
- `src/interfaces/ragCoachChat.interface.ts`
- `src/app/dashboard/coach/page.tsx`
- `src/lib/swagger/openApiSpec.ts`

## Comportamiento

El Coach IA ahora puede:

- Usar objetivo, nivel y días del socio si el mensaje no los explicita.
- Considerar si el socio ya tiene rutinas o dietas previas.
- Recomendar evolución física inicial si no existe.
- Recomendar actualización mensual si ya existe evolución física.
- Considerar asistencia reciente para sugerir retomar de forma progresiva.
- Considerar restricciones preventivas de ficha médica sin exponer detalles sensibles innecesarios.
- Mostrar en la UI una línea breve de “Contexto aplicado”.

## Seguridad

- No se generan migraciones SQL.
- No se expone información médica completa en la respuesta del Coach.
- No se indexa ficha médica ni evolución personal en el corpus RAG global.
- Si el usuario es socio, no puede construir contexto de otro socio.
- El Coach mantiene disclaimers y límites: no diagnostica ni reemplaza profesionales.

## Validación esperada

1. Entrar como socio.
2. Ir a `/dashboard/coach`.
3. Enviar: `No sé por dónde empezar, quiero mejorar mi físico`.
4. Verificar que la respuesta mencione contexto aplicado.
5. Enviar: `Quiero una rutina para ganar masa muscular`.
6. Verificar que use defaults de objetivo/nivel/días si existen en el socio.
7. Enviar: `Estoy estancado, analizá mi evolución física`.
8. Verificar que siga funcionando el análisis de evolución.

## Próxima evolución

- Persistencia de memoria conversacional.
- Confirmación explícita antes de guardar rutina/dieta en todos los casos.
- Recordatorios mensuales por campanita para evolución física.
- Mayor personalización por historial de asistencia y adherencia.
