# Gym Master — RAG Coach Evolución Física v1

## Rama

`feature/rag-coach-evolucion-fisica-v1`

## Objetivo

Conectar el RAG Coach con el módulo de evolución física para interpretar el progreso del socio usando datos reales registrados en Gym Master y referencias recuperadas desde el RAG interno.

La feature no guarda datos privados del socio dentro del corpus global RAG. Los registros de evolución se usan solo como contexto runtime para generar el análisis.

## Alcance implementado

- Nuevo endpoint `POST /api/evolucion_socio/rag-assistant/analizar`.
- Nuevo servicio `ragEvolucionFisicaCoachService`.
- Nueva interfaz `ragEvolucionFisicaAssistant.interface.ts`.
- Nuevo panel UI `EvolucionFisicaRagCoachPanel` dentro de `/dashboard/evolucion-fisica`.
- Cálculo de diferencias entre registro inicial y actual:
  - peso,
  - cintura,
  - IMC,
  - porcentaje graso,
  - masa muscular.
- Tendencia principal generada de forma determinística y segura.
- Búsqueda RAG sobre dominios `exercise`, `diet_rule`, `safety` y `evolution`.
- Recomendaciones prudentes de ajuste.
- Disclaimers de salud obligatorios.
- Alertas simples ante lesiones, dolor o señales sensibles.
- Swagger/OpenAPI actualizado.

## Endpoint

```txt
POST /api/evolucion_socio/rag-assistant/analizar
```

### Payload

```json
{
  "socio_id": "UUID_DEL_SOCIO_O_me",
  "idioma": "es",
  "objetivo": "Bajar grasa sin perder masa muscular",
  "mensajeSocio": "Quiero saber si voy bien y qué debería ajustar esta semana.",
  "restricciones": "Cuidar rodilla derecha, evitar impacto alto."
}
```

Para usuario socio autenticado, `socio_id` puede omitirse o enviarse como `me`.

## Variables

```env
RAG_EVOLUTION_MATCH_THRESHOLD=0.3
RAG_EVOLUTION_MATCH_COUNT=8
```

Para QA local con poco corpus puede usarse temporalmente:

```env
RAG_EVOLUTION_MATCH_THRESHOLD=0.0
```

## Seguridad

- No diagnostica.
- No reemplaza profesional médico, nutricionista ni entrenador.
- No promete resultados.
- No interpreta imágenes médicas.
- No guarda datos privados de evolución del socio como documentos RAG globales.
- Si detecta lesiones, dolor, presión, mareos o síntomas sensibles, devuelve advertencias.

## Resultado esperado

La pantalla `/dashboard/evolucion-fisica` muestra un panel de RAG Coach que permite solicitar análisis, ver tendencia, diferencias de métricas, recomendaciones, referencias RAG y disclaimers.
