# feature/rag-coach-final-polish-v1

## Objetivo

Pulir la experiencia final del RAG Coach de Gym Master antes de release/demo comercial, reforzando claridad visual, trazabilidad de fuentes, contexto del socio, mensajes de seguridad, estados de carga/error y comportamiento responsive.

## Alcance

- Pantalla `/dashboard/coach`.
- Chat unificado de Coach IA.
- Rutinas, dietas y evolución física desde un mismo flujo conversacional.
- Contexto del socio aplicado a las respuestas.
- Fuentes RAG visibles cuando existen coincidencias recuperadas.
- Safety fallback para señales sensibles.
- Estados vacíos/loading/error.
- Diseño claro/oscuro.
- Mobile/desktop sin scroll horizontal.
- Shell vertical `Header / Contenido / Footer` para evitar espacio blanco luego del footer al entrar/salir de F12 mobile.

## Cambios principales

### UI/UX del Coach

- Se reemplazó la pantalla de chat básica por una experiencia más finalizada y comercial:
  - hero ejecutivo;
  - métricas de conversación;
  - checklist de calidad;
  - panel lateral con capacidades;
  - disclaimer visible;
  - acciones visuales por tipo de respuesta.
- Se agregó botón para reiniciar conversación.
- Se mejoró el estado inicial del Coach y el estado de carga.
- Se pulieron burbujas, tarjetas, botones, contraste dark/light y prompts rápidos.

### Fuentes y trazabilidad

- Se amplió el contrato del chat para incluir:
  - `ragSummary`;
  - `sources`;
  - `warnings`;
  - `safetyNotes`;
  - `safetySummary`.
- Cuando el backend recupera contexto RAG de rutinas, dietas o evolución física, la UI muestra hasta 4 fuentes con:
  - título;
  - dominio;
  - tabla origen;
  - similitud;
  - preview de contenido.

### Seguridad y fallback

- Se incorporaron notas de seguridad por mensaje y por acción.
- Si el mensaje menciona señales sensibles como dolor de pecho, desmayo, falta de aire o taquicardia, no se ejecutan acciones automáticas de rutina/dieta/evolución y se devuelve orientación segura.
- Las dietas siguen marcadas como orientación general y no reemplazan evaluación profesional.
- Se incorporan restricciones de ficha médica cuando existen.

### Robustez del backend

- Se mantiene el flujo existente del chat unificado.
- Las acciones de rutina, dieta y evolución ahora capturan resumen RAG, fuentes, advertencias y notas de seguridad.
- Si una acción puntual falla, el Coach devuelve una acción fallida controlada en vez de romper toda la conversación.

## Archivos modificados

- `src/app/dashboard/coach/page.tsx`
- `src/interfaces/ragCoachChat.interface.ts`
- `src/services/server/ragCoachUnifiedChatService.ts`

## Archivos agregados

- `docs/mobile/rag-coach-final-polish-v1.md`

## Base de datos

No requiere migración DB.

## Endpoints / Swagger

No se agregan endpoints nuevos ni se modifica el path público del endpoint existente.

Se mantiene:

- `POST /api/rag/coach/chat`

No se actualizó Swagger porque no cambia la ruta ni el flujo público principal, solo se enriquecen campos opcionales del payload de respuesta usado por el frontend del Coach.

## QA sugerido

1. Entrar como socio a `/dashboard/coach`.
2. Confirmar hero, checklist, panel lateral y disclaimer.
3. Enviar: `Quiero una rutina para ganar masa muscular 3 días por semana`.
4. Confirmar que genera rutina, muestra acción, próximo paso y link a rutinas.
5. Enviar: `Quiero una dieta para bajar grasa sin perder músculo`.
6. Confirmar que genera dieta, muestra disclaimer/seguridad y link a dietas.
7. Enviar: `Estoy estancado, analizá mi evolución física`.
8. Confirmar análisis, recomendaciones y link a evolución física.
9. Si hay RAG configurado con resultados, confirmar bloque de fuentes recuperadas.
10. Probar mensaje general: `No sé por dónde empezar`.
11. Confirmar missing params y sugerencias.
12. Probar mensaje sensible: `Tengo dolor de pecho y quiero entrenar fuerte`.
13. Confirmar que se activa fallback de seguridad y no se genera rutina/dieta automática.
14. Probar dark mode y light mode.
15. Probar F12 mobile.
16. Salir de F12 mobile a desktop.
17. Confirmar que no queda espacio blanco después del footer.
18. Confirmar que no aparece scroll horizontal.
19. Ejecutar `npm run build`.
20. Restaurar PWA generados si aparecen.

## Notas

Esta feature corresponde a polish final del RAG Coach. La memoria contextual avanzada persistida y el historial conversacional formal quedan para la siguiente feature del roadmap:

- `feature/rag-coach-contextual-memory-v1`
