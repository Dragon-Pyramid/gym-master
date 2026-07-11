"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Equipamento } from "@/interfaces/equipamiento.interface";
import { Mantenimiento } from "@/interfaces/mantenimiento.interface";
import { getOneEquipamientoById } from "@/services/equipamientoService";
import { getMantenimientoByIdEquipamiento } from "@/services/mantenimientoService";
import { formatFrontendDateTime, formatFrontendDate } from '@/utils/dateFormat';
import { useI18n } from "@/i18n/I18nProvider";

export default function EquipamientoViewModal({
  open,
  onClose,
  equipoId,
}: {
  open: boolean;
  onClose: () => void;
  equipoId?: string | null;
}) {
  const { locale } = useI18n();
  const isEnglish = locale === "en";
  const tx = (es: string, en: string) => (isEnglish ? en : es);
  const translateStatus = (value?: string | null) => {
    switch (String(value ?? "").toLowerCase()) {
      case "operativo":
        return tx("operativo", "operational");
      case "en mantenimiento":
        return tx("en mantenimiento", "under maintenance");
      case "fuera de servicio":
        return tx("fuera de servicio", "out of service");
      default:
        return String(value ?? "");
    }
  };

  const [equipo, setEquipo] = useState<Equipamento | null>(null);
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);

  useEffect(() => {
    if (open && equipoId) {
      getOneEquipamientoById(equipoId).then((data) => {
        setEquipo(data);
      });
      getMantenimientoByIdEquipamiento(equipoId).then((data) => {
        setMantenimientos(data);
      });
    } else {
      setEquipo(null);
      setMantenimientos([]);
    }
  }, [equipoId, open]);

  if (!equipo) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!max-w-[90vw] sm:!max-w-[800px] !w-full !max-h-[85vh] flex flex-col">
        <QaFileNameBadge file="src/components/modal/EquipamientoViewModal.tsx" />
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-semibold">
            {tx("Detalles de Equipamiento", "Equipment details")}
          </DialogTitle>
          <div className="text-sm text-right text-muted-foreground">
            {formatFrontendDateTime(new Date())}
          </div>
        </DialogHeader>
        <div className="flex-1 min-h-0 pr-1 overflow-y-auto">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">ID</label>
                <div className="p-2 border rounded-md bg-gray-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white">
                  {equipo.id}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{tx("Nombre", "Name")}</label>
                <div className="p-2 border rounded-md bg-gray-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white">
                  {equipo.nombre}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{tx("Tipo", "Type")}</label>
                <div className="p-2 border rounded-md bg-gray-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white">
                  {equipo.tipo}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{tx("Marca", "Brand")}</label>
                <div className="p-2 border rounded-md bg-gray-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white">
                  {equipo.marca}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{tx("Modelo", "Model")}</label>
                <div className="p-2 border rounded-md bg-gray-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white">
                  {equipo.modelo}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{tx("Estado", "Status")}</label>
                <div className="p-2 border rounded-md bg-gray-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white">
                  {translateStatus(equipo.estado)}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{tx("Ubicación", "Location")}</label>
                <div className="p-2 border rounded-md bg-gray-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white">
                  {equipo.ubicacion}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{tx("Próxima Revisión", "Next review")}</label>
                <div className="p-2 border rounded-md bg-gray-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white">
                  {equipo.proxima_revision}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{tx("Observaciones", "Notes")}</label>
                <div className="p-2 border rounded-md bg-gray-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white">
                  {equipo.observaciones}
                </div>
              </div>
            </div>
          </div>
          {mantenimientos && mantenimientos.length > 0 && (
            <div className="mt-8">
              <div className="mb-4 text-base font-semibold">
                {tx("Historial de Mantenimientos", "Maintenance history")}
              </div>
              <div className="p-4 overflow-y-auto border rounded-lg bg-gray-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white max-h-40">
                <div className="relative pl-6 space-y-4 border-l-2 border-blue-300 dark:border-blue-700">
                  {mantenimientos.map((m) => (
                    <div key={m.id} className="flex items-start gap-4">
                      <div className="w-3 h-3 rounded-full bg-blue-500 dark:bg-blue-400 mt-1.5 -ml-8 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">
                          {m.fecha_mantenimiento} - {m.tipo_mantenimiento}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {tx("Responsable", "Responsible")}: {m.tecnico_responsable}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {tx("Costo", "Cost")}: ${m.costo}
                        </div>
                        <div className="text-xs break-words text-muted-foreground">
                          {m.observaciones}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
