"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Asistencia } from "@/interfaces/asistencia.interface";
import { useI18n } from "@/i18n/I18nProvider";

export default function AsistenciaViewModal({
  open,
  onClose,
  asistencia,
}: {
  open: boolean;
  onClose: () => void;
  asistencia?: Asistencia | null;
}) {
  const { locale } = useI18n();
  const isEnglish = locale === "en";
  const attendanceText = (es: string, en: string) => (isEnglish ? en : es);

  if (!open || !asistencia) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-lg p-6 sm:max-w-md bg-background text-foreground">
        <QaFileNameBadge file="src/components/modal/AsistenciaViewModal.tsx" />
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {attendanceText("Detalles de Asistencia", "Attendance details")}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-3">
          <p className="text-foreground">
            <strong>{attendanceText("ID Asistencia", "Attendance ID")}:</strong> {asistencia.id}
          </p>
          <p className="text-foreground">
            <strong>{attendanceText("ID Socio", "Member ID")}:</strong> {asistencia.socio_id}
          </p>
          <p className="text-foreground">
            <strong>{attendanceText("Fecha", "Date")}:</strong> {asistencia.fecha}
          </p>
          <p className="text-foreground">
            <strong>{attendanceText("Hora Ingreso", "Check-in time")}:</strong> {asistencia.hora_ingreso}
          </p>
          <p className="text-foreground">
            <strong>{attendanceText("Hora Egreso", "Check-out time")}:</strong> {asistencia.hora_egreso || "-"}
          </p>
        </div>
        <div className="flex justify-end mt-6">
          <Button onClick={onClose}>{attendanceText("Cerrar", "Close")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
