# RAG Coach contextual memory build fix v1

## Rama

`feature/rag-coach-contextual-memory-v1`

## Objetivo

Corregir un error de tipado detectado durante `npm run build` en el servicio unificado del RAG Coach.

## Corrección

La función `buildContextAwareGuidance` fue extendida para aceptar opcionalmente la memoria conversacional (`RagCoachConversationMemory`). El patch previo ya enviaba esa memoria al construir la respuesta de orientación, pero la firma de la función seguía aceptando únicamente `name`, `message` y `context`.

## Archivo modificado

- `src/services/server/ragCoachUnifiedChatService.ts`

## Alcance

- No toca DB.
- No agrega endpoints.
- No modifica Swagger/OpenAPI.
- No cambia contratos públicos.
- Mantiene el objetivo de memoria contextual de la sesión.

## Validación

Ejecutar:

```bash
npm run build
```
