import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/services/supabaseServerClient";

import {
  authorizationErrorResponse,
  authorizeDashboardRequest,
} from '@/lib/auth/serverAuthorization';

export const dynamic = "force-dynamic";

const VALID_ESTADOS = new Set(["inscripto", "lista_espera", "asistio", "ausente", "cancelado"]);
const TURNO_NOT_FOUND_ERROR = "No se encontró el turno con ese id";

function inscripcionCreateErrorResponse(message: string) {
  switch (message) {
    case "El turno es obligatorio":
      return NextResponse.json(
        { error: "El turno es obligatorio" },
        { status: 400 },
      );

    case "El socio es obligatorio":
      return NextResponse.json(
        { error: "El socio es obligatorio" },
        { status: 400 },
      );

    case "Estado de inscripción inválido":
      return NextResponse.json(
        { error: "Estado de inscripción inválido" },
        { status: 400 },
      );

    case "Ya existe una inscripción o solicitud activa para este turno":
      return NextResponse.json(
        { error: "Ya existe una inscripción o solicitud activa para este turno" },
        { status: 409 },
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

function cleanString(value: unknown) {
  const text = String(value ?? "").trim();
  return text.length ? text : null;
}

async function resolveEstadoByCupo(supabase: ReturnType<typeof getSupabaseServerClient>, turnoId: string, requestedEstado: string) {
  const turnoResult = await supabase
    .from("actividad_turno")
    .select("cupo_maximo")
    .eq("id", turnoId)
    .maybeSingle();

  if (turnoResult.error) {
    throw new Error(turnoResult.error.message);
  }

  if (!turnoResult.data) {
    throw new Error(TURNO_NOT_FOUND_ERROR);
  }

  if (requestedEstado !== "inscripto") {
    return requestedEstado;
  }

  const inscripcionesResult = await supabase
    .from("actividad_turno_inscripcion")
    .select("id")
    .eq("turno_id", turnoId)
    .in("estado", ["inscripto", "asistio"]);

  if (inscripcionesResult.error) {
    throw new Error(inscripcionesResult.error.message);
  }

  const cupoMaximo = Number(turnoResult.data.cupo_maximo ?? 0);
  const ocupados = inscripcionesResult.data?.length ?? 0;

  return ocupados >= cupoMaximo ? "lista_espera" : "inscripto";
}

export async function POST(req: Request) {
  try {
    const user = await authorizeDashboardRequest(
      req,
      "/dashboard/actividades",
      ["admin", "usuario", "socio"],
    );
    const body = await req.json();
    const turnoId = cleanString(body.turno_id);
    const isSocioRole = user.rol === "socio";
    const socioId = isSocioRole ? cleanString(user.id_socio) : cleanString(body.socio_id);
    const requestedEstado = isSocioRole ? "lista_espera" : cleanString(body.estado) ?? "inscripto";

    if (!turnoId) throw new Error("El turno es obligatorio");
    if (!socioId) throw new Error("El socio es obligatorio");
    if (!VALID_ESTADOS.has(requestedEstado)) throw new Error("Estado de inscripción inválido");

    const supabase = getSupabaseServerClient();

    const duplicateResult = await supabase
      .from("actividad_turno_inscripcion")
      .select("id, estado")
      .eq("turno_id", turnoId)
      .eq("socio_id", socioId)
      .neq("estado", "cancelado")
      .limit(1);

    if (duplicateResult.error) throw new Error(duplicateResult.error.message);
    if ((duplicateResult.data ?? []).length > 0) {
      throw new Error("Ya existe una inscripción o solicitud activa para este turno");
    }

    const estado = await resolveEstadoByCupo(supabase, turnoId, requestedEstado);

    const { data, error } = await supabase
      .from("actividad_turno_inscripcion")
      .insert({
        turno_id: turnoId,
        socio_id: socioId,
        estado,
        observaciones: cleanString(body.observaciones),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ message: estado === "lista_espera" ? "Solicitud registrada para revisión administrativa" : "Socio inscripto correctamente", data }, { status: 201 });
  } catch (error) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;

    const message = error instanceof Error ? error.message : "Error al inscribir socio";

    const knownResponse = inscripcionCreateErrorResponse(message);
    if (knownResponse) return knownResponse;

    console.error("Error al inscribir socio:", error);
    return NextResponse.json(
      { error: "Error al inscribir socio" },
      { status: 500 },
    );
  }
}
