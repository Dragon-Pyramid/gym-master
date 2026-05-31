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

function getEstadoBadgeClass(estado?: string | null) {
  switch (estado) {
    case "pagado":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "pendiente":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "vencido":
      return "bg-red-50 text-red-700 border-red-200";
    case "anulado":
      return "bg-slate-100 text-slate-600 border-slate-200";
    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
}

function getEstadoLabel(estado?: string | null) {
  if (!estado) return "Sin estado";
  return estado.charAt(0).toUpperCase() + estado.slice(1);
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
        No hay gastos registrados aún.
      </div>
    );
  }

  const total = gastos.reduce((acc, gasto) => acc + Number(gasto.monto ?? 0), 0);

  return (
    <Table className="w-full overflow-hidden rounded-md border border-border text-sm">
      <TableHeader>
        <TableRow className="bg-muted/50 text-muted-foreground">
          <TableHead>Descripción</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Entidad</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Medio</TableHead>
          <TableHead className="text-right">Monto</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead>Vencimiento</TableHead>
          <TableHead>Comprobante</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {gastos.map((g) => (
          <TableRow key={g.id} className="odd:bg-muted/40 transition-colors hover:bg-[#a8d9f9]">
            <TableCell className="max-w-[220px] font-medium">
              <div className="line-clamp-2">{g.descripcion}</div>
              {g.numero_comprobante ? (
                <div className="text-xs text-muted-foreground">Comp.: {g.numero_comprobante}</div>
              ) : null}
            </TableCell>
            <TableCell>{g.tipo_gasto?.nombre ?? "Sin clasificar"}</TableCell>
            <TableCell>{g.proveedor_nombre || g.entidad || "-"}</TableCell>
            <TableCell>
              <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${getEstadoBadgeClass(g.estado)}`}>
                {getEstadoLabel(g.estado)}
              </span>
            </TableCell>
            <TableCell>{g.medio_pago ? g.medio_pago.replace(/_/g, " ") : "-"}</TableCell>
            <TableCell className="text-right font-semibold">{formatCurrencyARS(Number(g.monto ?? 0))}</TableCell>
            <TableCell>{formatFrontendDate(g.fecha)}</TableCell>
            <TableCell>{g.fecha_vencimiento ? formatFrontendDate(g.fecha_vencimiento) : "-"}</TableCell>
            <TableCell>
              {g.comprobante_url ? (
                <Button size="sm" variant="outline" asChild>
                  <a href={g.comprobante_url} target="_blank" rel="noreferrer" title="Abrir comprobante">
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
                  <Button size="sm" variant="outline" onClick={() => onView(g)} title="Ver">
                    <Eye className="h-4 w-4" />
                  </Button>
                ) : null}
                <Button size="sm" variant="outline" onClick={() => onEdit(g)} title="Editar">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  className="bg-red-500 text-white hover:bg-red-600"
                  onClick={() => onDelete && onDelete(g)}
                  title="Anular"
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
          <TableCell colSpan={5}>Total de gastos filtrados</TableCell>
          <TableCell className="text-right font-bold">{formatCurrencyARS(total)}</TableCell>
          <TableCell colSpan={4} className="text-right">
            {gastos.length} registros
          </TableCell>
        </TableRow>
      </TableFooter>
      <TableCaption>Listado de gastos y egresos operativos registrados.</TableCaption>
    </Table>
  );
}
