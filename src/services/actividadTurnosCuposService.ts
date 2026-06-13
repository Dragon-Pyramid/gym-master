import { authHeader } from "@/services/storageService";
import type {
  ActividadInscripcionPayload,
  ActividadTurnoPayload,
  ActividadTurnosCuposDashboard,
  ActividadTurnoInscripcion,
  ActividadTurno,
} from "@/interfaces/actividadTurnosCupos.interface";

async function readJsonOrThrow<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof payload?.error === "string"
        ? payload.error
        : "No se pudo completar la operación";
    throw new Error(message);
  }

  return payload as T;
}

export async function fetchActividadesTurnosCuposDashboard(): Promise<ActividadTurnosCuposDashboard> {
  const response = await fetch("/api/actividades/turnos-cupos", {
    headers: authHeader(),
    cache: "no-store",
  });

  return readJsonOrThrow<ActividadTurnosCuposDashboard>(response);
}

export async function createActividadTurno(
  payload: ActividadTurnoPayload,
): Promise<ActividadTurno> {
  const response = await fetch("/api/actividades/turnos-cupos/turnos", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(payload),
  });

  const data = await readJsonOrThrow<{ data: ActividadTurno }>(response);
  return data.data;
}

export async function updateActividadTurno(
  id: string,
  payload: Partial<ActividadTurnoPayload>,
): Promise<ActividadTurno> {
  const response = await fetch(`/api/actividades/turnos-cupos/turnos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(payload),
  });

  const data = await readJsonOrThrow<{ data: ActividadTurno }>(response);
  return data.data;
}

export async function deleteActividadTurno(id: string): Promise<void> {
  const response = await fetch(`/api/actividades/turnos-cupos/turnos/${id}`, {
    method: "DELETE",
    headers: authHeader(),
  });

  await readJsonOrThrow<{ message: string }>(response);
}

export async function createActividadInscripcion(
  payload: ActividadInscripcionPayload,
): Promise<ActividadTurnoInscripcion> {
  const response = await fetch("/api/actividades/turnos-cupos/inscripciones", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(payload),
  });

  const data = await readJsonOrThrow<{ data: ActividadTurnoInscripcion }>(response);
  return data.data;
}

export async function updateActividadInscripcion(
  id: string,
  payload: Partial<ActividadInscripcionPayload> & { estado?: string },
): Promise<ActividadTurnoInscripcion> {
  const response = await fetch(`/api/actividades/turnos-cupos/inscripciones/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(payload),
  });

  const data = await readJsonOrThrow<{ data: ActividadTurnoInscripcion }>(response);
  return data.data;
}

export async function deleteActividadInscripcion(id: string): Promise<void> {
  const response = await fetch(`/api/actividades/turnos-cupos/inscripciones/${id}`, {
    method: "DELETE",
    headers: authHeader(),
  });

  await readJsonOrThrow<{ message: string }>(response);
}
