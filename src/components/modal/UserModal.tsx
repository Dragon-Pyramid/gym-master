"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import UserForm from "../forms/UserForm";
import FechaHora from "@/components/ui/FechaHora";
import { Usuario } from "@/interfaces/usuario.interface";

export default function UserModal({
  open,
  onClose,
  onCreated,
  usuario,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  usuario?: Usuario | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-5xl sm:max-w-4xl">
        <DialogHeader>
          <div className="flex gap-4 justify-between items-center w-full">
            <DialogTitle>
              {usuario ? "Editar Usuario" : "Nuevo Usuario"}{" "}
            </DialogTitle>
            <FechaHora />
          </div>
        </DialogHeader>
        <UserForm
          usuario={usuario}
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
