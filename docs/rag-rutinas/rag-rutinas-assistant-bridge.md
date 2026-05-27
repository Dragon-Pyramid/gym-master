# RAG Rutinas Assistant — puente inicial Gym Master

## Rama

`feature/rag-rutinas-assistant`

## Objetivo

Preparar a Gym Master para integrarse con el futuro microservicio externo `gym-master-rag-coach`, sin acoplar claves ni lógica pesada de IA dentro del frontend.

Esta feature agrega un flujo inicial para que el socio pueda solicitar una rutina desde una pantalla conversacional/guiada. El sistema queda preparado para consultar al RAG cuando esté disponible y, mientras tanto, usa el generador formal actual de Gym Master como fallback seguro.

## Componentes agregados

- Pantalla: `/dashboard/rutinas/asistente`
- Endpoint puente: `POST /api/rutinas/rag-assistant/generar`
- Servicio frontend: `generarRutinaConAsistente`
- Contratos TypeScript: `RagRutinasAssistantRequest`, `RagRutinasAssistantResponseData`
- Documentación Swagger/OpenAPI
- Variables de entorno opcionales para `gym-master-rag-coach`

## Flujo funcional

1. El socio ingresa al Asistente de Rutinas.
2. Selecciona objetivo, nivel, días por semana e idioma.
3. Agrega preferencias o restricciones.
4. Gym Master envía los datos al endpoint seguro del backend.
5. El backend arma el contrato para `gym-master-rag-coach`.
6. Si el RAG está configurado, consulta el microservicio externo.
7. Si no está configurado o falla, usa fallback local.
8. Gym Master guarda la rutina usando el generador formal actual.
9. El socio recibe el mensaje: “Dirigite al menú Rutinas y allí la encontrarás.”

## Variables de entorno

```env
GYM_MASTER_RAG_COACH_URL=
GYM_MASTER_RAG_COACH_API_KEY=
GYM_MASTER_RAG_COACH_GENERATE_PATH=/api/v1/routines/generate
```

Si `GYM_MASTER_RAG_COACH_URL` no está definida, el endpoint opera en modo `local_fallback`.

## Contrato hacia gym-master-rag-coach

Payload esperado hacia el microservicio:

```json
{
  "source": "gym-master",
  "contractVersion": "v0.1",
  "user": {
    "id": "uuid_usuario",
    "id_socio": "uuid_socio",
    "email": "socio@email.com",
    "rol": "socio"
  },
  "request": {
    "objetivo": 1,
    "nivel": 2,
    "dias": 4,
    "idioma": "es",
    "mensajeSocio": "Quiero ganar masa muscular y priorizar pecho y espalda.",
    "restricciones": "Sin lesiones. Prefiero máquinas."
  },
  "expectedOutput": {
    "structuredJson": true,
    "saveRoutineInGymMaster": false,
    "returnSuggestedParameters": true
  }
}
```

Respuesta recomendada desde el microservicio:

```json
{
  "objetivo": 1,
  "nivel": 2,
  "dias": 4,
  "idioma": "es",
  "resumen": "Se recomienda rutina de hipertrofia con frecuencia 2 en tren superior.",
  "mensajeFinal": "Tu rutina se generó en base a lo que me pediste. Dirigite al menú Rutinas y allí la encontrarás.",
  "advertencias": [],
  "rutinaJson": {}
}
```

En esta etapa, Gym Master no persiste directamente `rutinaJson` externo. El RAG sugiere parámetros y justificación, y Gym Master mantiene el guardado formal con su generador actual.

## Seguridad

- El frontend no conoce la URL interna ni la API key del RAG.
- La llamada al microservicio ocurre únicamente desde backend.
- Si falta token, el endpoint responde 401.
- Si el RAG no está disponible, el sistema no rompe: usa fallback local.
- Los textos enviados por el socio se limitan en longitud para evitar payloads excesivos.

## Relación con features anteriores

Esta feature depende conceptualmente de:

- `feature/rutinas-exercise-knowledge-base-seed`
- `feature/rutinas-exercise-media-catalog`
- `feature/rutinas-exercise-media-cloudinary-import`
- `feature/rutinas-exercise-media-equivalence-sync`
- `feature/rag-rutinas-dataset-prompts`
- `feature/rag-rutinas-coach-knowledge-base`

## Próximos pasos

1. Crear repo externo `gym-master-rag-coach`.
2. Implementar microservicio Python/FastAPI.
3. Cargar knowledge base/documentos curados.
4. Agregar pgvector o vector store equivalente.
5. Hacer que el RAG devuelva JSON estructurado validado.
6. Evolucionar Gym Master para persistir rutinas generadas por JSON completo cuando corresponda.
7. Incorporar comparación contra rutina previa para evitar rutinas idénticas.
8. Agregar soporte bilingüe completo para rutina generada.
