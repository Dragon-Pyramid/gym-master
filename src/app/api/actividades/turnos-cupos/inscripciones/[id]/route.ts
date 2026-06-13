import { NextResponse } from "next/server";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { getSupabaseServerClient } from "@/services/supabaseServerClient";

export const dynamic = "force-dynamic";

const VALID_ESTADOS = new Set(["inscripto", "lista_espera", "asistio", "ausente", "cancelado"]);

function cleanString(value: unknown) {
  const text = String(value ?? "").trim();
  return text.length ? text : null;
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await authMiddleware(req);
    const { id } = await context.params;
    const body = await req.json();
    const estado = cleanString(body.estado);
    const supabase = getSupabaseServerClient();
    const payload: Record<string, unknown> = {
      actualizado_en: new Date().toISOString(),
    };

    if (estado) {
      if (!VALID_ESTADOS.has(estado)) throw new Error("Estado de inscripción inválido");
      payload.estado = estado;
      if (estado === "asistio") payload.fecha_asistencia = new Date().toISOString();
      if (estado === "cancelado") payload.fecha_cancelacion = new Date().toISOString();
    }

    if (body.observaciones !== undefined) payload.observaciones = cleanString(body.observaciones);

    const { data, error } = await supabase
      .from("actividad_turno_inscripcion")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ message: "Inscripción actualizada correctamente", data }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al actualizar inscripción";
    return NextResponse.json({ error: message }, { status: message.includes("invál") ? 400 : 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await authMiddleware(req);
    const { id } = await context.params;
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("actividad_turno_inscripcion").delete().eq("id", id);

    if (error) throw new Error(error.message);

    return NextResponse.json({ message: "Inscripción eliminada correctamente" }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al eliminar inscripción";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
