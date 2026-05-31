'use client';

import { QaFileNameBadge } from '@/components/qa/QaFileNameBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import FechaHora from '@/components/ui/FechaHora';
import { Producto } from '@/interfaces/producto.interface';
import { Proveedor } from '@/interfaces/proveedor.interface';
import CompraForm from '../forms/CompraForm';

export default function CompraModal({
  open,
  onClose,
  onCreated,
  proveedores,
  productos,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  proveedores: Proveedor[];
  productos: Producto[];
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-6xl sm:max-w-5xl">
        <QaFileNameBadge file="src/components/modal/CompraModal.tsx" />
        <DialogHeader>
          <div className="flex w-full items-center justify-between gap-4">
            <DialogTitle>Nueva compra / reposición</DialogTitle>
            <FechaHora />
          </div>
        </DialogHeader>
        <CompraForm
          proveedores={proveedores}
          productos={productos}
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
