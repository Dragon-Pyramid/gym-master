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
import { Aviso } from "@/interfaces/aviso.interface";
import { useI18n } from "@/i18n/I18nProvider";

function translateNoticeType(locale: string, value?: string | null) {
  if (!value) return "-";

  if (locale !== "en") {
    const esTypes: Record<string, string> = {
      general: "General",
      evento: "Evento",
      sistema: "Sistema",
      recordatorio: "Recordatorio",
      promocion: "Promoción",
      promotion: "Promoción",
    };
    return esTypes[value.toLowerCase()] ?? value;
  }

  const enTypes: Record<string, string> = {
    general: "General",
    evento: "Event",
    event: "Event",
    sistema: "System",
    system: "System",
    recordatorio: "Reminder",
    reminder: "Reminder",
    promocion: "Promotion",
    promotion: "Promotion",
  };

  return enTypes[value.toLowerCase()] ?? value;
}

export default function AvisosTable({
  avisos,
  loading,
  onEdit,
  onView,
  onDelete,
}: {
  avisos: Aviso[];
  loading?: boolean;
  onEdit: (aviso: Aviso) => void;
  onView?: (aviso: Aviso) => void;
  onDelete?: (aviso: Aviso) => void;
}) {
  const { locale } = useI18n();
  const c = (es: string, en: string) => (locale === "en" ? en : es);

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="w-full rounded-md h-9" />
        ))}
      </div>
    );
  }

  if (avisos.length === 0 && !loading) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        {c("No hay avisos registrados aún.", "No notices have been registered yet.")}
      </div>
    );
  }

  return (
    <Table className="w-full overflow-hidden text-sm border rounded-md border-slate-200 dark:border-slate-800">
      <TableHeader>
        <TableRow className="bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-200">
          <TableHead>{c("Título", "Title")}</TableHead>
          <TableHead>{c("Mensaje", "Message")}</TableHead>
          <TableHead>{c("Tipo", "Type")}</TableHead>
          <TableHead>{c("Fecha de envío", "Send date")}</TableHead>
          <TableHead>{c("Acciones", "Actions")}</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {avisos.map((a) => (
          <TableRow
            key={a.id}
            className="odd:bg-slate-50 transition-colors hover:bg-sky-100 dark:odd:bg-slate-900/60 dark:hover:bg-sky-950/40"
          >
            <TableCell className="font-medium text-slate-950 dark:text-slate-50">{a.titulo}</TableCell>
            <TableCell className="max-w-[220px] truncate whitespace-nowrap overflow-hidden text-slate-700 dark:text-slate-300">
              {a.mensaje}
            </TableCell>
            <TableCell>{translateNoticeType(locale, a.tipo)}</TableCell>
            <TableCell>{a.fecha_envio}</TableCell>
            <TableCell className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onView && onView(a)}
              >
                {c("Ver", "View")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(a)}
                title={c("Editar", "Edit")}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                className="bg-red-500 hover:bg-red-600 text-white w-[100px]"
                onClick={() => onDelete && onDelete(a)}
              >
                {c("Eliminar", "Delete")}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>

      <TableFooter>
        <TableRow className="bg-slate-50 dark:bg-slate-900">
          <TableCell colSpan={4}>{c("Total de avisos", "Total notices")}</TableCell>
          <TableCell className="text-right">{avisos.length}</TableCell>
        </TableRow>
      </TableFooter>

      <TableCaption>{c("Listado de avisos enviados.", "List of sent notices.")}</TableCaption>
    </Table>
  );
}
