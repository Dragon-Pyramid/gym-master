"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import { EvolucionSocio } from "@/interfaces/evolucionSocio.interface";
import { getEvolucionesFisicas } from "@/services/evolucionSocioClient";
import { formatFrontendDate } from '@/utils/dateFormat';
import { useI18n } from "@/i18n/I18nProvider";

const formatDate = (value?: string | Date | null) => {
  if (!value) return "-";

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : formatFrontendDate(value);
};

const formatNumber = (value?: number | null, suffix = "") => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "-";
  }

  return `${Number(value).toLocaleString("es-AR", {
    maximumFractionDigits: 2,
  })}${suffix}`;
};

const getRowKey = (row: EvolucionSocio, index: number) =>
  row.id || row.id_evolucion || `${row.socio_id}-${row.fecha}-${index}`;

const translateBodyType = (value: string | null | undefined, tx: (es: string, en: string) => string) => {
  if (!value) return "-";
  const normalized = value.trim().toLowerCase();
  const map: Record<string, string> = {
    mesomorfo: "Mesomorph",
    endomorfo: "Endomorph",
    ectomorfo: "Ectomorph",
  };
  return tx(value, map[normalized] ?? value);
};


const translateObservation = (
  value: string | null | undefined,
  tx: (es: string, en: string) => string
) => {
  if (!value?.trim()) return "";
  const translated = value
    .replace(
      "Registro actual con mejora notable:",
      "Current record with notable improvement:"
    )
    .replace(
      "reducción importante de grasa y cintura",
      "significant reduction in fat and waist"
    )
    .replace("aumento de masa muscular", "increased muscle mass")
    .replace(
      "mayor desarrollo de pecho, hombros, brazos, muslos y pantorrillas",
      "greater development in chest, shoulders, arms, thighs, and calves"
    )
    .replace("Registro inicial histórico.", "Historical initial record.")
    .replace(
      "Punto de partida con medidas base para comparar la evolución física del socio.",
      "Starting point with baseline measurements to compare the member's physical evolution."
    )
    .replace(
      "Punto de partida con mediciones base para comparar la evolución física del socio.",
      "Starting point with baseline measurements to compare the member's physical evolution."
    )
    .replace(
      "Punto de partida con medidas base para comparación.",
      "Starting point with baseline measurements for comparison."
    )
    .replace(
      "Punto de partida con mediciones base para comparación.",
      "Starting point with baseline measurements for comparison."
    )
    .replace("Punto de partida", "Starting point");
  return tx(value, translated);
};

export default function EvolucionSocioTable({
  socioId = "me",
  refreshKey = 0,
  searchTerm,
  onDataChange,
  onLoadedDataChange,
  onView,
}: {
  socioId?: string;
  refreshKey?: number;
  searchTerm?: string;
  onDataChange?: (rows: EvolucionSocio[]) => void;
  onLoadedDataChange?: (rows: EvolucionSocio[]) => void;
  onView?: (evolucion: EvolucionSocio) => void;
}) {
  const { locale } = useI18n();
  const isEnglish = locale === "en";
  const tx = (es: string, en: string) => (isEnglish ? en : es);
  const [evoluciones, setEvoluciones] = useState<EvolucionSocio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await getEvolucionesFisicas(socioId);
      setEvoluciones(res.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : tx("Error al cargar evoluciones", "Error loading evolution records"));
      setEvoluciones([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await getEvolucionesFisicas(socioId);
        if (mounted) setEvoluciones(res.data);
      } catch (e: unknown) {
        if (mounted) {
          setError(e instanceof Error ? e.message : tx("Error al cargar evoluciones", "Error loading evolution records"));
          setEvoluciones([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [socioId, refreshKey]);

  useEffect(() => {
    onLoadedDataChange?.(evoluciones);
  }, [evoluciones, onLoadedDataChange]);

  const filtered = useMemo(() => {
    if (!searchTerm?.trim()) return evoluciones;

    const q = searchTerm.toLowerCase();

    return evoluciones.filter((e) =>
      [
        e.fecha,
        e.peso,
        e.altura,
        e.imc,
        e.cintura,
        e.pecho,
        e.cadera,
        e.porcentaje_grasa,
        e.masa_muscular,
        e.tipo_corporal,
        e.sexo_referencia,
        e.observaciones,
      ]
        .filter((value) => value !== null && value !== undefined)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [searchTerm, evoluciones]);

  useEffect(() => {
    onDataChange?.(filtered);
  }, [filtered, onDataChange]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-9 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-6 text-center text-red-600">
        {error}
        <div className="mt-4">
          <Button variant="outline" onClick={loadData}>
            {tx("Reintentar", "Retry")}
          </Button>
        </div>
      </div>
    );
  }

  if (evoluciones.length === 0) {
    return (
      <div className="rounded-md border border-dashed py-12 text-center text-muted-foreground">
        {tx("No hay evoluciones registradas para este socio.", "There are no evolution records for this member.")}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="rounded-md border border-dashed py-10 text-center text-muted-foreground">
        {tx("No hay resultados para la búsqueda actual.", "There are no results for the current search.")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 md:hidden">
        {filtered.map((e, i) => (
          <article
            key={`mobile-${getRowKey(e, i)}`}
            className="rounded-2xl border bg-card p-4 text-card-foreground shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#02a8e1]">
                  {e.es_registro_inicial ? tx("Registro inicial", "Initial record") : tx("Medición", "Measurement")}
                </p>
                <h3 className="mt-1 text-lg font-bold text-foreground">
                  {formatDate(e.fecha)}
                </h3>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onView?.(e)}
                className="shrink-0 border-[#02a8e1] text-[#02a8e1]"
              >
                <Eye className="mr-1 h-4 w-4" />
                {tx("Ver", "View")}
              </Button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl bg-muted/40 p-3">
                <p className="text-[11px] uppercase text-muted-foreground">{tx("Peso", "Weight")}</p>
                <p className="font-bold text-foreground">{formatNumber(e.peso, " kg")}</p>
              </div>
              <div className="rounded-xl bg-muted/40 p-3">
                <p className="text-[11px] uppercase text-muted-foreground">{tx("IMC", "BMI")}</p>
                <p className="font-bold text-foreground">{formatNumber(e.imc)}</p>
              </div>
              <div className="rounded-xl bg-muted/40 p-3">
                <p className="text-[11px] uppercase text-muted-foreground">{tx("Cintura", "Waist")}</p>
                <p className="font-bold text-foreground">{formatNumber(e.cintura, " cm")}</p>
              </div>
              <div className="rounded-xl bg-muted/40 p-3">
                <p className="text-[11px] uppercase text-muted-foreground">{tx("Masa muscular", "Muscle mass")}</p>
                <p className="font-bold text-foreground">{formatNumber(e.masa_muscular, " kg")}</p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="rounded-full bg-muted px-2.5 py-1">
                Grasa: {formatNumber(e.porcentaje_grasa, "%")}
              </span>
              <span className="rounded-full bg-muted px-2.5 py-1">
                {tx("Tipo", "Type")}: {translateBodyType(e.tipo_corporal, tx)}
              </span>
            </div>

            {e.observaciones ? (
              <p className="mt-3 rounded-xl border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
                {translateObservation(e.observaciones, tx)}
              </p>
            ) : null}
          </article>
        ))}

        <p className="text-center text-xs text-muted-foreground">
          {filtered.length} {tx(filtered.length === 1 ? "registro de evolución física." : "registros de evolución física.", filtered.length === 1 ? "physical evolution record." : "physical evolution records.")}
        </p>
      </div>

      <div className="hidden overflow-x-auto rounded-md border md:block">
        <Table className="w-full min-w-[1120px] overflow-hidden text-sm">
          <TableHeader>
            <TableRow className="bg-muted/50 text-muted-foreground">
              <TableHead>{tx("Fecha", "Date")}</TableHead>
              <TableHead>{tx("Peso", "Weight")}</TableHead>
              <TableHead>{tx("Altura", "Height")}</TableHead>
              <TableHead>{tx("IMC", "BMI")}</TableHead>
              <TableHead>{tx("Cintura", "Waist")}</TableHead>
              <TableHead>{tx("Pecho", "Chest")}</TableHead>
              <TableHead>{tx("Cadera", "Hip")}</TableHead>
              <TableHead>{tx("% Grasa", "Fat %")}</TableHead>
              <TableHead>{tx("Masa muscular", "Muscle mass")}</TableHead>
              <TableHead>{tx("Tipo", "Type")}</TableHead>
              <TableHead>{tx("Inicial", "Initial")}</TableHead>
              <TableHead>{tx("Observaciones", "Notes")}</TableHead>
              <TableHead>{tx("Acciones", "Actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((e, i) => (
              <TableRow
                key={getRowKey(e, i)}
                className="odd:bg-muted/40 transition-colors hover:bg-[#a8d9f9]/60 dark:hover:bg-sky-950/60"
              >
                <TableCell>{formatDate(e.fecha)}</TableCell>
                <TableCell>{formatNumber(e.peso, " kg")}</TableCell>
                <TableCell>{formatNumber(e.altura, " cm")}</TableCell>
                <TableCell>{formatNumber(e.imc)}</TableCell>
                <TableCell>{formatNumber(e.cintura, " cm")}</TableCell>
                <TableCell>{formatNumber(e.pecho, " cm")}</TableCell>
                <TableCell>{formatNumber(e.cadera, " cm")}</TableCell>
                <TableCell>{formatNumber(e.porcentaje_grasa, "%")}</TableCell>
                <TableCell>{formatNumber(e.masa_muscular, " kg")}</TableCell>
                <TableCell className="capitalize">{translateBodyType(e.tipo_corporal, tx)}</TableCell>
                <TableCell>{e.es_registro_inicial ? tx("Sí", "Yes") : tx("No", "No")}</TableCell>
                <TableCell className="max-w-[220px] truncate" title={translateObservation(e.observaciones, tx) || ""}>
                  {translateObservation(e.observaciones, tx) || "-"}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onView?.(e)}
                    className="flex items-center gap-1"
                  >
                    <Eye className="h-4 w-4" />
                    {tx("Ver", "View")}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={12}>{tx("Total de registros", "Total records")}</TableCell>
              <TableCell className="text-right">{filtered.length}</TableCell>
            </TableRow>
          </TableFooter>
          <TableCaption>{tx("Historial de evolución física del socio.", "Member physical evolution history.")}</TableCaption>
        </Table>
      </div>
    </div>
  );
}
