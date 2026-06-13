import { NextResponse } from "next/server";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { getSupabaseServerClient } from "@/services/supabaseServerClient";

export const dynamic = "force-dynamic";

const VALID_ESTADOS = new Set(["activo", "pausado", "cancelado"]);

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
    await authMiddleware(req);
    const { id } = await context.params;
    const body = await req.json();
    const payload = normalizePartialPayload(body);
    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from("actividad_turno")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ message: "Turno actualizado correctamente", data }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al actualizar turno";
    return NextResponse.json({ error: message }, { status: message.includes("invál") ? 400 : 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await authMiddleware(req);
    const { id } = await context.params;
    const supabase = getSupabaseServerClient();

    const { error } = await supabase.from("actividad_turno").delete().eq("id", id);

    if (error) throw new Error(error.message);

    return NextResponse.json({ message: "Turno eliminado correctamente" }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al eliminar turno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
