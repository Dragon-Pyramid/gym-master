"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ProveedorForm from "../forms/ProveedorForm";
import FechaHora from "@/components/ui/FechaHora";
import { Proveedor } from "@/interfaces/proveedor.interface";

export default function ProveedorModal({
  open,
  onClose,
  onCreated,
  proveedor,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  proveedor?: Proveedor | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-5xl sm:max-w-4xl">
        <DialogHeader>
          <div className="flex gap-4 justify-between items-center w-full">
            <DialogTitle>
              {proveedor ? "Editar Proveedor" : "Nuevo Proveedor"}
            </DialogTitle>
            <FechaHora />
          </div>
        </DialogHeader>
        <ProveedorForm
          proveedor={proveedor}
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
