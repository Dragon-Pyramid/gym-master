import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/services/supabaseClient";
import {
  AlertaMantenimientoEquipamiento,
  AlertasMantenimientoEquipamientoResponse,
  EstadoAlertaMantenimiento,
  SeveridadAlertaMantenimiento,
} from "@/interfaces/equipamientoAlertas.interface";

export const dynamic = "force-dynamic";

type EquipamientoRevisionRow = {
  id: string;
  nombre: string | null;
  tipo: string | null;
  ubicacion: string | null;
  estado: string | null;
  proxima_revision: string | null;
  activo: boolean | null;
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function parseUmbralDias(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("umbralDias");
  const parsed = Number(raw ?? 5);

  if (!Number.isFinite(parsed)) {
    return 5;
  }

  return Math.min(Math.max(Math.round(parsed), 0), 90);
}

function toDateOnly(value: string | null) {
  if (!value) return null;

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function diffDays(targetDate: Date, today: Date) {
  return Math.ceil((targetDate.getTime() - today.getTime()) / MS_PER_DAY);
}

function buildEstadoAlerta(
  row: EquipamientoRevisionRow,
  diasParaRevision: number | null,
  umbralDias: number
): { estado_alerta: EstadoAlertaMantenimiento; severidad: SeveridadAlertaMantenimiento; mensaje: string } {
  const estado = String(row.estado ?? "").toLowerCase();

  if (estado === "fuera de servicio") {
    return {
      estado_alerta: "fuera_de_servicio",
      severidad: "critica",
      mensaje: "El equipamiento está fuera de servicio y requiere seguimiento operativo.",
    };
  }

  if (estado === "en mantenimiento") {
    return {
      estado_alerta: "en_mantenimiento",
      severidad: "alta",
      mensaje: "El equipamiento está actualmente en mantenimiento.",
    };
  }

  if (diasParaRevision === null) {
    return {
      estado_alerta: "sin_fecha",
      severidad: "media",
      mensaje: "El equipamiento no tiene próxima revisión configurada.",
    };
  }

  if (diasParaRevision < 0) {
    const diasVencidos = Math.abs(diasParaRevision);
    return {
      estado_alerta: "vencido",
      severidad: "critica",
      mensaje: `La revisión está vencida hace ${diasVencidos} día${diasVencidos === 1 ? "" : "s"}.`,
    };
  }

  if (diasParaRevision <= umbralDias) {
    return {
      estado_alerta: "proximo",
      severidad: "alta",
      mensaje: `La revisión vence en ${diasParaRevision} día${diasParaRevision === 1 ? "" : "s"}.`,
    };
  }

  return {
    estado_alerta: "ok",
    severidad: "ok",
    mensaje: "El equipamiento no presenta alertas de mantenimiento próximas.",
  };
}

function sortAlertas(a: AlertaMantenimientoEquipamiento, b: AlertaMantenimientoEquipamiento) {
  const prioridad: Record<EstadoAlertaMantenimiento, number> = {
    vencido: 1,
    fuera_de_servicio: 2,
    en_mantenimiento: 3,
    proximo: 4,
    sin_fecha: 5,
    ok: 6,
  };

  const prioridadDiff = prioridad[a.estado_alerta] - prioridad[b.estado_alerta];
  if (prioridadDiff !== 0) return prioridadDiff;

  const diasA = a.dias_para_revision ?? Number.MAX_SAFE_INTEGER;
  const diasB = b.dias_para_revision ?? Number.MAX_SAFE_INTEGER;

  return diasA - diasB;
}

function buildResumen(alertas: AlertaMantenimientoEquipamiento[]) {
  return alertas.reduce(
    (acc, alerta) => {
      acc.total += 1;

      if (alerta.estado_alerta === "vencido") acc.vencidos += 1;
      if (alerta.estado_alerta === "proximo") acc.proximos += 1;
      if (alerta.estado_alerta === "ok") acc.ok += 1;
      if (alerta.estado_alerta === "sin_fecha") acc.sin_fecha += 1;
      if (alerta.estado_alerta === "en_mantenimiento") acc.en_mantenimiento += 1;
      if (alerta.estado_alerta === "fuera_de_servicio") acc.fuera_de_servicio += 1;

      return acc;
    },
    {
      total: 0,
      vencidos: 0,
      proximos: 0,
      ok: 0,
      sin_fecha: 0,
      en_mantenimiento: 0,
      fuera_de_servicio: 0,
    }
  );
}

export async function GET(request: NextRequest) {
  try {
    const umbralDias = parseUmbralDias(request);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("equipamiento")
      .select("id,nombre,tipo,ubicacion,estado,proxima_revision,activo")
      .eq("activo", true)
      .order("proxima_revision", { ascending: true, nullsFirst: false });

    if (error) {
      throw new Error(error.message);
    }

    const alertas = ((data ?? []) as EquipamientoRevisionRow[])
      .map((row) => {
        const revisionDate = toDateOnly(row.proxima_revision);
        const diasParaRevision = revisionDate ? diffDays(revisionDate, today) : null;
        const estado = buildEstadoAlerta(row, diasParaRevision, umbralDias);

        return {
          id: row.id,
          nombre: row.nombre ?? "Equipamiento sin nombre",
          tipo: row.tipo,
          ubicacion: row.ubicacion,
          estado: row.estado,
          proxima_revision: row.proxima_revision,
          dias_para_revision: diasParaRevision,
          ...estado,
        };
      })
      .sort(sortAlertas);

    const response: AlertasMantenimientoEquipamientoResponse = {
      generated_at: new Date().toISOString(),
      umbral_dias: umbralDias,
      resumen: buildResumen(alertas),
      alertas,
      alertas_operativas: alertas.filter((alerta) => alerta.estado_alerta !== "ok"),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error al obtener alertas de mantenimiento:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error al obtener alertas de mantenimiento",
      },
      { status: 500 }
    );
  }
}
