import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/services/supabaseServerClient";

import {
  authorizationErrorResponse,
  authorizeDashboardRequest,
} from '@/lib/auth/serverAuthorization';

export const dynamic = "force-dynamic";

const VALID_ESTADOS = new Set(["inscripto", "lista_espera", "asistio", "ausente", "cancelado"]);
const ACTIVE_ESTADOS = ["inscripto", "asistio"];

const INSCRIPCION_NOT_FOUND_ERROR =
  "No se encontró la inscripción con ese id";

const TURNO_NOT_FOUND_ERROR =
  "No se encontró el turno con ese id";

function cleanString(value: unknown) {
  const text = String(value ?? "").trim();
  return text.length ? text : null;
}

function inscripcionMutationErrorResponse(message: string) {
  switch (message) {
    case "Estado de inscripción inválido":
      return NextResponse.json(
        { error: "Estado de inscripción inválido" },
        { status: 400 },
      );

    case "Sin permiso para actualizar esta inscripción":
      return NextResponse.json(
        { error: "Sin permiso para actualizar esta inscripción" },
        { status: 403 },
      );

    case "Los socios solo pueden cancelar su propia solicitud o inscripción":
      return NextResponse.json(
        { error: "Los socios solo pueden cancelar su propia solicitud o inscripción" },
        { status: 403 },
      );

    case "Sin permiso para eliminar esta inscripción":
      return NextResponse.json(
        { error: "Sin permiso para eliminar esta inscripción" },
        { status: 403 },
      );

    case "No hay cupo disponible para incorporar al socio al turno":
      return NextResponse.json(
        { error: "No hay cupo disponible para incorporar al socio al turno" },
        { status: 409 },
      );

    case INSCRIPCION_NOT_FOUND_ERROR:
      return NextResponse.json(
        { error: "Inscripción no encontrada" },
        { status: 404 },
      );

    case TURNO_NOT_FOUND_ERROR:
      return NextResponse.json(
        { error: "Turno no encontrado" },
        { status: 404 },
      );

    default:
      return null;
  }
}

async function assertCapacityForApproval(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  turnoId: string,
  inscripcionId: string,
) {
  const [turnoResult, inscripcionesResult] = await Promise.all([
    supabase.from("actividad_turno").select("cupo_maximo").eq("id", turnoId).maybeSingle(),
    supabase
      .from("actividad_turno_inscripcion")
      .select("id")
      .eq("turno_id", turnoId)
      .in("estado", ACTIVE_ESTADOS)
      .neq("id", inscripcionId),
  ]);

  if (turnoResult.error) throw new Error(turnoResult.error.message);
  if (!turnoResult.data) throw new Error(TURNO_NOT_FOUND_ERROR);
  if (inscripcionesResult.error) throw new Error(inscripcionesResult.error.message);

  const cupoMaximo = Number(turnoResult.data?.cupo_maximo ?? 0);
  const ocupados = inscripcionesResult.data?.length ?? 0;

  if (cupoMaximo > 0 && ocupados >= cupoMaximo) {
    throw new Error("No hay cupo disponible para incorporar al socio al turno");
  }
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await authorizeDashboardRequest(
      req,
      "/dashboard/actividades",
      ["admin", "usuario", "socio"],
    );
    const { id } = await context.params;
    const body = await req.json();
    const estado = cleanString(body.estado);
    const supabase = getSupabaseServerClient();

    const currentResult = await supabase
      .from("actividad_turno_inscripcion")
      .select("id, turno_id, socio_id, estado")
      .eq("id", id)
      .maybeSingle();

    if (currentResult.error) throw new Error(currentResult.error.message);
    if (!currentResult.data) throw new Error(INSCRIPCION_NOT_FOUND_ERROR);

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
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new Error(INSCRIPCION_NOT_FOUND_ERROR);

    return NextResponse.json({ message: "Inscripción actualizada correctamente", data }, { status: 200 });
  } catch (error) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;

    const message = error instanceof Error ? error.message : "Error al actualizar inscripción";

    const knownResponse = inscripcionMutationErrorResponse(message);
    if (knownResponse) return knownResponse;

    console.error("Error al actualizar inscripción:", error);
    return NextResponse.json(
      { error: "Error al actualizar inscripción" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await authorizeDashboardRequest(
      req,
      "/dashboard/actividades",
      ["admin", "usuario", "socio"],
    );
    const { id } = await context.params;
    const supabase = getSupabaseServerClient();

    if (user.rol === "socio") {
      const currentResult = await supabase
        .from("actividad_turno_inscripcion")
        .select("socio_id")
        .eq("id", id)
        .maybeSingle();

      if (currentResult.error) throw new Error(currentResult.error.message);
      if (!currentResult.data) throw new Error(INSCRIPCION_NOT_FOUND_ERROR);
      if (!user.id_socio || String(currentResult.data?.socio_id) !== String(user.id_socio)) {
        throw new Error("Sin permiso para eliminar esta inscripción");
      }
    }

    const { data, error } = await supabase
      .from("actividad_turno_inscripcion")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new Error(INSCRIPCION_NOT_FOUND_ERROR);

    return NextResponse.json({ message: "Inscripción eliminada correctamente" }, { status: 200 });
  } catch (error) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;

    const message = error instanceof Error ? error.message : "Error al eliminar inscripción";

    const knownResponse = inscripcionMutationErrorResponse(message);
    if (knownResponse) return knownResponse;

    console.error("Error al eliminar inscripción:", error);
    return NextResponse.json(
      { error: "Error al eliminar inscripción" },
      { status: 500 },
    );
  }
}
