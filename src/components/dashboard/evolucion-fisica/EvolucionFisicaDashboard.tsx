"use client";

import { useMemo } from "react";
import {
  Activity,
  CalendarDays,
  Dumbbell,
  Percent,
  Ruler,
  Scale,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EvolucionSocio } from "@/interfaces/evolucionSocio.interface";
import EvolucionFisicaBeforeAfterStudio from "./EvolucionFisicaBeforeAfterStudio";
import { formatFrontendDate, formatFrontendShortDate } from '@/utils/dateFormat';


interface EvolucionFisicaDashboardProps {
  rows: EvolucionSocio[];
  socioNombre?: string;
}

interface ChartPoint {
  fecha: string;
  fechaOrden: number;
  peso: number | null;
  imc: number | null;
  cintura: number | null;
  pecho: number | null;
  cadera: number | null;
  grasa: number | null;
  masaMuscular: number | null;
}

const metricLabels: Record<string, string> = {
  peso: "Peso",
  imc: "IMC",
  cintura: "Cintura",
  pecho: "Pecho",
  cadera: "Cadera",
  grasa: "% grasa",
  masaMuscular: "Masa muscular",
};

const formatDate = (value?: string | Date | null) => {
  if (!value) return "-";

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : formatFrontendDate(value);
};

const formatShortDate = (value?: string | Date | null) => {
  if (!value) return "-";

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : formatFrontendShortDate(value);
};

const formatNumber = (
  value?: number | null,
  suffix = "",
  maximumFractionDigits = 2
) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "-";
  }

  return `${Number(value).toLocaleString("es-AR", {
    maximumFractionDigits,
  })}${suffix}`;
};

const toNumberOrNull = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return null;
  }

  return Number(value);
};

const getAverage = (left?: number | null, right?: number | null) => {
  const values = [left, right].filter(
    (value) => value !== null && value !== undefined && !Number.isNaN(Number(value))
  ) as number[];

  if (!values.length) return null;

  return Number((values.reduce((acc, value) => acc + Number(value), 0) / values.length).toFixed(2));
};

const delta = (current?: number | null, initial?: number | null) => {
  if (
    current === null ||
    current === undefined ||
    initial === null ||
    initial === undefined ||
    Number.isNaN(Number(current)) ||
    Number.isNaN(Number(initial))
  ) {
    return null;
  }

  return Number((Number(current) - Number(initial)).toFixed(2));
};

const signed = (value: number | null, suffix = "") => {
  if (value === null) return "-";
  return `${value > 0 ? "+" : ""}${formatNumber(value, suffix)}`;
};

const getDeltaTone = (
  value: number | null,
  direction: "lower" | "higher" | "neutral" = "neutral"
) => {
  if (value === null || value === 0 || direction === "neutral") {
    return "text-gray-700";
  }

  const improved =
    direction === "lower" ? value < 0 : direction === "higher" ? value > 0 : false;

  return improved ? "text-emerald-600" : "text-orange-600";
};

const getDeltaIcon = (value: number | null) => {
  if (value === null || value === 0) return Activity;
  return value > 0 ? TrendingUp : TrendingDown;
};

const getOrderedRows = (rows: EvolucionSocio[]) => {
  return [...rows].sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  );
};

function StatCard({
  title,
  value,
  helper,
  deltaValue,
  deltaSuffix,
  direction = "neutral",
  icon: Icon,
}: {
  title: string;
  value: string;
  helper?: string;
  deltaValue?: number | null;
  deltaSuffix?: string;
  direction?: "lower" | "higher" | "neutral";
  icon: typeof Activity;
}) {
  const DeltaIcon = getDeltaIcon(deltaValue ?? null);

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-gray-950">{value}</p>
        </div>
        <div className="rounded-xl bg-[#02a8e1]/10 p-2 text-[#02a8e1]">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {deltaValue !== undefined ? (
        <p
          className={`mt-2 inline-flex items-center gap-1 text-sm font-semibold ${getDeltaTone(
            deltaValue,
            direction
          )}`}
        >
          <DeltaIcon className="h-4 w-4" />
          {signed(deltaValue ?? null, deltaSuffix ?? "")}
        </p>
      ) : null}

      {helper ? <p className="mt-1 text-xs text-gray-500">{helper}</p> : null}
    </div>
  );
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div
      data-evolucion-pdf-chart-card="true"
      data-chart-title={title}
      data-chart-description={description}
    >
      <Card className="rounded-2xl border bg-white shadow-sm">
        <CardHeader className="space-y-1 border-b p-4">
          <h3 className="text-lg font-semibold text-gray-950">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </CardHeader>
        <CardContent className="h-[320px] p-4">{children}</CardContent>
      </Card>
    </div>
  );
}

const tooltipFormatter = (value: unknown, name: unknown) => {
  const key = String(name);
  return [formatNumber(Number(value)), metricLabels[key] ?? key];
};

const buildInsight = ({
  records,
  diffPeso,
  diffCintura,
  diffGrasa,
  diffMasa,
}: {
  records: number;
  diffPeso: number | null;
  diffCintura: number | null;
  diffGrasa: number | null;
  diffMasa: number | null;
}) => {
  if (records < 2) {
    return "Aún falta un segundo registro para construir una comparación completa de progreso.";
  }

  const highlights: string[] = [];

  if (diffPeso !== null) {
    highlights.push(`peso ${diffPeso < 0 ? "bajó" : diffPeso > 0 ? "subió" : "se mantuvo"} ${formatNumber(Math.abs(diffPeso), " kg")}`);
  }

  if (diffCintura !== null) {
    highlights.push(`cintura ${diffCintura < 0 ? "bajó" : diffCintura > 0 ? "subió" : "se mantuvo"} ${formatNumber(Math.abs(diffCintura), " cm")}`);
  }

  if (diffGrasa !== null) {
    highlights.push(`grasa ${diffGrasa < 0 ? "bajó" : diffGrasa > 0 ? "subió" : "se mantuvo"} ${formatNumber(Math.abs(diffGrasa), "%")}`);
  }

  if (diffMasa !== null) {
    highlights.push(`masa muscular ${diffMasa > 0 ? "aumentó" : diffMasa < 0 ? "bajó" : "se mantuvo"} ${formatNumber(Math.abs(diffMasa), " kg")}`);
  }

  if (!highlights.length) {
    return "Hay registros cargados, pero faltan métricas comparables para generar una lectura automática.";
  }

  return `Comparación inicial vs. actual: ${highlights.join(", ")}.`;
};

export default function EvolucionFisicaDashboard({
  rows,
  socioNombre = "Socio",
}: EvolucionFisicaDashboardProps) {
  const orderedRows = useMemo(() => getOrderedRows(rows), [rows]);
  const initial = orderedRows.find((row) => row.es_registro_inicial) || orderedRows[0] || null;
  const current = orderedRows[orderedRows.length - 1] || null;

  const chartData = useMemo<ChartPoint[]>(() => {
    return orderedRows.map((row) => ({
      fecha: formatShortDate(row.fecha),
      fechaOrden: new Date(row.fecha).getTime(),
      peso: toNumberOrNull(row.peso),
      imc: toNumberOrNull(row.imc),
      cintura: toNumberOrNull(row.cintura),
      pecho: toNumberOrNull(row.pecho),
      cadera: toNumberOrNull(row.cadera),
      grasa: toNumberOrNull(row.porcentaje_grasa),
      masaMuscular: toNumberOrNull(row.masa_muscular),
    }));
  }, [orderedRows]);

  const diffPeso = delta(current?.peso, initial?.peso);
  const diffCintura = delta(current?.cintura, initial?.cintura);
  const diffGrasa = delta(current?.porcentaje_grasa, initial?.porcentaje_grasa);
  const diffMasa = delta(current?.masa_muscular, initial?.masa_muscular);
  const diffImc = delta(current?.imc, initial?.imc);

  const brazoInicial = getAverage(initial?.biceps_izquierdo, initial?.biceps_derecho);
  const brazoActual = getAverage(current?.biceps_izquierdo, current?.biceps_derecho);
  const piernaInicial = getAverage(initial?.muslo_izquierdo, initial?.muslo_derecho);
  const piernaActual = getAverage(current?.muslo_izquierdo, current?.muslo_derecho);

  const insight = buildInsight({
    records: orderedRows.length,
    diffPeso,
    diffCintura,
    diffGrasa,
    diffMasa,
  });

  if (!rows.length) {
    return (
      <Card className="rounded-2xl border bg-white shadow-sm">
        <CardContent className="p-6 text-sm text-gray-500">
          El dashboard se activará cuando el socio tenga al menos un registro de evolución física.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-[#02a8e1]">
              Dashboard de evolución física
            </p>
            <h2 className="mt-1 text-2xl font-bold text-gray-950">
              Progreso corporal de {socioNombre}
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-gray-500">{insight}</p>
          </div>
          <p className="text-xs text-gray-400">
            Registros: {orderedRows.length} · Última medición: {formatDate(current?.fecha)}
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Peso actual"
          value={formatNumber(current?.peso, " kg")}
          helper={`Inicial: ${formatNumber(initial?.peso, " kg")}`}
          deltaValue={diffPeso}
          deltaSuffix=" kg"
          direction="neutral"
          icon={Scale}
        />
        <StatCard
          title="Cintura"
          value={formatNumber(current?.cintura, " cm")}
          helper={`Inicial: ${formatNumber(initial?.cintura, " cm")}`}
          deltaValue={diffCintura}
          deltaSuffix=" cm"
          direction="lower"
          icon={Ruler}
        />
        <StatCard
          title="% grasa"
          value={formatNumber(current?.porcentaje_grasa, "%")}
          helper={`Inicial: ${formatNumber(initial?.porcentaje_grasa, "%")}`}
          deltaValue={diffGrasa}
          deltaSuffix="%"
          direction="lower"
          icon={Percent}
        />
        <StatCard
          title="Masa muscular"
          value={formatNumber(current?.masa_muscular, " kg")}
          helper={`Inicial: ${formatNumber(initial?.masa_muscular, " kg")}`}
          deltaValue={diffMasa}
          deltaSuffix=" kg"
          direction="higher"
          icon={Dumbbell}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="IMC actual"
          value={formatNumber(current?.imc)}
          helper={`Inicial: ${formatNumber(initial?.imc)}`}
          deltaValue={diffImc}
          direction="lower"
          icon={Activity}
        />
        <StatCard
          title="Primer registro"
          value={formatDate(initial?.fecha)}
          helper={`${formatNumber(initial?.peso, " kg")} · ${formatNumber(initial?.cintura, " cm cintura")}`}
          icon={CalendarDays}
        />
        <StatCard
          title="Último registro"
          value={formatDate(current?.fecha)}
          helper={`${formatNumber(current?.peso, " kg")} · ${formatNumber(current?.cintura, " cm cintura")}`}
          icon={CalendarDays}
        />
      </section>

      <EvolucionFisicaBeforeAfterStudio rows={orderedRows} socioNombre={socioNombre} />


      <section className="grid gap-6 xl:grid-cols-2">
        <ChartCard
          title="Peso e IMC"
          description="Evolución cronológica del peso corporal y del índice de masa corporal."
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" />
              <YAxis />
              <Tooltip formatter={tooltipFormatter} />
              <Legend />
              <Line type="monotone" dataKey="peso" name="peso" stroke="#02a8e1" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              <Line type="monotone" dataKey="imc" name="imc" stroke="#6d28d9" strokeWidth={2} dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Composición corporal"
          description="Comparación entre porcentaje de grasa y masa muscular."
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" />
              <YAxis />
              <Tooltip formatter={tooltipFormatter} />
              <Legend />
              <Line type="monotone" dataKey="grasa" name="grasa" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              <Line type="monotone" dataKey="masaMuscular" name="masaMuscular" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Medidas centrales"
          description="Seguimiento de cintura, pecho y cadera para análisis corporal."
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" />
              <YAxis />
              <Tooltip formatter={tooltipFormatter} />
              <Legend />
              <Line type="monotone" dataKey="cintura" name="cintura" stroke="#0f172a" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              <Line type="monotone" dataKey="pecho" name="pecho" stroke="#0284c7" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              <Line type="monotone" dataKey="cadera" name="cadera" stroke="#db2777" strokeWidth={2} dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <Card className="rounded-2xl border bg-white shadow-sm">
          <CardHeader className="space-y-1 border-b p-4">
            <h3 className="text-lg font-semibold text-gray-950">Antes vs. ahora</h3>
            <p className="text-sm text-gray-500">
              Lectura comparativa entre el primer registro y la última medición.
            </p>
          </CardHeader>
          <CardContent className="p-4">
            <div className="overflow-hidden rounded-xl border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Métrica</th>
                    <th className="px-4 py-3">Inicial</th>
                    <th className="px-4 py-3">Actual</th>
                    <th className="px-4 py-3">Cambio</th>
                  </tr>
                </thead>
                <tbody>
                  {([
                    ["Peso", formatNumber(initial?.peso, " kg"), formatNumber(current?.peso, " kg"), signed(diffPeso, " kg")],
                    ["IMC", formatNumber(initial?.imc), formatNumber(current?.imc), signed(diffImc)],
                    ["Cintura", formatNumber(initial?.cintura, " cm"), formatNumber(current?.cintura, " cm"), signed(diffCintura, " cm")],
                    ["% grasa", formatNumber(initial?.porcentaje_grasa, "%"), formatNumber(current?.porcentaje_grasa, "%"), signed(diffGrasa, "%")],
                    ["Masa muscular", formatNumber(initial?.masa_muscular, " kg"), formatNumber(current?.masa_muscular, " kg"), signed(diffMasa, " kg")],
                    ["Brazo promedio", formatNumber(brazoInicial, " cm"), formatNumber(brazoActual, " cm"), signed(delta(brazoActual, brazoInicial), " cm")],
                    ["Muslo promedio", formatNumber(piernaInicial, " cm"), formatNumber(piernaActual, " cm"), signed(delta(piernaActual, piernaInicial), " cm")],
                  ] as Array<[string, string, string, string]>).map(([label, initialValue, currentValue, change]) => (
                    <tr key={label} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium text-gray-950">{label}</td>
                      <td className="px-4 py-3 text-gray-600">{initialValue}</td>
                      <td className="px-4 py-3 text-gray-600">{currentValue}</td>
                      <td className="px-4 py-3 font-semibold text-gray-950">{change}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}