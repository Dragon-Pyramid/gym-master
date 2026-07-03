import { NextResponse } from "next/server";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { getSupabaseServerClient } from "@/services/supabaseServerClient";
import type {
  ActividadBaseOption,
  ActividadEmpleadoOption,
  ActividadSocioOption,
  ActividadTurno,
  ActividadTurnoInscripcion,
  ActividadTurnosCuposDashboard,
  ActividadUbicacionOption,
} from "@/interfaces/actividadTurnosCupos.interface";

export const dynamic = "force-dynamic";

type BasicRow = Record<string, any>;

const DIAS_SEMANA = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 7, label: "Domingo" },
];

function isMissingTableError(error: any) {
  const message = String(error?.message ?? "").toLowerCase();
  const code = String(error?.code ?? "").toUpperCase();

  return (
    code === "42P01" ||
    code === "PGRST205" ||
    message.includes("does not exist") ||
    message.includes("could not find") ||
    message.includes("schema cache")
  );
}

function toNumber(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function percent(part: number, total: number) {
  if (!total) return 0;
  return Number(((part / total) * 100).toFixed(1));
}

function sortByDiaHora(a: ActividadTurno, b: ActividadTurno) {
  if (a.dia_semana !== b.dia_semana) return a.dia_semana - b.dia_semana;
  return String(a.hora_inicio).localeCompare(String(b.hora_inicio));
}

function addChartItem(map: Map<string, number>, key: string, amount = 1) {
  const clean = key?.trim() || "Sin dato";
  map.set(clean, (map.get(clean) ?? 0) + amount);
}

async function selectOptional<T>(query: PromiseLike<{ data: T | null; error: any }>) {
  const result = await query;
  if (result.error) {
    if (isMissingTableError(result.error)) {
      return { data: null, missing: true, error: result.error };
    }
    throw new Error(result.error.message);
  }

  return { data: result.data, missing: false, error: null };
}

function buildEmptyDashboard(params: {
  actividades: ActividadBaseOption[];
  socios: ActividadSocioOption[];
  empleados: ActividadEmpleadoOption[];
  ubicaciones: ActividadUbicacionOption[];
  warnings: string[];
  schemaReady: boolean;
}): ActividadTurnosCuposDashboard {
  return {
    generated_at: new Date().toISOString(),
    schema_ready: params.schemaReady,
    warnings: params.warnings,
    actividades: params.actividades,
    socios: params.socios,
    empleados: params.empleados,
    ubicaciones: params.ubicaciones,
    turnos: [],
    inscripciones: [],
    kpis: {
      total_actividades: params.actividades.length,
      total_turnos: 0,
      turnos_activos: 0,
      cupos_totales: 0,
      inscriptos: 0,
      lista_espera: 0,
      cupos_disponibles: 0,
      ocupacion_promedio: 0,
      asistencias: 0,
      ausencias: 0,
    },
    por_dia: [],
    por_actividad: [],
    por_estado_inscripcion: [],
  };
}

export async function GET(req: Request) {
  try {
    const { user } = await authMiddleware(req);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const supabase = getSupabaseServerClient();
    const warnings: string[] = [];
    const isSocioRole = user.rol === "socio";
    const ownSocioId = String(user.id_socio ?? "");

    let sociosQuery = supabase
      .from("socio")
      .select("id_socio, nombre_completo, dni, activo")
      .eq("activo", true)
      .order("nombre_completo", { ascending: true })
      .limit(isSocioRole ? 1 : 500);

    if (isSocioRole) {
      sociosQuery = sociosQuery.eq("id_socio", ownSocioId || "__sin_socio_asociado__");
    }

    const [actividadesResult, sociosResult, empleadosResult] = await Promise.all([
      supabase
        .from("actividad")
        .select("id, nombre_actividad, creado_en, actualizado_en")
        .order("nombre_actividad", { ascending: true }),
      sociosQuery,
      supabase
        .from("empleados")
        .select("id, nombre_completo, puesto, area, activo")
        .eq("activo", true)
        .order("nombre_completo", { ascending: true })
        .limit(300),
    ]);

    if (actividadesResult.error) throw new Error(actividadesResult.error.message);
    if (sociosResult.error) throw new Error(sociosResult.error.message);
    if (empleadosResult.error && !isMissingTableError(empleadosResult.error)) {
      throw new Error(empleadosResult.error.message);
    }

    const actividades = (actividadesResult.data ?? []) as ActividadBaseOption[];
    const socios = (sociosResult.data ?? []) as ActividadSocioOption[];
    const empleados = empleadosResult.error ? [] : ((empleadosResult.data ?? []) as ActividadEmpleadoOption[]);

    const ubicacionesResult = await selectOptional<BasicRow[]>(
      supabase
        .from("ubicacion_gimnasio")
        .select("id, codigo, nombre, descripcion, activo, orden")
        .eq("activo", true)
        .order("orden", { ascending: true })
        .order("nombre", { ascending: true }),
    );

    const ubicaciones: ActividadUbicacionOption[] = ubicacionesResult.missing
      ? []
      : ((ubicacionesResult.data ?? []) as BasicRow[]).map((ubicacion) => ({
          id: String(ubicacion.id),
          codigo: String(ubicacion.codigo ?? ""),
          nombre: String(ubicacion.nombre ?? ""),
          descripcion: ubicacion.descripcion ? String(ubicacion.descripcion) : null,
          activo: ubicacion.activo !== false,
          orden: ubicacion.orden == null ? null : Number(ubicacion.orden),
        }));

    if (ubicacionesResult.missing) {
      warnings.push(
        "El catálogo global de ubicaciones todavía no existe. Aplicá la migración de ubicaciones para usar el selector parametrizable.",
      );
    }

    const turnosResult = await selectOptional<BasicRow[]>(
      supabase
        .from("actividad_turno")
        .select(
          "id, actividad_id, nombre_turno, dia_semana, hora_inicio, hora_fin, cupo_maximo, cupo_minimo, instructor_id, ubicacion, estado, fecha_inicio, fecha_fin, observaciones, creado_en, actualizado_en",
        )
        .order("dia_semana", { ascending: true })
        .order("hora_inicio", { ascending: true }),
    );

    const inscripcionesResult = await selectOptional<BasicRow[]>(
      supabase
        .from("actividad_turno_inscripcion")
        .select(
          "id, turno_id, socio_id, estado, fecha_inscripcion, fecha_cancelacion, fecha_asistencia, observaciones, creado_en, actualizado_en",
        )
        .order("fecha_inscripcion", { ascending: false })
        .limit(1000),
    );

    if (turnosResult.missing || inscripcionesResult.missing) {
      warnings.push(
        "Las tablas actividad_turno y/o actividad_turno_inscripcion todavía no existen. Aplicá la migración privada de turnos/cupos para habilitar gestión completa.",
      );

      return NextResponse.json(
        buildEmptyDashboard({ actividades, socios, empleados, ubicaciones, warnings, schemaReady: false }),
        { status: 200 },
      );
    }

    const actividadById = new Map(actividades.map((actividad) => [actividad.id, actividad]));
    const socioById = new Map(socios.map((socio) => [socio.id_socio, socio]));
    const empleadoById = new Map(empleados.map((empleado) => [empleado.id, empleado]));
    const rawTurnos = (turnosResult.data ?? []) as BasicRow[];
    const rawInscripciones = (inscripcionesResult.data ?? []) as BasicRow[];

    const inscripcionesByTurno = new Map<string, BasicRow[]>();
    rawInscripciones.forEach((inscripcion) => {
      const turnoId = String(inscripcion.turno_id ?? "");
      const current = inscripcionesByTurno.get(turnoId) ?? [];
      current.push(inscripcion);
      inscripcionesByTurno.set(turnoId, current);
    });

    const turnos: ActividadTurno[] = rawTurnos
      .map((turno) => {
        const turnoInscripciones = inscripcionesByTurno.get(turno.id) ?? [];
        const inscriptos = turnoInscripciones.filter((item) => item.estado === "inscripto" || item.estado === "asistio").length;
        const listaEspera = turnoInscripciones.filter((item) => item.estado === "lista_espera").length;
        const asistencias = turnoInscripciones.filter((item) => item.estado === "asistio").length;
        const ausencias = turnoInscripciones.filter((item) => item.estado === "ausente").length;
        const cupoMaximo = Math.max(0, toNumber(turno.cupo_maximo));
        const cuposDisponibles = Math.max(0, cupoMaximo - inscriptos);

        return {
          id: String(turno.id),
          actividad_id: String(turno.actividad_id),
          nombre_turno: String(turno.nombre_turno ?? "Turno sin nombre"),
          dia_semana: toNumber(turno.dia_semana),
          hora_inicio: String(turno.hora_inicio ?? ""),
          hora_fin: String(turno.hora_fin ?? ""),
          cupo_maximo: cupoMaximo,
          cupo_minimo: turno.cupo_minimo === null ? null : toNumber(turno.cupo_minimo),
          instructor_id: turno.instructor_id ?? null,
          ubicacion: turno.ubicacion ?? null,
          estado: turno.estado ?? "activo",
          fecha_inicio: turno.fecha_inicio ?? null,
          fecha_fin: turno.fecha_fin ?? null,
          observaciones: turno.observaciones ?? null,
          creado_en: turno.creado_en ?? null,
          actualizado_en: turno.actualizado_en ?? null,
          actividad_nombre: actividadById.get(String(turno.actividad_id))?.nombre_actividad ?? "Actividad no disponible",
          instructor_nombre: turno.instructor_id ? empleadoById.get(String(turno.instructor_id))?.nombre_completo ?? "Instructor no disponible" : null,
          inscriptos,
          lista_espera: listaEspera,
          asistencias,
          ausencias,
          cupos_disponibles: cuposDisponibles,
          ocupacion_porcentaje: percent(inscriptos, cupoMaximo),
        } satisfies ActividadTurno;
      })
      .sort(sortByDiaHora);

    const turnoById = new Map(turnos.map((turno) => [turno.id, turno]));
    const inscripciones: ActividadTurnoInscripcion[] = rawInscripciones.map((inscripcion) => {
      const turno = turnoById.get(String(inscripcion.turno_id));
      const socio = socioById.get(String(inscripcion.socio_id));

      return {
        id: String(inscripcion.id),
        turno_id: String(inscripcion.turno_id),
        socio_id: String(inscripcion.socio_id),
        estado: inscripcion.estado ?? "inscripto",
        fecha_inscripcion: inscripcion.fecha_inscripcion ?? null,
        fecha_cancelacion: inscripcion.fecha_cancelacion ?? null,
        fecha_asistencia: inscripcion.fecha_asistencia ?? null,
        observaciones: inscripcion.observaciones ?? null,
        creado_en: inscripcion.creado_en ?? null,
        actualizado_en: inscripcion.actualizado_en ?? null,
        turno_nombre: turno?.nombre_turno ?? "Turno no disponible",
        actividad_nombre: turno?.actividad_nombre ?? "Actividad no disponible",
        socio_nombre: socio?.nombre_completo ?? "Socio no disponible",
        socio_dni: socio?.dni ?? null,
      } satisfies ActividadTurnoInscripcion;
    });

    const cuposTotales = turnos
      .filter((turno) => turno.estado === "activo")
      .reduce((acc, turno) => acc + turno.cupo_maximo, 0);
    const inscriptos = turnos.reduce((acc, turno) => acc + turno.inscriptos, 0);
    const listaEspera = turnos.reduce((acc, turno) => acc + turno.lista_espera, 0);
    const cuposDisponibles = turnos.reduce((acc, turno) => acc + turno.cupos_disponibles, 0);
    const asistencias = turnos.reduce((acc, turno) => acc + turno.asistencias, 0);
    const ausencias = turnos.reduce((acc, turno) => acc + turno.ausencias, 0);

    const porDiaMap = new Map<string, number>();
    const porActividadMap = new Map<string, number>();
    const porEstadoInscripcionMap = new Map<string, number>();

    turnos.forEach((turno) => {
      const dia = DIAS_SEMANA.find((item) => item.value === turno.dia_semana)?.label ?? "Sin día";
      addChartItem(porDiaMap, dia, 1);
      addChartItem(porActividadMap, turno.actividad_nombre ?? "Sin actividad", turno.inscriptos);
    });

    inscripciones.forEach((inscripcion) => {
      addChartItem(porEstadoInscripcionMap, String(inscripcion.estado).replaceAll("_", " "), 1);
    });

    const visibleInscripciones = isSocioRole
      ? inscripciones.filter((inscripcion) => String(inscripcion.socio_id) === ownSocioId)
      : inscripciones;

    const dashboard: ActividadTurnosCuposDashboard = {
      generated_at: new Date().toISOString(),
      schema_ready: true,
      warnings,
      actividades,
      socios,
      empleados,
      ubicaciones,
      turnos,
      inscripciones: visibleInscripciones,
      kpis: {
        total_actividades: actividades.length,
        total_turnos: turnos.length,
        turnos_activos: turnos.filter((turno) => turno.estado === "activo").length,
        cupos_totales: cuposTotales,
        inscriptos,
        lista_espera: listaEspera,
        cupos_disponibles: cuposDisponibles,
        ocupacion_promedio: percent(inscriptos, cuposTotales),
        asistencias,
        ausencias,
      },
      por_dia: Array.from(porDiaMap.entries()).map(([label, total]) => ({ label, total })),
      por_actividad: Array.from(porActividadMap.entries())
        .map(([label, total]) => ({ label, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 8),
      por_estado_inscripcion: Array.from(porEstadoInscripcionMap.entries()).map(([label, total]) => ({ label, total })),
    };

    return NextResponse.json(dashboard, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener actividades, turnos y cupos";

    if (message.toLowerCase().includes("token") || message.toLowerCase().includes("jwt")) {
      return NextResponse.json({ error: "Sesión expirada o no autorizada" }, { status: 401 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
