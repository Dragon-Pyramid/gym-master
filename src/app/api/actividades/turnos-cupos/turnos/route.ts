import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/services/supabaseServerClient";

import {
  authorizationErrorResponse,
  authorizeDashboardRequest,
} from '@/lib/auth/serverAuthorization';

export const dynamic = "force-dynamic";

const VALID_ESTADOS = new Set(["activo", "pausado", "cancelado"]);

function turnoCreateValidationErrorResponse(message: string) {
  switch (message) {
    case "La actividad es obligatoria":
      return NextResponse.json(
        { error: "La actividad es obligatoria" },
        { status: 400 },
      );

    case "El nombre del turno es obligatorio":
      return NextResponse.json(
        { error: "El nombre del turno es obligatorio" },
        { status: 400 },
      );

    case "El día de semana debe estar entre 1 y 7":
      return NextResponse.json(
        { error: "El día de semana debe estar entre 1 y 7" },
        { status: 400 },
      );

    case "La hora de inicio y fin son obligatorias":
      return NextResponse.json(
        { error: "La hora de inicio y fin son obligatorias" },
        { status: 400 },
      );

    case "El cupo máximo debe ser mayor a cero":
      return NextResponse.json(
        { error: "El cupo máximo debe ser mayor a cero" },
        { status: 400 },
      );

    case "El cupo mínimo debe ser mayor o igual a cero y no superar el cupo máximo":
      return NextResponse.json(
        {
          error:
            "El cupo mínimo debe ser mayor o igual a cero y no superar el cupo máximo",
        },
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

function normalizePayload(body: any) {
  const actividadId = cleanString(body.actividad_id);
  const nombreTurno = cleanString(body.nombre_turno);
  const diaSemana = Number(body.dia_semana);
  const horaInicio = cleanString(body.hora_inicio);
  const horaFin = cleanString(body.hora_fin);
  const cupoMaximo = Number(body.cupo_maximo);
  const cupoMinimo = body.cupo_minimo === null || body.cupo_minimo === "" ? null : Number(body.cupo_minimo);
  const estado = cleanString(body.estado) ?? "activo";

  if (!actividadId) throw new Error("La actividad es obligatoria");
  if (!nombreTurno) throw new Error("El nombre del turno es obligatorio");
  if (!Number.isInteger(diaSemana) || diaSemana < 1 || diaSemana > 7) throw new Error("El día de semana debe estar entre 1 y 7");
  if (!horaInicio || !horaFin) throw new Error("La hora de inicio y fin son obligatorias");
  if (!Number.isFinite(cupoMaximo) || cupoMaximo <= 0) throw new Error("El cupo máximo debe ser mayor a cero");
  if (cupoMinimo !== null && (!Number.isFinite(cupoMinimo) || cupoMinimo < 0 || cupoMinimo > cupoMaximo)) {
    throw new Error("El cupo mínimo debe ser mayor o igual a cero y no superar el cupo máximo");
  }
  if (!VALID_ESTADOS.has(estado)) throw new Error("Estado de turno inválido");

  return {
    actividad_id: actividadId,
    nombre_turno: nombreTurno,
    dia_semana: diaSemana,
    hora_inicio: horaInicio,
    hora_fin: horaFin,
    cupo_maximo: cupoMaximo,
    cupo_minimo: cupoMinimo,
    instructor_id: cleanString(body.instructor_id),
    ubicacion: cleanString(body.ubicacion),
    estado,
    fecha_inicio: cleanString(body.fecha_inicio),
    fecha_fin: cleanString(body.fecha_fin),
    observaciones: cleanString(body.observaciones),
  };
}

export async function POST(req: Request) {
  try {
    await authorizeDashboardRequest(req, "/dashboard/actividades", ["admin", "usuario"]);
    const body = await req.json();
    const payload = normalizePayload(body);
    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from("actividad_turno")
      .insert(payload)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ message: "Turno creado correctamente", data }, { status: 201 });
  } catch (error) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;

    const message = error instanceof Error ? error.message : "Error al crear turno";

    const validationResponse = turnoCreateValidationErrorResponse(message);
    if (validationResponse) return validationResponse;

    console.error("Error al crear turno:", error);
    return NextResponse.json(
      { error: "Error al crear turno" },
      { status: 500 },
    );
  }
}
