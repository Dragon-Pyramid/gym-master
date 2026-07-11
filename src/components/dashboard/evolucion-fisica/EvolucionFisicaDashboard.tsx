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
import { useI18n } from "@/i18n/I18nProvider";


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

type TranslateFn = (es: string, en: string) => string;

const getMetricLabel = (key: string, tx: TranslateFn) => {
  const labels: Record<string, string> = {
    peso: tx("Peso", "Weight"),
    imc: tx("IMC", "BMI"),
    cintura: tx("Cintura", "Waist"),
    pecho: tx("Pecho", "Chest"),
    cadera: tx("Cadera", "Hip"),
    grasa: tx("% grasa", "Fat %"),
    masaMuscular: tx("Masa muscular", "Muscle mass"),
  };

  return labels[key] ?? key;
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
    <div className="rounded-2xl border bg-card p-4 text-card-foreground shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
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

      {helper ? <p className="mt-1 text-xs text-muted-foreground">{helper}</p> : null}
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
      <Card className="rounded-2xl border bg-card text-card-foreground shadow-sm">
        <CardHeader className="space-y-1 border-b p-4">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardHeader>
        <CardContent className="h-[260px] p-3 sm:h-[320px] sm:p-4">{children}</CardContent>
      </Card>
    </div>
  );
}

const getTooltipFormatter = (tx: TranslateFn) => (value: unknown, name: unknown) => {
  const key = String(name);
  return [formatNumber(Number(value)), getMetricLabel(key, tx)];
};

const buildInsight = ({
  records,
  diffPeso,
  diffCintura,
  diffGrasa,
  diffMasa,
  tx,
}: {
  records: number;
  diffPeso: number | null;
  diffCintura: number | null;
  diffGrasa: number | null;
  diffMasa: number | null;
  tx: TranslateFn;
}) => {
  if (records < 2) {
    return tx("Aún falta un segundo registro para construir una comparación completa de progreso.", "A second record is still needed to build a complete progress comparison.");
  }

  const highlights: string[] = [];

  if (diffPeso !== null) {
    highlights.push(`${tx("peso", "weight")} ${diffPeso < 0 ? tx("bajó", "decreased") : diffPeso > 0 ? tx("subió", "increased") : tx("se mantuvo", "remained stable")} ${formatNumber(Math.abs(diffPeso), " kg")}`);
  }

  if (diffCintura !== null) {
    highlights.push(`${tx("cintura", "waist")} ${diffCintura < 0 ? tx("bajó", "decreased") : diffCintura > 0 ? tx("subió", "increased") : tx("se mantuvo", "remained stable")} ${formatNumber(Math.abs(diffCintura), " cm")}`);
  }

  if (diffGrasa !== null) {
    highlights.push(`${tx("grasa", "fat")} ${diffGrasa < 0 ? tx("bajó", "decreased") : diffGrasa > 0 ? tx("subió", "increased") : tx("se mantuvo", "remained stable")} ${formatNumber(Math.abs(diffGrasa), "%")}`);
  }

  if (diffMasa !== null) {
    highlights.push(`${tx("masa muscular", "muscle mass")} ${diffMasa > 0 ? tx("aumentó", "increased") : diffMasa < 0 ? tx("bajó", "decreased") : tx("se mantuvo", "remained stable")} ${formatNumber(Math.abs(diffMasa), " kg")}`);
  }

  if (!highlights.length) {
    return tx("Hay registros cargados, pero faltan métricas comparables para generar una lectura automática.", "Records are loaded, but comparable metrics are missing to generate an automatic reading.");
  }

  return `${tx("Comparación inicial vs. actual", "Initial vs. current comparison")}: ${highlights.join(", ")}.`;
};

export default function EvolucionFisicaDashboard({
  rows,
  socioNombre = "Socio",
}: EvolucionFisicaDashboardProps) {
  const { locale } = useI18n();
  const isEnglish = locale === "en";
  const tx = (es: string, en: string) => (isEnglish ? en : es);
  const tooltipFormatter = getTooltipFormatter(tx);
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

  const comparisonRows = [
    [tx("Peso", "Weight"), formatNumber(initial?.peso, " kg"), formatNumber(current?.peso, " kg"), signed(diffPeso, " kg")],
    [tx("IMC", "BMI"), formatNumber(initial?.imc), formatNumber(current?.imc), signed(diffImc)],
    [tx("Cintura", "Waist"), formatNumber(initial?.cintura, " cm"), formatNumber(current?.cintura, " cm"), signed(diffCintura, " cm")],
    [tx("% grasa", "Fat %"), formatNumber(initial?.porcentaje_grasa, "%"), formatNumber(current?.porcentaje_grasa, "%"), signed(diffGrasa, "%")],
    [tx("Masa muscular", "Muscle mass"), formatNumber(initial?.masa_muscular, " kg"), formatNumber(current?.masa_muscular, " kg"), signed(diffMasa, " kg")],
    [tx("Brazo promedio", "Average arm"), formatNumber(brazoInicial, " cm"), formatNumber(brazoActual, " cm"), signed(delta(brazoActual, brazoInicial), " cm")],
    [tx("Muslo promedio", "Average thigh"), formatNumber(piernaInicial, " cm"), formatNumber(piernaActual, " cm"), signed(delta(piernaActual, piernaInicial), " cm")],
  ] as Array<[string, string, string, string]>;

  const insight = buildInsight({
    records: orderedRows.length,
    diffPeso,
    diffCintura,
    diffGrasa,
    diffMasa,
    tx,
  });

  if (!rows.length) {
    return (
      <Card className="rounded-2xl border bg-card text-card-foreground shadow-sm">
        <CardContent className="p-6 text-sm text-muted-foreground">
          {tx("El dashboard se activará cuando el socio tenga al menos un registro de evolución física.", "The dashboard will activate when the member has at least one physical evolution record.")}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-card p-4 text-card-foreground shadow-sm sm:p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-[#02a8e1]">
              {tx("Dashboard de evolución física", "Physical evolution dashboard")}
            </p>
            <h2 className="mt-1 text-xl font-bold text-foreground sm:text-2xl">
              {tx("Progreso corporal de", "Body progress of")} {socioNombre}
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{insight}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            {tx("Registros", "Records")}: {orderedRows.length} · {tx("Última medición", "Last measurement")}: {formatDate(current?.fecha)}
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={tx("Peso actual", "Current weight")}
          value={formatNumber(current?.peso, " kg")}
          helper={`${tx("Inicial", "Initial")}: ${formatNumber(initial?.peso, " kg")}`}
          deltaValue={diffPeso}
          deltaSuffix=" kg"
          direction="neutral"
          icon={Scale}
        />
        <StatCard
          title={tx("Cintura", "Waist")}
          value={formatNumber(current?.cintura, " cm")}
          helper={`${tx("Inicial", "Initial")}: ${formatNumber(initial?.cintura, " cm")}`}
          deltaValue={diffCintura}
          deltaSuffix=" cm"
          direction="lower"
          icon={Ruler}
        />
        <StatCard
          title={tx("% grasa", "Fat %")}
          value={formatNumber(current?.porcentaje_grasa, "%")}
          helper={`${tx("Inicial", "Initial")}: ${formatNumber(initial?.porcentaje_grasa, "%")}`}
          deltaValue={diffGrasa}
          deltaSuffix="%"
          direction="lower"
          icon={Percent}
        />
        <StatCard
          title={tx("Masa muscular", "Muscle mass")}
          value={formatNumber(current?.masa_muscular, " kg")}
          helper={`${tx("Inicial", "Initial")}: ${formatNumber(initial?.masa_muscular, " kg")}`}
          deltaValue={diffMasa}
          deltaSuffix=" kg"
          direction="higher"
          icon={Dumbbell}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          title={tx("IMC actual", "Current BMI")}
          value={formatNumber(current?.imc)}
          helper={`${tx("Inicial", "Initial")}: ${formatNumber(initial?.imc)}`}
          deltaValue={diffImc}
          direction="lower"
          icon={Activity}
        />
        <StatCard
          title={tx("Primer registro", "First record")}
          value={formatDate(initial?.fecha)}
          helper={`${formatNumber(initial?.peso, " kg")} · ${formatNumber(initial?.cintura, ` cm ${tx("cintura", "waist")}`)}`}
          icon={CalendarDays}
        />
        <StatCard
          title={tx("Último registro", "Last record")}
          value={formatDate(current?.fecha)}
          helper={`${formatNumber(current?.peso, " kg")} · ${formatNumber(current?.cintura, ` cm ${tx("cintura", "waist")}`)}`}
          icon={CalendarDays}
        />
      </section>

      <EvolucionFisicaBeforeAfterStudio rows={orderedRows} socioNombre={socioNombre} />


      <section className="grid gap-6 xl:grid-cols-2">
        <ChartCard
          title={tx("Peso e IMC", "Weight and BMI")}
          description={tx("Evolución cronológica del peso corporal y del índice de masa corporal.", "Chronological evolution of body weight and body mass index.")}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" />
              <YAxis />
              <Tooltip formatter={tooltipFormatter} />
              <Legend />
              <Line type="monotone" dataKey="peso" name={tx("peso", "weight")} stroke="#02a8e1" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              <Line type="monotone" dataKey="imc" name={tx("imc", "bmi")} stroke="#6d28d9" strokeWidth={2} dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title={tx("Composición corporal", "Body composition")}
          description={tx("Comparación entre porcentaje de grasa y masa muscular.", "Comparison between body fat percentage and muscle mass.")}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" />
              <YAxis />
              <Tooltip formatter={tooltipFormatter} />
              <Legend />
              <Line type="monotone" dataKey="grasa" name={tx("grasa", "fat")} stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              <Line type="monotone" dataKey="masaMuscular" name={tx("masaMuscular", "muscle mass")} stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title={tx("Medidas centrales", "Core measurements")}
          description={tx("Seguimiento de cintura, pecho y cadera para análisis corporal.", "Tracking waist, chest, and hip measurements for body analysis.")}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" />
              <YAxis />
              <Tooltip formatter={tooltipFormatter} />
              <Legend />
              <Line type="monotone" dataKey="cintura" name={tx("cintura", "waist")} stroke="#0f172a" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              <Line type="monotone" dataKey="pecho" name={tx("pecho", "chest")} stroke="#0284c7" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              <Line type="monotone" dataKey="cadera" name={tx("cadera", "hip")} stroke="#db2777" strokeWidth={2} dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <Card className="rounded-2xl border bg-card text-card-foreground shadow-sm">
          <CardHeader className="space-y-1 border-b p-4">
            <h3 className="text-lg font-semibold text-foreground">{tx("Antes vs. ahora", "Before vs. now")}</h3>
            <p className="text-sm text-muted-foreground">
              {tx("Lectura comparativa entre el primer registro y la última medición.", "Comparative reading between the first record and the latest measurement.")}
            </p>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3 md:hidden">
              {comparisonRows.map(([label, initialValue, currentValue, change]) => (
                <div key={`mobile-${label}`} className="rounded-2xl border bg-muted/40 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-foreground">{label}</p>
                    <p className="text-sm font-bold text-[#02a8e1]">{change}</p>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div className="rounded-xl bg-card p-2">
                      <p className="uppercase text-muted-foreground">{tx("Inicial", "Initial")}</p>
                      <p className="mt-1 font-semibold text-foreground">{initialValue}</p>
                    </div>
                    <div className="rounded-xl bg-card p-2">
                      <p className="uppercase text-muted-foreground">{tx("Actual", "Current")}</p>
                      <p className="mt-1 font-semibold text-foreground">{currentValue}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden overflow-hidden rounded-xl border md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">{tx("Métrica", "Metric")}</th>
                    <th className="px-4 py-3">{tx("Inicial", "Initial")}</th>
                    <th className="px-4 py-3">{tx("Actual", "Current")}</th>
                    <th className="px-4 py-3">{tx("Cambio", "Change")}</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map(([label, initialValue, currentValue, change]) => (
                    <tr key={label} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium text-foreground">{label}</td>
                      <td className="px-4 py-3 text-muted-foreground">{initialValue}</td>
                      <td className="px-4 py-3 text-muted-foreground">{currentValue}</td>
                      <td className="px-4 py-3 font-semibold text-foreground">{change}</td>
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