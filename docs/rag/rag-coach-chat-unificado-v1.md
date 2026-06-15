# Gym Master — RAG Coach Chat Unificado v1

## Rama

`feature/rag-coach-chat-unificado-v1`

## Objetivo

Crear una primera experiencia conversacional unificada para el Coach IA de Gym Master, integrando rutinas, dietas y evolución física en un único chat para el socio.

El chat no se comporta como un formulario rígido. Detecta intención, guía al socio, ejecuta acciones cuando corresponde y siempre indica dónde ver los resultados generados.

## Alcance implementado

- Nueva pantalla `/dashboard/coach`.
- Nuevo endpoint `POST /api/rag/coach/chat`.
- Nuevo servicio `ragCoachUnifiedChatService`.
- Nueva interfaz `ragCoachChat.interface.ts`.
- Nuevo cliente `ragCoachChatClient`.
- Nuevo ítem de menú `Coach IA` en Menú Personal.
- Permisos de menú actualizados.
- Swagger/OpenAPI actualizado.

## Capacidades v1

El Coach puede detectar:

- pedido de rutina,
- pedido de dieta,
- pedido de rutina + dieta,
- análisis de evolución física,
- pedido general/vago de acompañamiento.

Cuando genera una rutina, indica:

```txt
Podés verla desde Menú Personal → Asistente de Rutinas o desde tu historial de rutinas dentro del panel de socio.
```

Cuando genera una dieta, indica:

```txt
Podés verla desde Menú Personal → Asistente de Dietas / Dietas.
```

Cuando analiza evolución física, indica:

```txt
Podés volver a consultar tu seguimiento desde Menú Personal → Evolución Física.
```

## Endpoint

```txt
POST /api/rag/coach/chat
```

### Payload

```json
{
  "message": "Quiero una rutina para ganar masa muscular 3 días por semana y cuidar la rodilla.",
  "socio_id": "me"
}
```

### Respuesta

La respuesta incluye:

- intención detectada,
- respuesta conversacional,
- acciones realizadas,
- botones o rutas sugeridas,
- próximos pasos sugeridos.

## Comportamiento esperado

El Coach puede recibir mensajes como:

```txt
Quiero una rutina.
Quiero una dieta.
Estoy estancado.
No sé por dónde empezar.
Quiero mejorar mi físico.
Quiero bajar grasa.
```

Y debe responder de forma conversacional, guiando al socio según su nivel de compromiso.

## Alcance pendiente para próximas iteraciones

- Confirmación explícita antes de guardar rutina/dieta en todos los casos.
- Memoria conversacional persistida en base.
- Recordatorios mensuales por campanita para evolución física.
- Ocultar detalles técnicos para el socio y dejar modo debug/admin.
- Integración más profunda con preferencias del socio.
- Router de intents más avanzado o LLM controlado.

## Seguridad

- No diagnostica.
- No reemplaza médico, nutricionista ni entrenador.
- No promete resultados.
- Informa dónde ver cada resultado generado.
- Mantiene los disclaimers ya incorporados en dietas y evolución física.
