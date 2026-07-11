"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import RutinasForm from "../forms/RutinasForm";
import FechaHora from "@/components/ui/FechaHora";
import { Objetivo } from "@/interfaces/objetivo.interface";
import { Nivel } from "@/interfaces/niveles.interface";
import { useI18n } from "@/i18n/I18nProvider";

export default function RutinaModal({
  open,
  onClose,
  onCreated,
  rutina,
  objetivos,
  niveles,
  targetSocioId,
  targetSocioName,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void | Promise<void>;
  rutina?: any | null;
  objetivos: Objetivo[];
  niveles: Nivel[];
  targetSocioId?: string;
  targetSocioName?: string;
}) {
  const { locale } = useI18n();
  const isEnglish = locale === "en";
  const tx = (es: string, en: string) => (isEnglish ? en : es);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-5xl sm:max-w-4xl">
        <QaFileNameBadge file="src/components/modal/RutinaModal.tsx" />
        <DialogHeader>
          <div className="flex items-center justify-between w-full gap-4">
            <DialogTitle>
              {rutina ? tx("Editar Rutina", "Edit routine") : tx("Generar Nueva Rutina", "Generate new routine")}
            </DialogTitle>
            <FechaHora />
          </div>
        </DialogHeader>
        <RutinasForm
          initialValues={rutina}
          onSubmit={async () => {
            await onCreated();
            onClose();
          }}
          objetivos={objetivos}
          niveles={niveles}
          targetSocioId={targetSocioId}
          targetSocioName={targetSocioName}
        />
      </DialogContent>
    </Dialog>
  );
}
