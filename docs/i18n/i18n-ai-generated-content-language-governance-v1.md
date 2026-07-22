# i18n AI-generated content language governance v1

## Objetivo

Esta feature agrega una capa de gobernanza ES/EN para contenido generado por IA dentro de Gym Master, manteniendo la regla de no traducir automáticamente datos propios del gimnasio o del socio.

## Alcance funcional

Se cubren los flujos principales de generación asistida:

- Coach IA unificado (`/api/rag/coach/chat`).
- Asistente RAG de rutinas (`/api/rutinas/rag-assistant/generar`).
- Asistente RAG de dietas (`/api/dieta/rag-assistant/generar`).
- Análisis RAG de evolución física (`/api/evolucion_socio/rag-assistant/analizar`).
- Mensajes de fallback cuando RAG no está configurado o falla parcialmente.
- Disclaimers, advertencias, QA audit, sugerencias y próximos pasos generados por backend.

## Regla de gobernanza

- Si el cliente envía `locale: "en"` o `idioma: "en"`, el contenido generado por IA debe responder en inglés.
- Si no se envía idioma o llega un valor no soportado, el fallback seguro es español.
- Los datos cargados por gimnasio, socio o administrador se mantienen como datos reales y no se traducen automáticamente.
- Las fuentes recuperadas por RAG se preservan como referencia original; solo se gobiernan envoltorios, resumen técnico, advertencias y mensajes generados por Gym Master.

## Archivos principales

- `src/utils/aiGeneratedContentI18n.ts`: helper central para normalizar idioma, seleccionar textos ES/EN y traducir mensajes técnicos conocidos.
- `src/interfaces/ragCoachChat.interface.ts`: agrega `locale?: "es" | "en"` al contrato del Coach IA unificado.
- `src/app/dashboard/coach/page.tsx`: propaga el locale activo desde la UI hacia el endpoint del Coach IA.
- `src/app/api/rag/coach/chat/route.ts`: normaliza `locale`/`idioma` y lo pasa al servicio unificado.
- `src/lib/swagger/openApiSpec.ts`: documenta el campo opcional `locale` del Coach IA unificado.
- `src/services/server/ragCoachUnifiedChatService.ts`: aplica el idioma en respuestas, acciones, QA, safety notes, sugerencias, next best step y fallbacks.
- `src/services/server/ragRutinasCoachService.ts`: aplica idioma en resumen RAG y warnings de rutinas.
- `src/services/server/ragDietasCoachService.ts`: aplica idioma en resumen RAG, warnings y disclaimers de dietas.
- `src/services/server/ragEvolucionFisicaCoachService.ts`: aplica idioma en análisis local/RAG, recomendaciones, alertas y disclaimers de evolución física.

## Validación recomendada

1. Ejecutar build completo:

```bash
rm -rf .next
npm run build
```

2. Restaurar artefactos PWA si el build los modifica:

```bash
git restore public/sw.js public/workbox-*.js public/fallback-*.js 2>/dev/null || true
rm -f public/fallback-*.js
```

3. Validar manualmente en UI con idioma inglés:

- Enviar un mensaje general al Coach IA.
- Pedir una rutina automática.
- Pedir una dieta automática.
- Pedir análisis de evolución física.
- Verificar que `reply`, `actions.message`, `suggestedReplies`, `safetySummary`, `nextBestStep`, advertencias y disclaimers salgan en inglés.

4. Validar que en español se conserve el comportamiento previo.

## Fuera de alcance

- No se modifican tablas ni migraciones.
- No se traducen datos históricos o manuales cargados por cada gimnasio.
- No se cambia la lógica de generación formal de rutinas/dietas.
- No se cambian reglas de negocio, cálculos biométricos ni almacenamiento.
