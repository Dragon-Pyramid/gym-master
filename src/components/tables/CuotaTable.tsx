"use client";

import { Pencil } from "lucide-react";
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
import { Cuota } from "@/interfaces/cuota.interface";
import { useAuthStore } from "@/stores/authStore";
import { formatFrontendDate } from "@/utils/dateFormat";
import { useI18n } from "@/i18n/I18nProvider";

function translateFeeDescription(value: string | null | undefined, isEnglish: boolean) {
  if (!value || !isEnglish) return value || "-";

  const monthMap: Record<string, string> = {
    ENERO: "JANUARY",
    FEBRERO: "FEBRUARY",
    MARZO: "MARCH",
    ABRIL: "APRIL",
    MAYO: "MAY",
    JUNIO: "JUNE",
    JULIO: "JULY",
    AGOSTO: "AUGUST",
    SEPTIEMBRE: "SEPTEMBER",
    SETIEMBRE: "SEPTEMBER",
    OCTUBRE: "OCTOBER",
    NOVIEMBRE: "NOVEMBER",
    DICIEMBRE: "DECEMBER",
  };

  return value.replace(
    /\b(ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SEPTIEMBRE|SETIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE)\b/gi,
    (match) => monthMap[match.toUpperCase()] || match,
  );
}

export default function CuotaTable({
  cuotas,
  loading,
  onEdit,
  onView,
  onDelete,
  onToggleActivo,
}: {
  cuotas: Cuota[];
  loading?: boolean;
  onEdit: (cuota: Cuota) => void;
  onView?: (cuota: Cuota) => void;
  onDelete?: (cuota: Cuota) => void;
  onToggleActivo?: (cuota: Cuota) => void;
}) {
  const { user } = useAuthStore();
  const { locale } = useI18n();
  const isEnglish = locale === "en";
  const tx = (es: string, en: string) => (isEnglish ? en : es);
  const userRole = user?.rol;
  const isAdminOnly = userRole === "admin";

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="w-full rounded-md h-9" />
        ))}
      </div>
    );
  }

  if (cuotas.length === 0 && !loading) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        {tx("No hay cuotas registradas aún.", "No fees registered yet.")}
      </div>
    );
  }

  return (
    <Table className="w-full overflow-hidden text-sm border rounded-md border-border dark:border-neutral-800">
      <TableHeader>
        <TableRow className="bg-muted/50 text-muted-foreground dark:bg-neutral-900 dark:text-neutral-300">
          <TableHead>{tx("Descripción", "Description")}</TableHead>
          <TableHead>{tx("Monto", "Amount")}</TableHead>
          <TableHead>{tx("Período", "Period")}</TableHead>
          <TableHead>{tx("Fecha Inicio", "Start date")}</TableHead>
          <TableHead>{tx("Fecha Fin", "End date")}</TableHead>
          <TableHead>{tx("Activo", "Active")}</TableHead>
          <TableHead>{tx("Acciones", "Actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {cuotas.map((c, i) => (
          <TableRow
            key={i}
            className="odd:bg-muted/40 hover:bg-[#a8d9f9] transition-colors dark:odd:bg-neutral-950/70 dark:hover:bg-neutral-900"
          >
            <TableCell className="font-medium">{translateFeeDescription(c.descripcion, isEnglish)}</TableCell>
            <TableCell>${c.monto}</TableCell>
            <TableCell>{c.periodo}</TableCell>
            <TableCell>{formatFrontendDate(c.fecha_inicio)}</TableCell>
            <TableCell>{formatFrontendDate(c.fecha_fin)}</TableCell>
            <TableCell>
              <span
                className={
                  c.activo
                    ? "inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/45 dark:text-emerald-300"
                    : "inline-flex rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-xs font-semibold text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
                }
              >
                {c.activo ? tx("Activa", "Active") : tx("Inactiva", "Inactive")}
              </span>
            </TableCell>
            <TableCell className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onView && onView(c)}
              >
                {tx("Ver", "View")}
              </Button>
              {isAdminOnly && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(c)}
                    title={tx("Editar", "Edit")}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    className={
                      (c.activo
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-green-500 hover:bg-green-600") +
                      " text-white w-[100px]"
                    }
                    onClick={() => onToggleActivo && onToggleActivo(c)}
                  >
                    {c.activo ? tx("Desactivar", "Deactivate") : tx("Activar", "Activate")}
                  </Button>
                  <Button
                    size="sm"
                    className="bg-red-500 hover:bg-red-600 text-white w-[100px]"
                    onClick={() => onDelete && onDelete(c)}
                  >
                    {tx("Eliminar", "Delete")}
                  </Button>
                </>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={6}>{tx("Total de cuotas", "Total fees")}</TableCell>
          <TableCell className="text-right">{cuotas.length}</TableCell>
        </TableRow>
      </TableFooter>
      <TableCaption>{tx("Listado de cuotas registradas.", "Registered fees list.")}</TableCaption>
    </Table>
  );
}
