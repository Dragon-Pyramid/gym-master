"use client";

import { useEffect, useMemo, useState } from "react";
import { getCuotasPagosDashboardBi } from "@/services/browser/cuotasPagosBiApiClient";
import { CuotasPagosDashboardBiResponse } from "@/interfaces/cuotasPagosBi.interface";

function money(value: number | null | undefined) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

function date(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("es-AR").format(new Date(`${value}T00:00:00`));
}

function statusLabel(value: string | null | undefined) {
  if (!value) return "Sin estado";
  const labels: Record<string, string> = {
    al_dia: "Al día",
    vencido: "Vencido",
    sin_pagos: "Sin pagos",
    pagado: "Pagado",
    cancelado: "Cancelado",
    pendiente: "Pendiente",
  };
  return labels[value] ?? value;
}

function StatCard({ label, value, helper }: { label: string; value: string | number; helper?: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-950">{value}</p>
      {helper ? <p className="mt-1 text-xs text-gray-500">{helper}</p> : null}
    </div>
  );
}

export default function CuotasPagosBI() {
  const [data, setData] = useState<CuotasPagosDashboardBiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const response = await getCuotasPagosDashboardBi();
        if (mounted) setData(response);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "Error al cargar BI de cuotas/pagos");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const ultimoPrecio = useMemo(() => {
    if (!data?.evolucion_precio_cuota?.length) return null;
    return data.evolucion_precio_cuota[data.evolucion_precio_cuota.length - 1];
  }, [data]);

  if (loading) {
    return <div className="rounded-2xl border bg-white p-6 text-gray-600">Cargando dashboard BI de cuotas y pagos...</div>;
  }

  if (error) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>;
  }

  if (!data) {
    return <div className="rounded-2xl border bg-white p-6 text-gray-600">No hay datos disponibles.</div>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-950">BI de cuotas y pagos</h2>
            <p className="text-sm text-gray-500">
              Resumen operativo de socios al día, vencimientos, ingresos por método y evolución del precio de cuota.
            </p>
          </div>
          <p className="text-xs text-gray-400">Actualizado: {new Date(data.generated_at).toLocaleString("es-AR")}</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Socios al día" value={data.kpis.socios_al_dia} />
        <StatCard label="Socios vencidos" value={data.kpis.socios_vencidos} />
        <StatCard label="Socios sin pagos" value={data.kpis.socios_sin_pagos} />
        <StatCard label="Total cobrado" value={money(data.kpis.total_pagado)} helper={`${data.kpis.cantidad_pagos} pagos registrados`} />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Efectivo" value={money(data.kpis.total_efectivo)} />
        <StatCard label="Stripe" value={money(data.kpis.total_stripe)} />
        <StatCard
          label="Última cuota"
          value={ultimoPrecio ? money(ultimoPrecio.monto) : "-"}
          helper={ultimoPrecio ? ultimoPrecio.periodo : "Sin historial"}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-950">Socios vencidos</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-xs uppercase text-gray-500">
                <tr>
                  <th className="py-2">Socio</th>
                  <th className="py-2">Vencimiento</th>
                  <th className="py-2 text-right">Días</th>
                </tr>
              </thead>
              <tbody>
                {data.socios_vencidos.length ? (
                  data.socios_vencidos.map((socio) => (
                    <tr key={socio.id_socio} className="border-b last:border-0">
                      <td className="py-3 font-medium text-gray-900">{socio.nombre_completo}</td>
                      <td className="py-3 text-gray-600">{date(socio.periodo_hasta)}</td>
                      <td className="py-3 text-right text-red-600">{socio.dias_vencido}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-4 text-gray-500" colSpan={3}>No hay socios vencidos.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-950">Socios sin pagos</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-xs uppercase text-gray-500">
                <tr>
                  <th className="py-2">Socio</th>
                  <th className="py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {data.socios_sin_pagos.length ? (
                  data.socios_sin_pagos.map((socio) => (
                    <tr key={socio.id_socio} className="border-b last:border-0">
                      <td className="py-3 font-medium text-gray-900">{socio.nombre_completo}</td>
                      <td className="py-3 text-gray-600">{statusLabel(socio.estado_cuota)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-4 text-gray-500" colSpan={2}>No hay socios sin pagos.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-950">Pagos recientes</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-xs uppercase text-gray-500">
              <tr>
                <th className="py-2">Socio</th>
                <th className="py-2">Fecha</th>
                <th className="py-2">Período</th>
                <th className="py-2">Método</th>
                <th className="py-2">Estado</th>
                <th className="py-2 text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              {data.pagos_recientes.length ? (
                data.pagos_recientes.map((pago) => (
                  <tr key={pago.id} className="border-b last:border-0">
                    <td className="py-3 font-medium text-gray-900">{pago.nombre_completo}</td>
                    <td className="py-3 text-gray-600">{date(pago.fecha_pago)}</td>
                    <td className="py-3 text-gray-600">{date(pago.periodo_desde)} - {date(pago.periodo_hasta)}</td>
                    <td className="py-3 text-gray-600">{pago.metodo_pago ?? "-"}</td>
                    <td className="py-3 text-gray-600">{statusLabel(pago.estado)}</td>
                    <td className="py-3 text-right font-semibold text-gray-950">{money(pago.monto_pagado)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-4 text-gray-500" colSpan={6}>No hay pagos recientes.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
