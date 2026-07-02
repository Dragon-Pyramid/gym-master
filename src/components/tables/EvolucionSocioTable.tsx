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
      setError(e instanceof Error ? e.message : "Error al cargar evoluciones");
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
          setError(e instanceof Error ? e.message : "Error al cargar evoluciones");
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
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  if (evoluciones.length === 0) {
    return (
      <div className="rounded-md border border-dashed py-12 text-center text-muted-foreground">
        No hay evoluciones registradas para este socio.
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="rounded-md border border-dashed py-10 text-center text-muted-foreground">
        No hay resultados para la búsqueda actual.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 md:hidden">
        {filtered.map((e, i) => (
          <article
            key={`mobile-${getRowKey(e, i)}`}
            className="rounded-2xl border bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#02a8e1]">
                  {e.es_registro_inicial ? "Registro inicial" : "Medición"}
                </p>
                <h3 className="mt-1 text-lg font-bold text-gray-950">
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
                Ver
              </Button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] uppercase text-gray-500">Peso</p>
                <p className="font-bold text-gray-950">{formatNumber(e.peso, " kg")}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] uppercase text-gray-500">IMC</p>
                <p className="font-bold text-gray-950">{formatNumber(e.imc)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] uppercase text-gray-500">Cintura</p>
                <p className="font-bold text-gray-950">{formatNumber(e.cintura, " cm")}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] uppercase text-gray-500">Masa muscular</p>
                <p className="font-bold text-gray-950">{formatNumber(e.masa_muscular, " kg")}</p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
              <span className="rounded-full bg-slate-100 px-2.5 py-1">
                Grasa: {formatNumber(e.porcentaje_grasa, "%")}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1">
                Tipo: {e.tipo_corporal || "-"}
              </span>
            </div>

            {e.observaciones ? (
              <p className="mt-3 rounded-xl border bg-slate-50 p-3 text-xs leading-relaxed text-gray-600">
                {e.observaciones}
              </p>
            ) : null}
          </article>
        ))}

        <p className="text-center text-xs text-muted-foreground">
          {filtered.length} registro{filtered.length === 1 ? "" : "s"} de evolución física.
        </p>
      </div>

      <div className="hidden overflow-x-auto rounded-md border md:block">
        <Table className="w-full min-w-[1120px] overflow-hidden text-sm">
          <TableHeader>
            <TableRow className="bg-muted/50 text-muted-foreground">
              <TableHead>Fecha</TableHead>
              <TableHead>Peso</TableHead>
              <TableHead>Altura</TableHead>
              <TableHead>IMC</TableHead>
              <TableHead>Cintura</TableHead>
              <TableHead>Pecho</TableHead>
              <TableHead>Cadera</TableHead>
              <TableHead>% Grasa</TableHead>
              <TableHead>Masa muscular</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Inicial</TableHead>
              <TableHead>Observaciones</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((e, i) => (
              <TableRow
                key={getRowKey(e, i)}
                className="odd:bg-muted/40 transition-colors hover:bg-[#a8d9f9]"
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
                <TableCell className="capitalize">{e.tipo_corporal || "-"}</TableCell>
                <TableCell>{e.es_registro_inicial ? "Sí" : "No"}</TableCell>
                <TableCell className="max-w-[220px] truncate" title={e.observaciones || ""}>
                  {e.observaciones || "-"}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onView?.(e)}
                    className="flex items-center gap-1"
                  >
                    <Eye className="h-4 w-4" />
                    Ver
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={12}>Total de registros</TableCell>
              <TableCell className="text-right">{filtered.length}</TableCell>
            </TableRow>
          </TableFooter>
          <TableCaption>Historial de evolución física del socio.</TableCaption>
        </Table>
      </div>
    </div>
  );
}
