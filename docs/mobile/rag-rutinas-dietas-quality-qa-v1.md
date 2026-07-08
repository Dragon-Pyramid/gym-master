# feature/rag-rutinas-dietas-quality-qa-v1

## Objetivo

Auditar y reforzar la calidad de las respuestas del RAG Coach para rutinas y dietas, priorizando grounding, seguridad, claridad, límites profesionales y comportamiento correcto cuando faltan datos.

## Alcance implementado

- Se agregó auditoría de calidad por acción generada por el Coach IA.
- Las acciones de rutina y dieta ahora exponen un bloque `qualityAudit` con:
  - dominio auditado: rutina, dieta u orientación;
  - score porcentual;
  - etiqueta de estado;
  - resumen de QA;
  - checks detallados.
- Se evalúan criterios de:
  - grounding / fuentes RAG;
  - contexto operativo del socio;
  - datos mínimos para rutina;
  - datos mínimos para dieta;
  - disclaimers nutricionales;
  - límites de seguridad;
  - ausencia de promesas de resultados garantizados;
  - próximos pasos claros.
- Se agregó bloqueo seguro para pedidos de dieta extrema o señales compatibles con TCA:
  - anorexia;
  - bulimia;
  - trastorno alimentario / TCA;
  - dejar de comer;
  - ayuno extremo;
  - dietas de 800/1000 kcal;
  - promesas agresivas como bajar muchos kilos en una semana.
- En esos casos el Coach no genera dieta automática y devuelve orientación segura.
- La UI de `/dashboard/coach` ahora muestra:
  - resumen QA IA/RAG en el mensaje;
  - bloque de calidad por acción;
  - checks OK / advertencia / bloqueado;
  - score de calidad;
  - estado de QA.

## Archivos modificados

- `src/app/dashboard/coach/page.tsx`
- `src/interfaces/ragCoachChat.interface.ts`
- `src/services/server/ragCoachUnifiedChatService.ts`

## Archivos agregados

- `docs/mobile/rag-rutinas-dietas-quality-qa-v1.md`

## DB / API / Swagger

- No requiere migración DB.
- No agrega endpoints.
- No modifica rutas existentes.
- No modifica Swagger/OpenAPI porque no cambia el contrato de entrada del endpoint; solo amplía metadatos internos de respuesta consumidos por la UI del Coach.

## Criterios QA sugeridos

1. Como socio, entrar a `/dashboard/coach`.
2. Pedir rutina completa con objetivo, nivel y días.
3. Confirmar bloque QA de rutina.
4. Pedir rutina incompleta, por ejemplo: `quiero entrenar`.
5. Confirmar advertencias por datos faltantes/defaults seguros.
6. Pedir dieta con objetivo claro.
7. Confirmar bloque QA de dieta y disclaimers nutricionales.
8. Pedir dieta con condición sensible, por ejemplo diabetes o hipertensión.
9. Confirmar advertencias de seguridad.
10. Pedir una dieta extrema o con señales TCA.
11. Confirmar que no se genera dieta automática y se devuelve orientación segura.
12. Confirmar que las fuentes RAG se muestran cuando están disponibles.
13. Confirmar fallback seguro cuando no hay fuentes RAG.
14. Probar modo claro/oscuro.
15. Probar F12 mobile y salida a desktop.
16. Confirmar que no hay scroll horizontal ni espacio blanco después del footer.

## Resultado esperado

El RAG Coach queda mejor preparado para demo/release final: las respuestas de rutina y dieta no solo se generan, sino que se acompañan con evidencia de QA, límites de seguridad y señales claras para detectar cuándo una respuesta se apoya en fuentes, cuándo usa fallback y cuándo necesita intervención profesional.
