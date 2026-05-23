"use client";

import { Pencil, ReceiptText } from "lucide-react";
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
import { ResponsePago } from "@/interfaces/pago.interface";

function money(value?: number | null) {
  if (value === null || value === undefined) return "-";
  return `$${Number(value).toLocaleString("es-AR")}`;
}

export default function PagoTable({
  pagos,
  loading,
  onEdit,
  onView,
  onDelete,
  onReceipt,
}: {
  pagos: ResponsePago[];
  loading?: boolean;
  onEdit: (pago: ResponsePago) => void;
  onView?: (pago: ResponsePago) => void;
  onDelete?: (pago: ResponsePago) => void;
  onReceipt?: (pago: ResponsePago) => void;
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="w-full rounded-md h-9" />
        ))}
      </div>
    );
  }

  if (pagos.length === 0 && !loading) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        No hay pagos registrados aún.
      </div>
    );
  }

  return (
    <Table className="w-full overflow-hidden text-sm border rounded-md border-border">
      <TableHeader>
        <TableRow className="bg-muted/50 text-muted-foreground">
          <TableHead>Socio</TableHead>
          <TableHead>Cuota</TableHead>
          <TableHead>Fecha Pago</TableHead>
          <TableHead>Cobertura</TableHead>
          <TableHead>Método</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Monto</TableHead>
          <TableHead>Registrado Por</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pagos.map((p) => (
          <TableRow
            key={p.id}
            className="odd:bg-muted/40 hover:bg-[#a8d9f9] transition-colors"
          >
            <TableCell className="font-medium">
              {p.socio?.nombre_completo ?? "-"}
            </TableCell>
            <TableCell>{p.cuota?.descripcion ?? "-"}</TableCell>
            <TableCell>{p.fecha_pago}</TableCell>
            <TableCell>
              <div className="flex flex-col text-xs">
                <span>{p.periodo_desde ?? p.fecha_pago}</span>
                <span>hasta {p.periodo_hasta ?? p.fecha_vencimiento}</span>
                <span>{p.meses_cubiertos ?? 1} mes/es</span>
              </div>
            </TableCell>
            <TableCell className="capitalize">{p.metodo_pago ?? "-"}</TableCell>
            <TableCell className="capitalize">{p.estado ?? "-"}</TableCell>
            <TableCell>{money(p.monto_pagado)}</TableCell>
            <TableCell>{p.registrado_por?.nombre ?? "-"}</TableCell>
            <TableCell className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onView && onView(p)}
              >
                Ver
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReceipt && onReceipt(p)}
                title="Descargar recibo PDF"
              >
                <ReceiptText className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(p)}
                title="Editar"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                className="bg-red-500 hover:bg-red-600 text-white w-[100px]"
                onClick={() => onDelete && onDelete(p)}
              >
                Eliminar
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={8}>Total de pagos</TableCell>
          <TableCell className="text-right">{pagos.length}</TableCell>
        </TableRow>
      </TableFooter>
      <TableCaption>Listado de pagos registrados.</TableCaption>
    </Table>
  );
}
