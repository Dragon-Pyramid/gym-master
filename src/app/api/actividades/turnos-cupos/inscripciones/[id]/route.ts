import { NextResponse } from "next/server";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { getSupabaseServerClient } from "@/services/supabaseServerClient";

export const dynamic = "force-dynamic";

const VALID_ESTADOS = new Set(["inscripto", "lista_espera", "asistio", "ausente", "cancelado"]);
const ACTIVE_ESTADOS = ["inscripto", "asistio"];

function cleanString(value: unknown) {
  const text = String(value ?? "").trim();
  return text.length ? text : null;
}

function resolveStatus(message: string) {
  if (message.includes("oblig") || message.includes("invál")) return 400;
  if (message.includes("permiso") || message.includes("pueden")) return 403;
  if (message.includes("cupo")) return 409;
  return 500;
}

async function assertCapacityForApproval(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  turnoId: string,
  inscripcionId: string,
) {
  const [turnoResult, inscripcionesResult] = await Promise.all([
    supabase.from("actividad_turno").select("cupo_maximo").eq("id", turnoId).single(),
    supabase
      .from("actividad_turno_inscripcion")
      .select("id")
      .eq("turno_id", turnoId)
      .in("estado", ACTIVE_ESTADOS)
      .neq("id", inscripcionId),
  ]);

  if (turnoResult.error) throw new Error(turnoResult.error.message);
  if (inscripcionesResult.error) throw new Error(inscripcionesResult.error.message);

  const cupoMaximo = Number(turnoResult.data?.cupo_maximo ?? 0);
  const ocupados = inscripcionesResult.data?.length ?? 0;

  if (cupoMaximo > 0 && ocupados >= cupoMaximo) {
    throw new Error("No hay cupo disponible para incorporar al socio al turno");
  }
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await authMiddleware(req);
    const { id } = await context.params;
    const body = await req.json();
    const estado = cleanString(body.estado);
    const supabase = getSupabaseServerClient();

    const currentResult = await supabase
      .from("actividad_turno_inscripcion")
      .select("id, turno_id, socio_id, estado")
      .eq("id", id)
      .single();

    if (currentResult.error) throw new Error(currentResult.error.message);

    const current = currentResult.data;
    const isSocioRole = user.rol === "socio";

    if (isSocioRole) {
      const ownSocioId = cleanString(user.id_socio);
      if (!ownSocioId || String(current?.socio_id) !== ownSocioId) {
        throw new Error("Sin permiso para actualizar esta inscripción");
      }
      if (estado && estado !== "cancelado") {
        throw new Error("Los socios solo pueden cancelar su propia solicitud o inscripción");
      }
    }

    const payload: Record<string, unknown> = {
      actualizado_en: new Date().toISOString(),
    };

    if (estado) {
      if (!VALID_ESTADOS.has(estado)) throw new Error("Estado de inscripción inválido");

      if (estado === "inscripto" || estado === "asistio") {
        await assertCapacityForApproval(supabase, current.turno_id, id);
      }

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
    return NextResponse.json({ error: message }, { status: resolveStatus(message) });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await authMiddleware(req);
    const { id } = await context.params;
    const supabase = getSupabaseServerClient();

    if (user.rol === "socio") {
      const currentResult = await supabase
        .from("actividad_turno_inscripcion")
        .select("socio_id")
        .eq("id", id)
        .single();

      if (currentResult.error) throw new Error(currentResult.error.message);
      if (!user.id_socio || String(currentResult.data?.socio_id) !== String(user.id_socio)) {
        throw new Error("Sin permiso para eliminar esta inscripción");
      }
    }

    const { error } = await supabase.from("actividad_turno_inscripcion").delete().eq("id", id);

    if (error) throw new Error(error.message);

    return NextResponse.json({ message: "Inscripción eliminada correctamente" }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al eliminar inscripción";
    return NextResponse.json({ error: message }, { status: resolveStatus(message) });
  }
}
