# Gym Master RAG Coach - Swagger/Admin Testing

## Objetivo

Esta feature deja el RAG Coach listo para ser probado de forma controlada desde Swagger/API administrativa antes de conectarlo al chat final de rutinas y dietas.

## Estado detectado en el ZIP + dump 2026-06-14

- La migración `202606141621_rag_coach_architecture_foundation` ya está aplicada en remoto.
- Existen las tablas `rag_document` y `rag_document_chunk`.
- Existe la RPC `match_rag_chunks`.
- En el dump recibido, las tablas RAG están creadas pero todavía no tienen documentos/chunks cargados.
- El catálogo base de ejercicios existe y debe ser la fuente real de ingesta inicial.
- No se agregan migraciones nuevas en esta feature.

## Endpoints documentados en Swagger

### `GET /api/rag/coach/status`

Devuelve estado no sensible del RAG:

- provider configurado;
- si RAG está activo;
- modelo de embeddings;
- conteos de documentos/chunks;
- chunks activos;
- chunks con embedding;
- chunks pendientes de embedding;
- advertencias operativas.

### `POST /api/rag/coach/ingest/ejercicios`

Ingesta ejercicios activos reales de Gym Master como documentos/chunks RAG.

Body sugerido:

```json
{
  "limit": 25,
  "force": false,
  "onlyMissing": true
}
```

### `POST /api/rag/coach/vectorize/pending`

Vectoriza chunks activos que todavía no tienen embedding, usando el provider configurado en backend.

Body sugerido:

```json
{
  "limit": 25,
  "force": false
}
```

Cuando `force=true`, vuelve a generar embeddings para chunks activos aunque ya tengan vector.

### `POST /api/rag/coach/search`

Busca conocimiento RAG usando `match_rag_chunks`.

Body sugerido:

```json
{
  "query": "rutina de piernas para socio principiante",
  "domains": ["exercise"],
  "sourceTables": ["ejercicio"],
  "matchCount": 8,
  "matchThreshold": 0.72
}
```

## Flujo de prueba recomendado

1. Configurar variables server-side en `.env.local` o Vercel:

```env
RAG_ENABLED=true
EMBEDDING_PROVIDER=github
GITHUB_TOKEN=...
GITHUB_MODELS_BASE_URL=https://models.github.ai/inference
GITHUB_MODELS_API_VERSION=2026-03-10
GITHUB_EMBEDDING_MODEL=text-embedding-3-small
GITHUB_EMBEDDING_MODEL_ID=openai/text-embedding-3-small
RAG_VECTOR_DIMENSIONS=1536
```

2. Reiniciar `npm run dev`.
3. Entrar a Swagger con usuario administrador.
4. Ejecutar `GET /api/rag/coach/status`.
5. Ejecutar `POST /api/rag/coach/ingest/ejercicios` con un límite chico, por ejemplo 5 o 10.
6. Si quedan chunks pendientes, ejecutar `POST /api/rag/coach/vectorize/pending`.
7. Ejecutar `POST /api/rag/coach/search` con consultas reales.
8. Verificar que los resultados devuelvan ejercicios reales, scores y metadata útil.

## Criterios de seguridad

- No exponer `GITHUB_TOKEN`, `OPENAI_API_KEY` ni service role en frontend, Swagger examples o docs versionadas.
- No ejecutar embeddings desde SQL Studio pegando tokens.
- Usar siempre endpoints backend autenticados.
- La ficha médica, evolución física personal e historial sensible del socio no se indexan como conocimiento global.

## Validación esperada

- `npm run build` pasa.
- Swagger muestra los endpoints RAG.
- El status RAG devuelve conteos y warnings claros.
- La ingesta usa ejercicios reales.
- La vectorización genera embeddings sin exponer tokens.
- La búsqueda devuelve resultados desde `match_rag_chunks`.

## Nota operativa por rate limit 429

Durante pruebas con GitHub Models puede aparecer:

```txt
GitHub Models embeddings falló (429): Too many requests
```

No indica error del catálogo ni de la migración. Es límite de velocidad del proveedor.

Recomendaciones:

- No iniciar con `limit: 100` sin pausa.
- Probar primero con `limit: 5` o `limit: 10`.
- Usar `delayMs: 750` o `delayMs: 1000` entre embeddings.
- Si una ingesta falla por 429, los documentos/chunks quedan preparados con `embedding=null` y pueden retomarse luego desde `POST /api/rag/coach/vectorize/pending`.

Payload recomendado para ingesta gradual:

```json
{
  "limit": 10,
  "force": false,
  "onlyMissing": true,
  "delayMs": 1000
}
```

Payload recomendado para vectorizar pendientes:

```json
{
  "limit": 10,
  "force": false,
  "delayMs": 1000
}
```
