"use client";

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

export default function EquipamientoViewModal({
  open,
  onClose,
  equipoId,
}: {
  open: boolean;
  onClose: () => void;
  equipoId?: string | null;
}) {
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
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-semibold">
            Detalles de Equipamiento
          </DialogTitle>
          <div className="text-sm text-right text-muted-foreground">
            {new Date().toLocaleString()}
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
                <label className="text-sm font-medium">Nombre</label>
                <div className="p-2 border rounded-md bg-gray-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white">
                  {equipo.nombre}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo</label>
                <div className="p-2 border rounded-md bg-gray-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white">
                  {equipo.tipo}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Marca</label>
                <div className="p-2 border rounded-md bg-gray-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white">
                  {equipo.marca}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Modelo</label>
                <div className="p-2 border rounded-md bg-gray-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white">
                  {equipo.modelo}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Estado</label>
                <div className="p-2 border rounded-md bg-gray-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white">
                  {equipo.estado}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Ubicación</label>
                <div className="p-2 border rounded-md bg-gray-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white">
                  {equipo.ubicacion}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Próxima Revisión</label>
                <div className="p-2 border rounded-md bg-gray-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white">
                  {equipo.proxima_revision}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Observaciones</label>
                <div className="p-2 border rounded-md bg-gray-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white">
                  {equipo.observaciones}
                </div>
              </div>
            </div>
          </div>
          {mantenimientos && mantenimientos.length > 0 && (
            <div className="mt-8">
              <div className="mb-4 text-base font-semibold">
                Historial de Mantenimientos
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
                          Responsable: {m.tecnico_responsable}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Costo: ${m.costo}
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
