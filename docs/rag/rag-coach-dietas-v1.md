# Gym Master — RAG Coach Dietas v1

## Objetivo

Conectar el RAG Coach con el flujo real de generación de dietas de Gym Master, usando reglas nutricionales reales del sistema y manteniendo un enfoque orientativo, seguro y no médico.

Esta versión no reemplaza a un nutricionista. El sistema genera dietas orientativas con el generador formal existente y usa RAG para aportar contexto, trazabilidad y advertencias.

## Alcance

- Nuevo endpoint `POST /api/dieta/rag-assistant/generar`.
- Nueva ingesta administrativa `POST /api/rag/coach/ingest/dietas` desde `comida_base`.
- Nuevo servicio `ragDietasCoachService` para recuperar reglas `diet_rule` y `safety`.
- Actualización del formulario de dietas para enviar pedido, restricciones y preferencias.
- Visualización de referencias RAG, scores, disclaimers y advertencias.
- Swagger actualizado.

## Flujo operativo

1. El admin o socio completa objetivo, fechas, pedido, restricciones y preferencias.
2. El backend consulta el RAG interno con esos datos.
3. El RAG recupera reglas nutricionales reales previamente indexadas desde `comida_base`.
4. El generador formal de Gym Master crea la dieta mediante `genera_dieta_socio`.
5. La respuesta incluye modo, resumen, referencias RAG, disclaimers y advertencias.
6. Si el RAG no está disponible, la dieta se genera igual con fallback seguro.

## Endpoints

### Ingesta RAG de reglas nutricionales

`POST /api/rag/coach/ingest/dietas`

Payload sugerido:

```json
{
  "limit": 10,
  "force": false,
  "onlyMissing": true,
  "delayMs": 750
}
```

### Generación de dieta con asistente RAG

`POST /api/dieta/rag-assistant/generar`

Payload sugerido:

```json
{
  "socio_id": "2d2a45df-0fd5-4f4e-9c01-5de07dca1111",
  "objetivo": 1,
  "fecha_inicio": "2026-06-15",
  "fecha_fin": "2026-07-15",
  "idioma": "es",
  "mensajeSocio": "Quiero bajar grasa sin perder músculo y necesito comidas simples.",
  "restricciones": "Evitar exceso de sodio. No tengo alergias conocidas.",
  "preferencias": "Prefiero pollo, arroz, verduras y comidas económicas."
}
```

## Variables de entorno

```env
RAG_DIET_MATCH_THRESHOLD=0.3
RAG_DIET_MATCH_COUNT=8
```

Para QA con corpus chico puede usarse temporalmente:

```env
RAG_DIET_MATCH_THRESHOLD=0.0
```

## Seguridad nutricional

La respuesta incluye disclaimers fijos:

- La dieta es orientativa.
- No reemplaza nutricionista.
- Ante enfermedades, embarazo, medicación, diabetes, hipertensión, trastornos alimentarios o condiciones clínicas, consultar con profesional.
- No prometer resultados físicos o médicos garantizados.

También detecta términos de riesgo como diabetes, hipertensión, embarazo, condiciones renales/hepáticas y TCA para agregar advertencias.

## Validación recomendada

1. Login admin desde Swagger.
2. Autorizar con Bearer token.
3. Ejecutar `POST /api/rag/coach/ingest/dietas` con límite chico.
4. Revisar `GET /api/rag/coach/status`.
5. Ejecutar `POST /api/dieta/rag-assistant/generar`.
6. Validar que la dieta se cree en `dieta`.
7. Validar que la respuesta incluya `ragContext`, disclaimers y advertencias.
8. Probar desde `/dashboard/dietas`.

## Consideraciones

- Esta feature no modifica la estructura de base de datos.
- Esta feature no genera PDF nuevo.
- Esta feature no reemplaza la lógica formal de `genera_dieta_socio`.
- La ingesta completa de reglas debe ejecutarse en tandas para evitar 429 del proveedor de embeddings.
