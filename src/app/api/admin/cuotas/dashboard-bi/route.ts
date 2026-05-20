import { NextResponse } from "next/server";
import { supabase } from "@/services/supabaseClient";
import { CuotasPagosDashboardBiResponse } from "@/interfaces/cuotasPagosBi.interface";

export const dynamic = "force-dynamic";

type SocioEstadoRow = {
  id_socio: string;
  nombre_completo: string;
  activo: boolean;
  ultimo_pago: string | null;
  ultimo_vencimiento: string | null;
  periodo_hasta: string | null;
  estado_cuota: string;
  dias_vencido: number;
  metodo_pago: string | null;
  meses_cubiertos: number | null;
};

type PagoRow = {
  id: string;
  socio_id: string;
  fecha_pago: string;
  periodo_desde: string | null;
  periodo_hasta: string | null;
  meses_cubiertos: number | null;
  metodo_pago: string | null;
  estado: string | null;
  monto_pagado: number;
  socio?: {
    nombre_completo?: string | null;
  } | null;
};

function toNumber(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function GET() {
  try {
    const [estadoResult, pagosResult, evolucionResult] = await Promise.all([
      supabase.rpc("obtener_socios_estado_cuota"),
      supabase
        .from("pago")
        .select(`
          id,
          socio_id,
          fecha_pago,
          periodo_desde,
          periodo_hasta,
          meses_cubiertos,
          metodo_pago,
          estado,
          monto_pagado,
          socio:socio_id (
            nombre_completo
          )
        `)
        .eq("activo", true)
        .order("fecha_pago", { ascending: false })
        .limit(50),
      supabase.rpc("obtener_evolucion_cuota"),
    ]);

    if (estadoResult.error) {
      throw new Error(estadoResult.error.message);
    }

    if (pagosResult.error) {
      throw new Error(pagosResult.error.message);
    }

    if (evolucionResult.error) {
      throw new Error(evolucionResult.error.message);
    }

    const estados = ((estadoResult.data ?? []) as SocioEstadoRow[]).filter((s) => s.activo !== false);
    const pagos = (pagosResult.data ?? []) as PagoRow[];

    const resumenEstadosMap = new Map<string, number>();
    for (const socio of estados) {
      const estado = socio.estado_cuota || "sin_pagos";
      resumenEstadosMap.set(estado, (resumenEstadosMap.get(estado) ?? 0) + 1);
    }

    const resumenMetodosMap = new Map<string, { metodo_pago: string; estado: string; cantidad_pagos: number; total_pagado: number }>();
    for (const pago of pagos) {
      const metodo = pago.metodo_pago || "sin_metodo";
      const estado = pago.estado || "sin_estado";
      const key = `${metodo}::${estado}`;
      const current = resumenMetodosMap.get(key) ?? {
        metodo_pago: metodo,
        estado,
        cantidad_pagos: 0,
        total_pagado: 0,
      };

      current.cantidad_pagos += 1;
      current.total_pagado += toNumber(pago.monto_pagado);
      resumenMetodosMap.set(key, current);
    }

    const totalPagado = pagos.reduce((acc, pago) => acc + toNumber(pago.monto_pagado), 0);
    const totalEfectivo = pagos
      .filter((pago) => pago.metodo_pago === "efectivo")
      .reduce((acc, pago) => acc + toNumber(pago.monto_pagado), 0);
    const totalStripe = pagos
      .filter((pago) => pago.metodo_pago === "stripe")
      .reduce((acc, pago) => acc + toNumber(pago.monto_pagado), 0);

    const response: CuotasPagosDashboardBiResponse = {
      generated_at: new Date().toISOString(),
      resumen_estados: Array.from(resumenEstadosMap.entries()).map(([estado_cuota, cantidad_socios]) => ({
        estado_cuota,
        cantidad_socios,
      })),
      resumen_metodos_pago: Array.from(resumenMetodosMap.values()),
      evolucion_precio_cuota: (evolucionResult.data ?? []).map((row: any) => ({
        periodo: String(row.periodo),
        anio: Number(row.anio),
        mes: Number(row.mes),
        monto: toNumber(row.monto),
      })),
      pagos_recientes: pagos.slice(0, 20).map((pago) => ({
        id: pago.id,
        socio_id: pago.socio_id,
        nombre_completo: pago.socio?.nombre_completo || "Socio no disponible",
        fecha_pago: pago.fecha_pago,
        periodo_desde: pago.periodo_desde,
        periodo_hasta: pago.periodo_hasta,
        meses_cubiertos: pago.meses_cubiertos,
        metodo_pago: pago.metodo_pago,
        estado: pago.estado,
        monto_pagado: toNumber(pago.monto_pagado),
      })),
      socios_vencidos: estados
        .filter((socio) => socio.estado_cuota === "vencido")
        .sort((a, b) => (b.dias_vencido ?? 0) - (a.dias_vencido ?? 0))
        .slice(0, 20),
      socios_sin_pagos: estados
        .filter((socio) => socio.estado_cuota === "sin_pagos")
        .sort((a, b) => a.nombre_completo.localeCompare(b.nombre_completo))
        .slice(0, 20),
      kpis: {
        socios_al_dia: estados.filter((socio) => socio.estado_cuota === "al_dia").length,
        socios_vencidos: estados.filter((socio) => socio.estado_cuota === "vencido").length,
        socios_sin_pagos: estados.filter((socio) => socio.estado_cuota === "sin_pagos").length,
        total_pagado: totalPagado,
        total_efectivo: totalEfectivo,
        total_stripe: totalStripe,
        cantidad_pagos: pagos.length,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("ERROR dashboard BI cuotas/pagos:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al obtener dashboard BI de cuotas y pagos" },
      { status: 500 }
    );
  }
}
