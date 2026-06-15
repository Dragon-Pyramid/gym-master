# Gym Master — RAG Coach Chat Rutinas v1

## Objetivo

Conectar el RAG Coach ya validado desde Swagger/Admin con el asistente real de generación de rutinas de Gym Master.

Esta versión no reemplaza el generador formal existente. Lo complementa con recuperación semántica de ejercicios reales indexados en `rag_document` y `rag_document_chunk`, manteniendo fallback seguro si el RAG no está configurado, no devuelve resultados o falla el proveedor de embeddings.

## Alcance funcional

- El endpoint `POST /api/rutinas/rag-assistant/generar` consulta el RAG interno antes de generar la rutina.
- La consulta semántica usa el objetivo, nivel, días disponibles, mensaje del socio y restricciones.
- La recuperación se limita al dominio `exercise` y tabla fuente `ejercicio`.
- La rutina final se sigue creando con el generador formal de Gym Master (`dataGeneracionRutina`).
- La respuesta indica si se usó RAG interno, puente externo o fallback local.
- El frontend muestra referencias RAG aplicadas, títulos de ejercicios reales y score de similitud.
- Se mantienen advertencias técnicas visibles si el RAG está desactivado, incompleto o falla.

## Endpoints impactados

### `POST /api/rutinas/rag-assistant/generar`

Payload recomendado:

```json
{
  "objetivo": 1,
  "nivel": 1,
  "dias": 3,
  "idioma": "es",
  "mensajeSocio": "Quiero ganar masa muscular, entrenar 3 días por semana y priorizar piernas. Soy principiante.",
  "restricciones": "Cuidar rodilla derecha, evitar impacto alto."
}
```

Para prueba técnica con rol admin puede indicarse `id_socio`:

```json
{
  "objetivo": 1,
  "nivel": 1,
  "dias": 3,
  "idioma": "es",
  "mensajeSocio": "Rutina de fuerza inicial de 3 días con ejercicios seguros.",
  "restricciones": "Sin saltos ni impacto alto.",
  "id_socio": "2d2a45df-0fd5-4f4e-9c01-5de07dca1111"
}
```

## Modos de respuesta

| Modo | Significado |
| --- | --- |
| `internal_rag` | Se recuperaron referencias reales desde el RAG interno. |
| `external_rag_bridge` | Existe microservicio externo configurado y respondió. |
| `local_fallback` | No hubo RAG usable y se usó el generador formal seguro. |

## Variables de entorno

Variables base ya existentes:

```env
RAG_ENABLED=true
EMBEDDING_PROVIDER=github
GITHUB_TOKEN=token_real_solo_local_o_vercel
GITHUB_EMBEDDING_MODEL=text-embedding-3-small
GITHUB_EMBEDDING_MODEL_ID=openai/text-embedding-3-small
RAG_VECTOR_RPC=match_rag_chunks
```

Variables específicas para rutinas:

```env
RAG_ROUTINE_MATCH_THRESHOLD=0.3
RAG_ROUTINE_MATCH_COUNT=8
```

Para corpus chico de QA puede usarse temporalmente:

```env
RAG_ROUTINE_MATCH_THRESHOLD=0.0
```

## Validación recomendada

1. Confirmar que existen documentos/chunks RAG vectorizados:
   - `GET /api/rag/coach/status`
2. Generar rutina desde Swagger o frontend:
   - `POST /api/rutinas/rag-assistant/generar`
3. Verificar que la respuesta incluya:
   - `data.modo = "internal_rag"` cuando haya resultados.
   - `data.ragContext.used = true`.
   - `data.ragContext.results.length > 0`.
   - títulos de ejercicios reales.
   - `similarity` numérico.
4. Verificar que la rutina quede creada y visible en `/dashboard/rutinas`.
5. Validar que si el RAG no responde, la generación no se rompe y usa `local_fallback`.

## Consideraciones

- Esta feature no carga todo el corpus de ejercicios.
- La carga completa debe manejarse en tandas chicas por límite 429 de GitHub Models.
- Esta feature no implementa dietas ni evolución física.
- Esta feature no genera PDFs.
- El resultado final sigue pasando por el generador formal de Gym Master para no romper el modelo actual de rutinas.
