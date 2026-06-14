# Gym Master RAG Coach - Architecture Foundation

## Objetivo

Esta feature crea la base técnica del futuro RAG Coach de Gym Master sin implementar todavía el chat final de rutinas/dietas.

La prioridad inicial es mantener una arquitectura liviana, compatible con Vercel + Supabase free tier y preparada para evolucionar a infraestructura full cuando el producto genere ingresos.

## Alcance incluido

- Variables de entorno RAG documentadas.
- Adapter de embeddings GitHub/OpenAI.
- Tablas `rag_document` y `rag_document_chunk` con `pgvector`.
- RPC `match_rag_chunks` para búsqueda vectorial.
- Ingesta inicial de ejercicios como conocimiento RAG.
- Búsqueda vectorial administrativa para validar embeddings y recuperación.
- Endpoint de estado RAG.

## Endpoints

### Estado

```txt
GET /api/rag/coach/status
```

Devuelve configuración no sensible, advertencias y conteos de documentos/chunks.

### Ingesta de ejercicios

```txt
POST /api/rag/coach/ingest/ejercicios
```

Body sugerido:

```json
{
  "limit": 25,
  "force": false
}
```

### Búsqueda vectorial

```txt
POST /api/rag/coach/search
```

Body sugerido:

```json
{
  "query": "rutina para piernas nivel principiante",
  "domains": ["exercise"],
  "matchCount": 8,
  "matchThreshold": 0.72
}
```

## Variables de entorno

```env
RAG_ENABLED=true
RAG_VECTOR_DIMENSIONS=1536
RAG_VECTOR_TABLE=rag_document_chunk
RAG_VECTOR_RPC=match_rag_chunks
RAG_MATCH_THRESHOLD=0.72
RAG_MATCH_COUNT=8
RAG_CONTEXT_MAX_CHARS=12000
RAG_DEBUG=false

EMBEDDING_PROVIDER=github

GITHUB_TOKEN=
GITHUB_MODELS_BASE_URL=https://models.github.ai/inference
GITHUB_MODELS_API_VERSION=2026-03-10
GITHUB_EMBEDDING_MODEL=text-embedding-3-small
GITHUB_EMBEDDING_MODEL_ID=openai/text-embedding-3-small

OPENAI_API_KEY=
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

RAG_ENABLE_QUERY_REWRITE=true
RAG_ENABLE_FUSION=true
RAG_FUSION_QUERY_COUNT=3
RAG_ENABLE_HEURISTIC_RERANK=true
RAG_ENABLE_SAFETY_VALIDATOR=true
RAG_ENABLE_EXPLAINABILITY=true
RAG_ENABLE_TRACE=true

RAG_COACH_LANGUAGE=es-AR
RAG_COACH_TONE=empatico_motivacional
RAG_MEDICAL_DISCLAIMER_ENABLED=true
RAG_REQUIRE_HUMAN_REVIEW_FOR_HIGH_RISK=true
```

## Criterio de privacidad

Los ejercicios, reglas generales y conocimiento curado pueden indexarse como documentos RAG.

Datos privados del socio, como ficha médica, evolución física o historial personal, no deben indexarse como conocimiento global. Esos datos se usarán luego como contexto privado en runtime.

## Próximas fases

- `feature/rag-coach-chat-rutinas-v1`
- `feature/rag-coach-dietas-v1`
- `feature/rag-coach-evolucion-fisica-v1`
- `feature/rag-coach-pdf-output`
