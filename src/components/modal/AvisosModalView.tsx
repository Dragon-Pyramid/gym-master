"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Aviso } from "@/interfaces/aviso.interface";
import { formatFrontendDateTime } from "@/utils/dateFormat";
import { useI18n } from "@/i18n/I18nProvider";

export default function AvisosModalView({
  open,
  onClose,
  aviso,
}: {
  open: boolean;
  onClose: () => void;
  aviso?: Aviso | null;
}) {
  const { locale } = useI18n();
  const c = (es: string, en: string) => (locale === "en" ? en : es);

  if (!aviso) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!max-w-[90vw] sm:!max-w-[800px] !w-full border-slate-200 bg-white text-slate-950 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50">
        <QaFileNameBadge file="src/components/modal/AvisosModalView.tsx" />
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            {c("Detalle del aviso", "Notice details")}
          </DialogTitle>
          <div className="text-sm text-right text-muted-foreground">
            {formatFrontendDateTime(new Date())}
          </div>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-6 mt-4 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{c("Asunto", "Subject")}</label>
              <div className="p-2 border rounded-md border-slate-200 bg-slate-50 text-foreground dark:border-slate-700 dark:bg-slate-950">
                {aviso.titulo || "-"}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{c("Fecha de envío", "Send date")}</label>
              <div className="p-2 border rounded-md border-slate-200 bg-slate-50 text-foreground dark:border-slate-700 dark:bg-slate-950">
                {aviso.fecha_envio || "-"}
              </div>
            </div>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">{c("Mensaje", "Message")}</label>
            <div className="p-2 break-words whitespace-pre-line border rounded-md border-slate-200 bg-slate-50 text-foreground dark:border-slate-700 dark:bg-slate-950">
              {aviso.mensaje || "-"}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
