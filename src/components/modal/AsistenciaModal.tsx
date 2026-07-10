"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AsistenciaForm from "../forms/AsistenciaForm";
import FechaHora from "@/components/ui/FechaHora";
import { Asistencia } from "@/interfaces/asistencia.interface";
import { useI18n } from "@/i18n/I18nProvider";

export default function AsistenciaModal({
  open,
  onClose,
  onCreated,
  asistencia,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  asistencia?: Asistencia | null;
}) {
  const { locale } = useI18n();
  const isEnglish = locale === "en";
  const attendanceText = (es: string, en: string) => (isEnglish ? en : es);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-5xl sm:max-w-4xl">
        <QaFileNameBadge file="src/components/modal/AsistenciaModal.tsx" />
        <DialogHeader>
          <div className="flex gap-4 justify-between items-center w-full">
            <DialogTitle>
              {asistencia
                ? attendanceText("Editar Asistencia", "Edit attendance")
                : attendanceText("Nueva Asistencia", "New attendance")}
            </DialogTitle>
            <FechaHora />
          </div>
        </DialogHeader>
        <AsistenciaForm
          asistencia={asistencia}
          onCreated={async () => {
            await onCreated();
            onClose();
          }}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
