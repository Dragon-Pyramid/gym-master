# Gym Master - RAG Coach Corpus Ingestion Final

## Rama

`feature/rag-coach-corpus-ingestion-final`

## Objetivo

Completar la operación de ingesta real y controlada del corpus RAG de Gym Master, con estado administrativo, tandas pequeñas, delay configurable y continuidad segura ante límites 429 del proveedor de embeddings.

## Alcance

- Estado detallado del corpus RAG.
- Contadores por dominio.
- Cobertura de ejercicios activos vs ejercicios indexados.
- Cobertura de reglas nutricionales vs reglas indexadas.
- Chunks activos, vectorizados y pendientes.
- Ejecución de tandas de ingesta y vectorización desde API y panel admin.
- Reintentos suaves ante fallos temporales del proveedor de embeddings.
- Recomendaciones operativas para continuar la carga.

## Endpoints nuevos

- `GET /api/rag/coach/corpus/status`
- `POST /api/rag/coach/corpus/run`

## Pantalla nueva

- `/dashboard/rag-corpus`

## Acciones soportadas

- `ingest_exercises`: ingesta ejercicios activos.
- `ingest_diet_rules`: ingesta reglas nutricionales desde `comida_base`.
- `vectorize_pending`: vectoriza chunks activos pendientes.
- `all`: ejecuta tanda completa chica.

## Recomendación de uso

Para GitHub Models se recomienda:

```json
{
  "action": "vectorize_pending",
  "limit": 10,
  "delayMs": 1000,
  "force": false,
  "maxRetries": 1,
  "retryDelayMs": 1500
}
```

Si aparece rate limit 429, no se debe forzar carga masiva. Se espera y luego se continúa con `vectorize_pending`.

## Seguridad

- Solo admin puede administrar el corpus.
- No se agregan migraciones SQL.
- No se exponen tokens ni secretos.
- No se indexan datos privados del socio.

## Validación esperada

1. Entrar como admin.
2. Ir a `/dashboard/rag-corpus`.
3. Consultar estado actual del corpus.
4. Ejecutar una tanda chica de vectorización pendiente.
5. Ejecutar una tanda chica de ingesta de ejercicios o dietas.
6. Verificar actualización de contadores.
7. Validar desde Swagger los endpoints nuevos.
