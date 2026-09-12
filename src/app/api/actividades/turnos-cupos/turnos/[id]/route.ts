import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/services/supabaseServerClient";

import {
  authorizationErrorResponse,
  authorizeDashboardRequest,
} from '@/lib/auth/serverAuthorization';

export const dynamic = "force-dynamic";

const VALID_ESTADOS = new Set(["activo", "pausado", "cancelado"]);

const TURNO_NOT_FOUND_ERROR = "No se encontró el turno con ese id";

function turnoValidationErrorResponse(message: string) {
  switch (message) {
    case "El día de semana debe estar entre 1 y 7":
      return NextResponse.json(
        { error: "El día de semana debe estar entre 1 y 7" },
        { status: 400 },
      );

    case "El cupo máximo debe ser mayor a cero":
      return NextResponse.json(
        { error: "El cupo máximo debe ser mayor a cero" },
        { status: 400 },
      );

    case "Estado de turno inválido":
      return NextResponse.json(
        { error: "Estado de turno inválido" },
        { status: 400 },
      );

    default:
      return null;
  }
}

function cleanString(value: unknown) {
  const text = String(value ?? "").trim();
  return text.length ? text : null;
}

function normalizePartialPayload(body: any) {
  const payload: Record<string, unknown> = {};

  if (body.actividad_id !== undefined) payload.actividad_id = cleanString(body.actividad_id);
  if (body.nombre_turno !== undefined) payload.nombre_turno = cleanString(body.nombre_turno);
  if (body.dia_semana !== undefined) {
    const diaSemana = Number(body.dia_semana);
    if (!Number.isInteger(diaSemana) || diaSemana < 1 || diaSemana > 7) throw new Error("El día de semana debe estar entre 1 y 7");
    payload.dia_semana = diaSemana;
  }
  if (body.hora_inicio !== undefined) payload.hora_inicio = cleanString(body.hora_inicio);
  if (body.hora_fin !== undefined) payload.hora_fin = cleanString(body.hora_fin);
  if (body.cupo_maximo !== undefined) {
    const cupoMaximo = Number(body.cupo_maximo);
    if (!Number.isFinite(cupoMaximo) || cupoMaximo <= 0) throw new Error("El cupo máximo debe ser mayor a cero");
    payload.cupo_maximo = cupoMaximo;
  }
  if (body.cupo_minimo !== undefined) {
    payload.cupo_minimo = body.cupo_minimo === null || body.cupo_minimo === "" ? null : Number(body.cupo_minimo);
  }
  if (body.instructor_id !== undefined) payload.instructor_id = cleanString(body.instructor_id);
  if (body.ubicacion !== undefined) payload.ubicacion = cleanString(body.ubicacion);
  if (body.estado !== undefined) {
    const estado = cleanString(body.estado) ?? "activo";
    if (!VALID_ESTADOS.has(estado)) throw new Error("Estado de turno inválido");
    payload.estado = estado;
  }
  if (body.fecha_inicio !== undefined) payload.fecha_inicio = cleanString(body.fecha_inicio);
  if (body.fecha_fin !== undefined) payload.fecha_fin = cleanString(body.fecha_fin);
  if (body.observaciones !== undefined) payload.observaciones = cleanString(body.observaciones);

  payload.actualizado_en = new Date().toISOString();
  return payload;
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await authorizeDashboardRequest(req, "/dashboard/actividades", ["admin", "usuario"]);
    const { id } = await context.params;
    const body = await req.json();
    const payload = normalizePartialPayload(body);
    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from("actividad_turno")
      .update(payload)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new Error(TURNO_NOT_FOUND_ERROR);

    return NextResponse.json({ message: "Turno actualizado correctamente", data }, { status: 200 });
  } catch (error) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;

    const message = error instanceof Error ? error.message : "Error al actualizar turno";

    const validationResponse = turnoValidationErrorResponse(message);
    if (validationResponse) return validationResponse;

    if (message === TURNO_NOT_FOUND_ERROR) {
      return NextResponse.json(
        { error: "Turno no encontrado" },
        { status: 404 },
      );
    }

    console.error("Error al actualizar turno:", error);
    return NextResponse.json(
      { error: "Error al actualizar turno" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await authorizeDashboardRequest(req, "/dashboard/actividades", ["admin", "usuario"]);
    const { id } = await context.params;
    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from("actividad_turno")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new Error(TURNO_NOT_FOUND_ERROR);

    return NextResponse.json({ message: "Turno eliminado correctamente" }, { status: 200 });
  } catch (error) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;

    const message = error instanceof Error ? error.message : "Error al eliminar turno";

    if (message === TURNO_NOT_FOUND_ERROR) {
      return NextResponse.json(
        { error: "Turno no encontrado" },
        { status: 404 },
      );
    }

    console.error("Error al eliminar turno:", error);
    return NextResponse.json(
      { error: "Error al eliminar turno" },
      { status: 500 },
    );
  }
}
