"use client";

import { LogOut, Pencil } from "lucide-react";
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
import { Asistencia } from "@/interfaces/asistencia.interface";
import { useI18n } from "@/i18n/I18nProvider";

export default function AsistenciaTable({
  asistencias,
  loading,
  onEdit,
  onView,
  onDelete,
  onRegisterExit,
  totalAsistencias,
}: {
  asistencias: Asistencia[];
  loading?: boolean;
  onEdit: (asistencia: Asistencia) => void;
  onView?: (asistencia: Asistencia) => void;
  onDelete?: (asistencia: Asistencia) => void | Promise<void>;
  onRegisterExit?: (asistencia: Asistencia) => void | Promise<void>;
  totalAsistencias?: number;
}) {
  const { locale } = useI18n();
  const isEnglish = locale === "en";
  const attendanceText = (es: string, en: string) => (isEnglish ? en : es);

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="w-full rounded-md h-9" />
        ))}
      </div>
    );
  }

  if (asistencias.length === 0 && !loading) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        {attendanceText("No hay asistencias registradas aún.", "No attendances registered yet.")}
      </div>
    );
  }

  return (
    <Table className="w-full overflow-hidden text-sm border rounded-md border-border">
      <TableHeader>
        <TableRow className="bg-muted/50 text-muted-foreground">
          <TableHead>{attendanceText("Nombre de Socio", "Member name")}</TableHead>
          <TableHead>{attendanceText("Fecha", "Date")}</TableHead>
          <TableHead>{attendanceText("Hora Ingreso", "Check-in time")}</TableHead>
          <TableHead>{attendanceText("Hora Egreso", "Check-out time")}</TableHead>
          <TableHead>{attendanceText("Acciones", "Actions")}</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {asistencias.map((a, i) => (
          <TableRow
            key={a.id || i}
            className="odd:bg-muted/40 hover:bg-[#a8d9f9] transition-colors"
          >
            <TableCell>
              {"socio" in a && a.socio && a.socio.nombre_completo
                ? a.socio.nombre_completo
                : a.socio_id}
            </TableCell>
            <TableCell>{a.fecha}</TableCell>
            <TableCell>{a.hora_ingreso}</TableCell>
            <TableCell>{a.hora_egreso || "-"}</TableCell>
            <TableCell className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onView && onView(a)}
              >{attendanceText("Ver", "View")}</Button>
              {!a.hora_egreso && onRegisterExit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onRegisterExit(a)}
                  title={attendanceText("Registrar salida", "Register exit")}
                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(a)}
                title="Editar"
              >
                <Pencil className="w-4 h-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>

      <TableFooter>
        <TableRow>
          <TableCell colSpan={4}>{attendanceText("Total de asistencias", "Total attendances")}</TableCell>
          <TableCell className="text-right">
            {totalAsistencias ?? asistencias.length}
          </TableCell>
        </TableRow>
      </TableFooter>

      <TableCaption>{attendanceText("Listado de asistencias registradas.", "Registered attendance list.")}</TableCaption>
    </Table>
  );
}
