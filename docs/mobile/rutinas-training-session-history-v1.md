# Gym Master — Rutinas training session history v1

## Rama

`feature/rutinas-training-session-history-v1`

## Objetivo

Agregar historial formal de sesiones de entrenamiento para socios, sobre la base del marcado rápido de ejercicios ya validado en la feature anterior.

## Alcance funcional

- El socio puede iniciar una sesión de entrenamiento desde el detalle de una rutina.
- La sesión se guarda en backend con fecha/hora de inicio.
- Se crea snapshot de ejercicios por día para conservar trazabilidad aunque la rutina cambie después.
- Al marcar/reabrir ejercicios dentro de una sesión activa, el avance se persiste en base de datos.
- El socio puede finalizar una sesión y verla en el historial.
- El socio puede cancelar una sesión iniciada por error.
- Si no hay sesión activa, se mantiene el marcado local anterior como fallback liviano por dispositivo.
- Se muestra historial de sesiones finalizadas/canceladas con porcentaje, ejercicios completados y duración.

## Alcance técnico

### Frontend

- `src/components/dashboard/rutinas/RutinaDisplay.tsx`
  - integra sesión activa;
  - muestra historial formal;
  - conserva progreso local cuando no hay sesión iniciada;
  - sincroniza ejercicios completados contra API.

### API

- `GET /api/rutina/training-sessions?rutinaId=...`
- `POST /api/rutina/training-sessions`
- `PATCH /api/rutina/training-sessions/{id}`

### Servicios

- `src/services/server/rutinaTrainingSessionService.ts`
  - valida pertenencia de rutina;
  - evita que un socio registre sesiones sobre rutinas de otros socios;
  - permite a admin consultar/operar con control desde API;
  - usa service role solo del lado servidor.

### Swagger

- `src/lib/swagger/openApiSpec.ts` actualizado con los endpoints nuevos.

## Base de datos

Se agrega SQL privado no commiteable en:

- `database/private/20260704_rutinas_training_session_history_v1.sql`
- `database/private/20260704_validate_rutinas_training_session_history_v1.sql`

Tablas nuevas:

- `rutina_training_session`
- `rutina_training_session_exercise`

Estas tablas no quedan expuestas directamente a `anon` ni `authenticated`; la operación pasa por API Routes autenticadas con JWT propio.

## QA sugerido

1. Aplicar migración privada local/remota.
2. Entrar como socio a `/dashboard/rutinas`.
3. Abrir una rutina.
4. Iniciar sesión de entrenamiento.
5. Marcar ejercicios como completados.
6. Reabrir un ejercicio.
7. Finalizar sesión.
8. Confirmar aparición en historial.
9. Iniciar una segunda sesión.
10. Cancelar sesión.
11. Confirmar que la sesión cancelada aparece como cancelada.
12. Recargar página y confirmar persistencia del historial.
13. Confirmar que admin no ve acciones personales de socio en gestión de rutinas.
14. Confirmar que no hay scroll horizontal ni espacio blanco después del footer.

## Notas

La feature deja preparada una base sólida para futuros reportes de adherencia real por rutina, streaks de entrenamiento, evolución por frecuencia y recomendaciones del coach RAG basadas en sesiones completadas.
