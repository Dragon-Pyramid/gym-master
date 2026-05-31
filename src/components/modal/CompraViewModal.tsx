'use client';

import { QaFileNameBadge } from '@/components/qa/QaFileNameBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import FechaHora from '@/components/ui/FechaHora';
import { Compra } from '@/interfaces/compra.interface';
import { formatCurrencyARS } from '@/lib/comercial/productos';
import { formatFrontendDate } from '@/utils/dateFormat';

function estadoLabel(estado?: string | null) {
  if (estado === 'pagada') return 'Pagada / recibida';
  if (estado === 'pendiente') return 'Pendiente';
  if (estado === 'anulada') return 'Anulada';
  return 'Sin estado';
}

export default function CompraViewModal({
  open,
  onClose,
  compra,
}: {
  open: boolean;
  onClose: () => void;
  compra?: Compra | null;
}) {
  if (!compra) return null;
  const detalles = compra.compra_detalle ?? compra.detalles ?? [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-5xl sm:max-w-4xl">
        <QaFileNameBadge file="src/components/modal/CompraViewModal.tsx" />
        <DialogHeader>
          <div className="flex w-full items-center justify-between gap-4">
            <DialogTitle>Detalle de compra</DialogTitle>
            <FechaHora />
          </div>
        </DialogHeader>

        <div className="space-y-5">
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Proveedor</p>
              <div className="rounded-md border bg-muted px-3 py-2 text-sm">
                {compra.proveedor?.nombre ?? 'Proveedor no encontrado'}
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Fecha</p>
              <div className="rounded-md border bg-muted px-3 py-2 text-sm">{formatFrontendDate(compra.fecha)}</div>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Estado</p>
              <div className="rounded-md border bg-muted px-3 py-2 text-sm">{estadoLabel(compra.estado)}</div>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Medio de pago</p>
              <div className="rounded-md border bg-muted px-3 py-2 text-sm">{compra.medio_pago}</div>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Comprobante</p>
              <div className="rounded-md border bg-muted px-3 py-2 text-sm">{compra.numero_comprobante || '-'}</div>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Total</p>
              <div className="rounded-md border bg-muted px-3 py-2 text-sm font-semibold">{formatCurrencyARS(compra.total)}</div>
            </div>
          </section>

          {compra.observaciones && (
            <div className="rounded-xl border bg-muted/30 p-3 text-sm">
              <p className="mb-1 font-semibold">Observaciones</p>
              <p className="text-muted-foreground">{compra.observaciones}</p>
            </div>
          )}

          <section className="rounded-xl border p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">Productos comprados</h3>
              <span className="text-sm text-muted-foreground">{detalles.length} ítems</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-muted/60 text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">Producto</th>
                    <th className="px-3 py-2 text-right">Cantidad</th>
                    <th className="px-3 py-2 text-right">Costo unitario</th>
                    <th className="px-3 py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {detalles.map((detalle) => (
                    <tr key={detalle.id} className="border-t">
                      <td className="px-3 py-2">{detalle.producto?.nombre ?? detalle.producto_id}</td>
                      <td className="px-3 py-2 text-right">{detalle.cantidad}</td>
                      <td className="px-3 py-2 text-right">{formatCurrencyARS(detalle.costo_unitario)}</td>
                      <td className="px-3 py-2 text-right font-medium">{formatCurrencyARS(detalle.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
