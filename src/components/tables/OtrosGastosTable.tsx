"use client";

import { Eye, Pencil, Trash2, ExternalLink } from "lucide-react";
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
import { OtrosGastos } from "@/interfaces/otros_gastos.interface";
import { formatFrontendDate } from "@/utils/dateFormat";
import { formatCurrencyARS } from "@/lib/comercial/productos";
import { useI18n } from "@/i18n/I18nProvider";
import {
  getOtrosGastosEstadoLabel,
  getOtrosGastosMedioPagoLabel,
  getOtrosGastosTipoLabel,
  translateOtrosGastosDescription,
  translateOtrosGastosUi,
} from "@/utils/otrosGastosI18n";

function getEstadoBadgeClass(estado?: string | null) {
  switch (estado) {
    case "pagado":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:border-emerald-900/70 dark:bg-emerald-950/35 dark:text-emerald-300";
    case "pendiente":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:border-amber-900/70 dark:bg-amber-950/35 dark:text-amber-300";
    case "vencido":
      return "bg-red-50 text-red-700 border-red-200 dark:border-red-900/70 dark:bg-red-950/35 dark:text-red-300";
    case "anulado":
      return "bg-slate-100 text-slate-600 border-slate-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300";
    default:
      return "bg-slate-50 text-slate-600 border-slate-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300";
  }
}



export default function OtrosGastosTable({
  gastos,
  loading,
  onView,
  onEdit,
  onDelete,
}: {
  gastos: OtrosGastos[];
  loading?: boolean;
  onView?: (gasto: OtrosGastos) => void;
  onEdit: (gasto: OtrosGastos) => void;
  onDelete?: (gasto: OtrosGastos) => void;
}) {
  const { locale } = useI18n();
  const c = (text: string) => translateOtrosGastosUi(locale, text);

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-9 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (gastos.length === 0 && !loading) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        {c("No hay gastos registrados aún.")}
      </div>
    );
  }

  const total = gastos.reduce((acc, gasto) => acc + Number(gasto.monto ?? 0), 0);

  return (
    <Table className="w-full overflow-hidden rounded-md border border-border text-sm dark:border-neutral-800">
      <TableHeader>
        <TableRow className="bg-muted/50 text-muted-foreground dark:bg-neutral-900/80 dark:text-neutral-300">
          <TableHead>{c("Descripción")}</TableHead>
          <TableHead>{c("Tipo")}</TableHead>
          <TableHead>{c("Entidad")}</TableHead>
          <TableHead>{c("Estado")}</TableHead>
          <TableHead>{c("Medio")}</TableHead>
          <TableHead className="text-right">{c("Monto")}</TableHead>
          <TableHead>{c("Fecha")}</TableHead>
          <TableHead>{c("Vencimiento")}</TableHead>
          <TableHead>{c("Comprobante")}</TableHead>
          <TableHead>{c("Acciones")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {gastos.map((g) => (
          <TableRow key={g.id} className="odd:bg-muted/40 transition-colors hover:bg-[#a8d9f9] dark:odd:bg-neutral-900/40 dark:hover:bg-neutral-800/80">
            <TableCell className="max-w-[220px] font-medium">
              <div className="line-clamp-2">{translateOtrosGastosDescription(locale, g.descripcion)}</div>
              {g.numero_comprobante ? (
                <div className="text-xs text-muted-foreground">{c("Comp.")}: {g.numero_comprobante}</div>
              ) : null}
            </TableCell>
            <TableCell>{getOtrosGastosTipoLabel(locale, g.tipo_gasto?.nombre)}</TableCell>
            <TableCell>{translateOtrosGastosDescription(locale, g.proveedor_nombre || g.entidad || "-")}</TableCell>
            <TableCell>
              <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${getEstadoBadgeClass(g.estado)}`}>
                {getOtrosGastosEstadoLabel(locale, g.estado)}
              </span>
            </TableCell>
            <TableCell>{getOtrosGastosMedioPagoLabel(locale, g.medio_pago)}</TableCell>
            <TableCell className="text-right font-semibold">{formatCurrencyARS(Number(g.monto ?? 0))}</TableCell>
            <TableCell>{formatFrontendDate(g.fecha)}</TableCell>
            <TableCell>{g.fecha_vencimiento ? formatFrontendDate(g.fecha_vencimiento) : "-"}</TableCell>
            <TableCell>
              {g.comprobante_url ? (
                <Button size="sm" variant="outline" asChild>
                  <a href={g.comprobante_url} target="_blank" rel="noreferrer" title={c("Abrir comprobante")}>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              ) : (
                "-"
              )}
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-2">
                {onView ? (
                  <Button size="sm" variant="outline" onClick={() => onView(g)} title={c("Ver")}>
                    <Eye className="h-4 w-4" />
                  </Button>
                ) : null}
                <Button size="sm" variant="outline" onClick={() => onEdit(g)} title={c("Editar")}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  className="bg-red-500 text-white hover:bg-red-600"
                  onClick={() => onDelete && onDelete(g)}
                  title={c("Anular")}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={5}>{c("Total de gastos filtrados")}</TableCell>
          <TableCell className="text-right font-bold">{formatCurrencyARS(total)}</TableCell>
          <TableCell colSpan={4} className="text-right">
            {gastos.length} {c("registros")}
          </TableCell>
        </TableRow>
      </TableFooter>
      <TableCaption>{c("Listado de gastos y egresos operativos registrados.")}</TableCaption>
    </Table>
  );
}
