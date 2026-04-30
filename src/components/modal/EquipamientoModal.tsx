"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import FechaHora from "@/components/ui/FechaHora";
import EquipamientoForm from "../forms/EquipamientoForm";
import MantenimientoForm from "../forms/MantenimientoForm";
import { Equipamento } from "@/interfaces/equipamiento.interface";
import { getOneEquipamientoById } from "@/services/equipamientoService";

export default function EquipamientoModal({
  open,
  onClose,
  onCreated,
  equipoId,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  equipoId?: string | null;
}) {
  const [equipo, setEquipo] = useState<Equipamento | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [showMantenimiento, setShowMantenimiento] = useState(false);

  React.useEffect(() => {
    if (equipoId) {
      setLoading(true);
      getOneEquipamientoById(equipoId).then((data) => {
        setEquipo(data);
        setLoading(false);
      });
    } else {
      setEquipo(undefined);
    }
  }, [equipoId, open, refresh]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full h-auto max-w-5xl max-h-screen overflow-y-auto lg:h-auto sm:max-w-4xl">
        <DialogHeader>
          <div className="flex items-center justify-between w-full gap-4">
            <DialogTitle className="text-xl font-semibold">
              {equipo ? "Editar Equipamiento" : "Nuevo Equipamiento"}
            </DialogTitle>
            <FechaHora />
          </div>
        </DialogHeader>
        <EquipamientoForm
          initialValues={equipo}
          onSubmit={async () => {
            await onCreated();
            setRefresh((r) => r + 1);
          }}
          onCancel={onClose}
          loading={loading}
        />
        {equipo && (
          <div className="mt-8">
            <Button
              className="mb-4"
              variant="default"
              onClick={() => setShowMantenimiento((v) => !v)}
              type="button"
            >
              {showMantenimiento
                ? "Ocultar formulario de mantenimiento"
                : "Registrar nuevo mantenimiento"}
            </Button>
            {showMantenimiento && (
              <MantenimientoForm
                equipoId={equipo.id}
                onCreated={() => setRefresh((r) => r + 1)}
              />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
