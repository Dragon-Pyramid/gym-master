# feature/rag-coach-contextual-memory-v1

## Objetivo

Mejorar la continuidad contextual del RAG Coach para que sus respuestas no se comporten como mensajes aislados, sino como una asistencia más personalizada basada en:

- contexto operativo real del socio;
- últimas rutinas/dietas/evolución disponibles;
- asistencia reciente;
- ficha médica y restricciones preventivas;
- mensajes recientes de la conversación actual;
- intención anterior, sugerencias pendientes y próximos pasos.

## Alcance implementado

### Frontend

Archivo principal:

- `src/app/dashboard/coach/page.tsx`

Cambios principales:

- Se envía `conversationContext` al endpoint del Coach con los últimos mensajes de la sesión.
- Se conserva intención anterior, acciones generadas, sugerencias y parámetros pendientes.
- Se agrega bloque visual de **Memoria contextual** dentro de cada respuesta del Coach.
- Se agrega card lateral de memoria con:
  - confianza contextual;
  - objetivo inferido/cargado;
  - nivel;
  - cantidad de rutinas;
  - cantidad de dietas;
  - registros de evolución;
  - score contextual.
- Se muestra trazabilidad contextual desplegable para QA.
- Se mantienen responsive mobile/desktop, modo claro/oscuro y shell vertical para evitar espacio blanco después del footer.

### Contrato de datos

Archivo:

- `src/interfaces/ragCoachChat.interface.ts`

Se agregan tipos para:

- `RagCoachConversationMemory`;
- `RagCoachConversationMemoryMessage`;
- `RagCoachContextSnapshot`;
- `memoryHighlights`;
- `memoryTrace`;
- `contextConfidence`.

### Servicio de contexto del socio

Archivo:

- `src/services/server/ragCoachSocioContextService.ts`

Se extiende el contexto del socio con:

- snapshot resumido;
- score de disponibilidad contextual;
- etiqueta de readiness;
- highlights de memoria;
- foco recomendado.

### Servicio unificado del Coach

Archivo:

- `src/services/server/ragCoachUnifiedChatService.ts`

Se agrega:

- sanitización de memoria conversacional recibida desde el frontend;
- reinterpretación de follow-ups cortos como “sí”, “dale”, “seguimos”, “qué hago hoy”;
- resolución de intención usando memoria previa;
- trazabilidad contextual;
- contexto de confianza;
- prefijo de memoria en respuestas;
- propagación de snapshot, highlights y trace hacia el frontend.

## Qué no toca

- No agrega migración DB.
- No modifica tablas.
- No modifica endpoints.
- No modifica Swagger/OpenAPI porque no se crean rutas nuevas ni se cambia la URL del contrato externo.
- No toca generación base de rutinas/dietas/evolución más allá de enriquecer contexto e intención.
- No toca PWA/service worker.

## QA sugerido

1. Entrar como socio a `/dashboard/coach`.
2. Enviar: `No sé por dónde empezar`.
3. Confirmar que devuelve orientación y muestra datos faltantes.
4. Enviar luego: `dale` o `sí`.
5. Confirmar que el Coach usa memoria de la conversación para continuar en vez de responder genérico.
6. Enviar: `Qué hago hoy`.
7. Confirmar que intenta apoyarse en rutina/contexto previo.
8. Enviar: `Quiero una dieta que acompañe la rutina`.
9. Confirmar que detecta intención dieta usando memoria de la rutina previa.
10. Revisar que aparezca la card lateral de memoria contextual.
11. Revisar que aparezca el bloque `Memoria contextual` dentro de las respuestas.
12. Revisar `Trazabilidad contextual` en QA.
13. Probar modo claro y oscuro.
14. Probar F12 mobile y salida a desktop.
15. Confirmar que no hay scroll horizontal ni espacio blanco después del footer.

## Commit sugerido

```bash
git commit -m "feat: add contextual memory to RAG Coach"
```
