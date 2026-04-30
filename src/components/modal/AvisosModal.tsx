"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AvisosForm from "../forms/AvisosForm";

export default function AvisosModal({
  open,
  onClose,
  onCreated,
  aviso,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  aviso?: any | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-5xl sm:max-w-4xl">
        <DialogHeader>
          <div className="flex items-center justify-between w-full gap-4">
            <DialogTitle>{aviso ? "Editar Aviso" : "Nuevo Aviso"}</DialogTitle>
          </div>
        </DialogHeader>
        <AvisosForm />
      </DialogContent>
    </Dialog>
  );
}
