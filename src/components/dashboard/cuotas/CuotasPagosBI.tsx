"use client";

import { useEffect, useMemo, useState } from "react";
import { getCuotasPagosDashboardBi } from "@/services/browser/cuotasPagosBiApiClient";
import { CuotasPagosDashboardBiResponse } from "@/interfaces/cuotasPagosBi.interface";
import { formatFrontendDateTime } from '@/utils/dateFormat';
import { useI18n } from '@/i18n/I18nProvider';
import { translateCommercialUi } from '@/i18n/commercialUi';

function money(value: number | null | undefined, locale: string) {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

function date(value: string | null | undefined, locale: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-AR").format(new Date(`${value}T00:00:00`));
}

function statusLabel(value: string | null | undefined, c: (text: string) => string) {
  if (!value) return c("Sin estado");
  const labels: Record<string, string> = {
    al_dia: "Al día",
    vencido: "Vencido",
    sin_pagos: "Sin pagos",
    pagado: "Pagado",
    cancelado: "Cancelado",
    pendiente: "Pendiente",
  };
  return c(labels[value] ?? value);
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
  const { locale } = useI18n();
  const c = (text: string) => translateCommercialUi(locale, text);
  const dateLocale = locale === "en" ? "en-US" : "es-AR";
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
        if (mounted) setError(err instanceof Error ? err.message : c("Error al cargar BI de cuotas/pagos"));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [locale]);

  const ultimoPrecio = useMemo(() => {
    if (!data?.evolucion_precio_cuota?.length) return null;
    return data.evolucion_precio_cuota[data.evolucion_precio_cuota.length - 1];
  }, [data]);

  if (loading) {
    return <div className="rounded-2xl border bg-white p-6 text-gray-600">{c("Cargando dashboard BI de cuotas y pagos...")}</div>;
  }

  if (error) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>;
  }

  if (!data) {
    return <div className="rounded-2xl border bg-white p-6 text-gray-600">{c("No hay datos disponibles.")}</div>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-950">{c("BI de cuotas y pagos")}</h2>
            <p className="text-sm text-gray-500">
              {c("Resumen operativo de socios al día, vencimientos, ingresos por método y evolución del precio de cuota.")}
            </p>
          </div>
          <p className="text-xs text-gray-400">{c("Actualizado")}: {formatFrontendDateTime(data.generated_at, dateLocale)}</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label={c("Socios al día")} value={data.kpis.socios_al_dia} />
        <StatCard label={c("Socios vencidos")} value={data.kpis.socios_vencidos} />
        <StatCard label={c("Socios sin pagos")} value={data.kpis.socios_sin_pagos} />
        <StatCard label={c("Total cobrado")} value={money(data.kpis.total_pagado, locale)} helper={`${data.kpis.cantidad_pagos} ${c("pagos registrados")}`} />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label={c("Efectivo")} value={money(data.kpis.total_efectivo, locale)} />
        <StatCard label="Stripe" value={money(data.kpis.total_stripe, locale)} />
        <StatCard
          label={c("Última cuota")}
          value={ultimoPrecio ? money(ultimoPrecio.monto, locale) : "-"}
          helper={ultimoPrecio ? ultimoPrecio.periodo : c("Sin historial")}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-950">{c("Socios vencidos")}</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-xs uppercase text-gray-500">
                <tr>
                  <th className="py-2">{c("Socio")}</th>
                  <th className="py-2">{c("Vencimiento")}</th>
                  <th className="py-2 text-right">{c("Días")}</th>
                </tr>
              </thead>
              <tbody>
                {data.socios_vencidos.length ? (
                  data.socios_vencidos.map((socio) => (
                    <tr key={socio.id_socio} className="border-b last:border-0">
                      <td className="py-3 font-medium text-gray-900">{socio.nombre_completo}</td>
                      <td className="py-3 text-gray-600">{date(socio.periodo_hasta, locale)}</td>
                      <td className="py-3 text-right text-red-600">{socio.dias_vencido}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-4 text-gray-500" colSpan={3}>{c("No hay socios vencidos.")}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-950">{c("Socios sin pagos")}</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-xs uppercase text-gray-500">
                <tr>
                  <th className="py-2">{c("Socio")}</th>
                  <th className="py-2">{c("Estado")}</th>
                </tr>
              </thead>
              <tbody>
                {data.socios_sin_pagos.length ? (
                  data.socios_sin_pagos.map((socio) => (
                    <tr key={socio.id_socio} className="border-b last:border-0">
                      <td className="py-3 font-medium text-gray-900">{socio.nombre_completo}</td>
                      <td className="py-3 text-gray-600">{statusLabel(socio.estado_cuota, c)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-4 text-gray-500" colSpan={2}>{c("No hay socios sin pagos.")}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-950">{c("Pagos recientes")}</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-xs uppercase text-gray-500">
              <tr>
                <th className="py-2">{c("Socio")}</th>
                <th className="py-2">{c("Fecha")}</th>
                <th className="py-2">{c("Período")}</th>
                <th className="py-2">{c("Método")}</th>
                <th className="py-2">{c("Estado")}</th>
                <th className="py-2 text-right">{c("Monto")}</th>
              </tr>
            </thead>
            <tbody>
              {data.pagos_recientes.length ? (
                data.pagos_recientes.map((pago) => (
                  <tr key={pago.id} className="border-b last:border-0">
                    <td className="py-3 font-medium text-gray-900">{pago.nombre_completo}</td>
                    <td className="py-3 text-gray-600">{date(pago.fecha_pago, locale)}</td>
                    <td className="py-3 text-gray-600">{date(pago.periodo_desde, locale)} - {date(pago.periodo_hasta, locale)}</td>
                    <td className="py-3 text-gray-600">{pago.metodo_pago ? c(pago.metodo_pago) : "-"}</td>
                    <td className="py-3 text-gray-600">{statusLabel(pago.estado, c)}</td>
                    <td className="py-3 text-right">
                      <div className="font-semibold text-gray-950">{money(pago.monto_pagado, locale)}</div>
                      {Number(pago.descuento_monto ?? 0) > 0 ? (
                        <div className="text-xs text-emerald-700">
                          {c("Desc.")} {money(pago.descuento_monto, locale)}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-4 text-gray-500" colSpan={6}>{c("No hay pagos recientes.")}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
