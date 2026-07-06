"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  Gift,
  Loader2,
  PackageCheck,
  ReceiptText,
  RefreshCw,
  Tags,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/header/AppHeader";
import { AppFooter } from "@/components/footer/AppFooter";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/authStore";
import type { ComercialPackAnalyticsDashboard } from "@/interfaces/comercialPackAnalytics.interface";
import { getComercialPackAnalytics } from "@/services/comercialPackAnalyticsService";
import { formatCurrencyARS } from "@/lib/comercial/productos";

const emptyDashboard: ComercialPackAnalyticsDashboard = {
  registros: [],
  topPacks: [],
  cupones: [],
  mensual: [],
  metricas: {
    ventasConPack: 0,
    packsVendidos: 0,
    ingresoPacks: 0,
    ticketPromedioPack: 0,
    descuentoCuponEstimado: 0,
    packsDistintos: 0,
    cuponesUsados: 0,
  },
  filtros: {},
};

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

function firstDayOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = String(value).slice(0, 10);
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) return date;
  return `${day}/${month}/${year}`;
}

function MetricCard({ title, value, description, icon: Icon }: any) {
  return (
    <Card className="bg-white text-slate-950 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="rounded-full bg-fuchsia-50 p-3 text-fuchsia-600 dark:bg-fuchsia-500/15 dark:text-fuchsia-200">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function ComercialPackAnalyticsPage() {
  const { isAuthenticated, initializeAuth, isInitialized } = useAuthStore();
  const router = useRouter();
  const [dashboard, setDashboard] =
    useState<ComercialPackAnalyticsDashboard>(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [desde, setDesde] = useState(firstDayOfMonth());
  const [hasta, setHasta] = useState(todayInput());

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);
  useEffect(() => {
    if (isInitialized && !isAuthenticated) router.push("/auth/login");
  }, [isAuthenticated, isInitialized, router]);

  async function loadDashboard() {
    setLoading(true);
    try {
      const data = await getComercialPackAnalytics({ desde, hasta });
      setDashboard(data);
    } catch (error: any) {
      toast.error(error.message || "No se pudo cargar analítica de packs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isInitialized && isAuthenticated) loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized, isAuthenticated]);

  const latestRows = useMemo(
    () => dashboard.registros.slice(0, 20),
    [dashboard.registros],
  );
  const topPack = dashboard.topPacks[0];
  const topCoupon = dashboard.cupones[0];
  const promoShare =
    dashboard.metricas.ventasConPack > 0
      ? Math.round(
          (dashboard.metricas.cuponesUsados /
            dashboard.metricas.ventasConPack) *
            100,
        )
      : 0;
  const executiveSignal =
    dashboard.metricas.ingresoPacks > 0
      ? "Packs con tracción comercial"
      : "Sin movimiento comercial de packs";

  if (!isInitialized) return <div>Cargando...</div>;
  if (!isAuthenticated) return null;

  return (
    <SidebarProvider>
      <div className="flex h-[100dvh] max-h-[100dvh] w-full overflow-hidden">
        <AppSidebar />
        <SidebarInset className="!grid !min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden">
          <AppHeader title="BI Packs / Promos" />
          <main className="min-h-0 space-y-6 overflow-y-auto overflow-x-hidden p-4 pb-8 sm:p-6">
            <section className="rounded-2xl border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-fuchsia-600">
                    Comercial y Stock
                  </p>
                  <h1 className="text-2xl font-bold">
                    Analítica de packs, promociones y cupones
                  </h1>
                  <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
                    Medí qué packs se venden, cuántas unidades se movieron, qué
                    cupones se usaron y cuánto ingreso generan las promociones
                    del POS/Kiosco.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline">
                    <Link href="/dashboard/comercial/kiosco">Abrir POS</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/dashboard/comercial/servicios-promociones">
                      Gestionar packs
                    </Link>
                  </Button>
                  <Button
                    onClick={loadDashboard}
                    disabled={loading}
                    className="bg-[#02a8e1] hover:bg-[#0288b1]"
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Actualizar
                  </Button>
                </div>
              </div>
            </section>

            <Card>
              <CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_1fr_auto] md:items-end">
                <div className="space-y-2">
                  <Label>Desde</Label>
                  <Input
                    type="date"
                    value={desde}
                    onChange={(event) => setDesde(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hasta</Label>
                  <Input
                    type="date"
                    value={hasta}
                    onChange={(event) => setHasta(event.target.value)}
                  />
                </div>
                <Button
                  onClick={loadDashboard}
                  disabled={loading}
                  variant="outline"
                >
                  Aplicar filtros
                </Button>
              </CardContent>
            </Card>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                title="Ventas con pack"
                value={
                  loading ? "..." : String(dashboard.metricas.ventasConPack)
                }
                description="Ventas POS que incluyeron al menos un pack"
                icon={ReceiptText}
              />
              <MetricCard
                title="Packs vendidos"
                value={
                  loading ? "..." : String(dashboard.metricas.packsVendidos)
                }
                description="Unidades vendidas en el período"
                icon={PackageCheck}
              />
              <MetricCard
                title="Ingreso packs"
                value={
                  loading
                    ? "..."
                    : formatCurrencyARS(dashboard.metricas.ingresoPacks)
                }
                description="Ingreso atribuido a packs activos"
                icon={TrendingUp}
              />
              <MetricCard
                title="Cupones usados"
                value={
                  loading ? "..." : String(dashboard.metricas.cuponesUsados)
                }
                description={`Descuento estimado: ${formatCurrencyARS(dashboard.metricas.descuentoCuponEstimado)}`}
                icon={Gift}
              />
            </section>

            <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <Card className="border-sky-200 bg-gradient-to-br from-sky-950 via-slate-950 to-cyan-950 text-white shadow-lg dark:border-sky-900">
                <CardContent className="space-y-4 p-5">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">
                        Lectura ejecutiva comercial
                      </p>
                      <h2 className="mt-2 text-xl font-bold">
                        {executiveSignal}
                      </h2>
                      <p className="mt-2 text-sm leading-relaxed text-cyan-50/80">
                        Consolidado para decidir si conviene empujar packs,
                        ajustar promociones o priorizar productos de mayor
                        margen en el POS.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-cyan-300/30 bg-white/10 px-4 py-3 text-right">
                      <p className="text-xs text-cyan-100/80">
                        Ticket pack promedio
                      </p>
                      <p className="text-lg font-bold">
                        {formatCurrencyARS(
                          dashboard.metricas.ticketPromedioPack,
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                      <p className="text-xs uppercase tracking-wide text-cyan-100/70">
                        Pack líder
                      </p>
                      <p className="mt-2 font-semibold">
                        {topPack?.pack_nombre ?? "Sin pack destacado"}
                      </p>
                      <p className="mt-1 text-xs text-cyan-50/70">
                        {topPack
                          ? `${topPack.cantidad_vendida} unidades · ${formatCurrencyARS(topPack.ingreso_total)}`
                          : "Esperando ventas del período."}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                      <p className="text-xs uppercase tracking-wide text-cyan-100/70">
                        Uso de cupones
                      </p>
                      <p className="mt-2 font-semibold">
                        {promoShare}% de ventas con pack
                      </p>
                      <p className="mt-1 text-xs text-cyan-50/70">
                        {topCoupon?.cupon_codigo
                          ? `Cupón líder: ${topCoupon.cupon_codigo}`
                          : "Sin cupones aplicados."}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                      <p className="text-xs uppercase tracking-wide text-cyan-100/70">
                        Decisión sugerida
                      </p>
                      <p className="mt-2 font-semibold">
                        {dashboard.metricas.packsVendidos > 0
                          ? "Reforzar packs rentables"
                          : "Activar promoción inicial"}
                      </p>
                      <p className="mt-1 text-xs text-cyan-50/70">
                        Usá este reporte junto al stock crítico antes de lanzar
                        campañas.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-amber-200 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/20">
                <CardContent className="space-y-3 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
                    Próximo paso operativo
                  </p>
                  <h3 className="text-lg font-bold">
                    Cruzar packs con inventario
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Si el pack líder consume productos críticos, priorizá
                    reposición antes de sostener descuentos. Si el inventario
                    está sano, mantené la promo activa.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href="/dashboard/comercial/stock-ledger">
                        Ver stock
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href="/dashboard/finanzas">Ver finanzas</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-4 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-fuchsia-600" /> Top packs
                    vendidos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {dashboard.topPacks.length === 0 && (
                    <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                      Todavía no hay packs vendidos para el período
                      seleccionado.
                    </p>
                  )}
                  {dashboard.topPacks.map((pack) => (
                    <div
                      key={`${pack.pack_id ?? pack.pack_codigo}`}
                      className="rounded-xl border p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold">{pack.pack_nombre}</p>
                          <p className="text-xs text-muted-foreground">
                            {pack.pack_codigo} · Última venta:{" "}
                            {formatDate(pack.ultima_venta)}
                          </p>
                        </div>
                        <p className="font-bold">
                          {formatCurrencyARS(pack.ingreso_total)}
                        </p>
                      </div>
                      <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                        <span>{pack.cantidad_vendida} unidades</span>
                        <span>{pack.ventas} registros</span>
                        <span>
                          {formatCurrencyARS(pack.descuento_cupon_estimado)}{" "}
                          desc.
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tags className="h-5 w-5 text-fuchsia-600" /> Cupones y
                    promociones
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {dashboard.cupones.length === 0 && (
                    <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                      No hay cupones aplicados a packs en el período.
                    </p>
                  )}
                  {dashboard.cupones.map((cupon) => (
                    <div
                      key={`${cupon.cupon_id ?? cupon.cupon_codigo}`}
                      className="rounded-xl border p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold">{cupon.cupon_codigo}</p>
                          <p className="text-xs text-muted-foreground">
                            {cupon.promocion_nombre ?? "Promoción sin nombre"}
                          </p>
                        </div>
                        <p className="font-bold text-emerald-600">
                          -{formatCurrencyARS(cupon.descuento_estimado)}
                        </p>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {cupon.usos} usos · {cupon.packs_vendidos} packs ·{" "}
                        {formatCurrencyARS(cupon.ingreso_asociado)} asociado
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-fuchsia-600" />{" "}
                  Evolución mensual
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="border-b bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="p-3">Período</th>
                      <th className="p-3">Packs vendidos</th>
                      <th className="p-3">Ventas</th>
                      <th className="p-3">Ingreso</th>
                      <th className="p-3">Descuento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.mensual.map((row) => (
                      <tr key={row.periodo} className="border-b last:border-0">
                        <td className="p-3 font-medium">{row.periodo}</td>
                        <td className="p-3">{row.packs_vendidos}</td>
                        <td className="p-3">{row.ventas}</td>
                        <td className="p-3">
                          {formatCurrencyARS(row.ingreso_total)}
                        </td>
                        <td className="p-3">
                          {formatCurrencyARS(row.descuento_cupon_estimado)}
                        </td>
                      </tr>
                    ))}
                    {dashboard.mensual.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-6 text-center text-muted-foreground"
                        >
                          Sin datos mensuales para mostrar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Últimas ventas con packs</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full min-w-[960px] text-sm">
                  <thead className="border-b bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Pack</th>
                      <th className="p-3">Cantidad</th>
                      <th className="p-3">Total pack</th>
                      <th className="p-3">Cupón</th>
                      <th className="p-3">Venta</th>
                      <th className="p-3">Componentes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestRows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b align-top last:border-0"
                      >
                        <td className="p-3">
                          {formatDate(row.venta?.fecha ?? row.creado_en)}
                        </td>
                        <td className="p-3">
                          <p className="font-medium">{row.pack_nombre}</p>
                          <p className="text-xs text-muted-foreground">
                            {row.pack_codigo}
                          </p>
                        </td>
                        <td className="p-3">{row.cantidad}</td>
                        <td className="p-3">
                          {formatCurrencyARS(row.total_pack)}
                        </td>
                        <td className="p-3">
                          {row.cupon_codigo
                            ? `${row.cupon_codigo} · -${formatCurrencyARS(row.descuento_cupon_estimado)}`
                            : "-"}
                        </td>
                        <td className="p-3">
                          <p>{row.venta?.comprobante_codigo ?? row.venta_id}</p>
                          <p className="text-xs text-muted-foreground">
                            {row.venta?.cliente_nombre ??
                              row.venta?.cliente_tipo ??
                              "Cliente"}
                          </p>
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">
                          {row.componentes
                            ?.map((item) => `${item.cantidad} x ${item.nombre}`)
                            .join(" · ") || "-"}
                        </td>
                      </tr>
                    ))}
                    {latestRows.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="p-6 text-center text-muted-foreground"
                        >
                          No hay ventas con packs en el período.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </main>
          <AppFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
