"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import SocioForm from "../forms/SocioForm";
import FechaHora from "@/components/ui/FechaHora";

export default function SocioModal({
  open,
  onClose,
  onCreated,
  socio,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  socio?: any | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-5xl sm:max-w-4xl">
        <DialogHeader>
          <div className="flex gap-4 justify-between items-center w-full">
            <DialogTitle>
              {socio ? "Editar Socio" : "Nuevo Socio"}
            </DialogTitle>
            <FechaHora />
          </div>
        </DialogHeader>
        <SocioForm
          socio={socio}
          onCreated={async () => {
            await onCreated();
            onClose();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
