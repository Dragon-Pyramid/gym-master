import { NextResponse } from "next/server";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { getSupabaseServerClient } from "@/services/supabaseServerClient";

export const dynamic = "force-dynamic";

const VALID_ESTADOS = new Set(["inscripto", "lista_espera", "asistio", "ausente", "cancelado"]);

function cleanString(value: unknown) {
  const text = String(value ?? "").trim();
  return text.length ? text : null;
}

async function resolveEstadoByCupo(supabase: ReturnType<typeof getSupabaseServerClient>, turnoId: string, requestedEstado: string) {
  if (requestedEstado !== "inscripto") return requestedEstado;

  const [turnoResult, inscripcionesResult] = await Promise.all([
    supabase.from("actividad_turno").select("cupo_maximo").eq("id", turnoId).single(),
    supabase
      .from("actividad_turno_inscripcion")
      .select("id")
      .eq("turno_id", turnoId)
      .in("estado", ["inscripto", "asistio"]),
  ]);

  if (turnoResult.error) throw new Error(turnoResult.error.message);
  if (inscripcionesResult.error) throw new Error(inscripcionesResult.error.message);

  const cupoMaximo = Number(turnoResult.data?.cupo_maximo ?? 0);
  const ocupados = inscripcionesResult.data?.length ?? 0;

  return ocupados >= cupoMaximo ? "lista_espera" : "inscripto";
}

export async function POST(req: Request) {
  try {
    await authMiddleware(req);
    const body = await req.json();
    const turnoId = cleanString(body.turno_id);
    const socioId = cleanString(body.socio_id);
    const requestedEstado = cleanString(body.estado) ?? "inscripto";

    if (!turnoId) throw new Error("El turno es obligatorio");
    if (!socioId) throw new Error("El socio es obligatorio");
    if (!VALID_ESTADOS.has(requestedEstado)) throw new Error("Estado de inscripción inválido");

    const supabase = getSupabaseServerClient();
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

    return NextResponse.json({ message: estado === "lista_espera" ? "Socio agregado a lista de espera" : "Socio inscripto correctamente", data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al inscribir socio";
    return NextResponse.json({ error: message }, { status: message.includes("oblig") || message.includes("invál") ? 400 : 500 });
  }
}
