'use client';

import { QaFileNameBadge } from '@/components/qa/QaFileNameBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import FechaHora from '@/components/ui/FechaHora';
import { Compra } from '@/interfaces/compra.interface';
import { formatCurrencyARS } from '@/lib/comercial/productos';
import { formatFrontendDate } from '@/utils/dateFormat';
import { useI18n } from '@/i18n/I18nProvider';
import { translateCommercialUi } from '@/i18n/commercialUi';

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
  const { locale } = useI18n();
  const c = (text: string) => translateCommercialUi(locale, text);
  const dateLocale = locale === 'en' ? 'en-US' : 'es-AR';
  if (!compra) return null;
  const detalles = compra.compra_detalle ?? compra.detalles ?? [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-5xl sm:max-w-4xl">
        <QaFileNameBadge file="src/components/modal/CompraViewModal.tsx" />
        <DialogHeader>
          <div className="flex w-full items-center justify-between gap-4">
            <DialogTitle>{c("Detalle de compra")}</DialogTitle>
            <FechaHora />
          </div>
        </DialogHeader>

        <div className="space-y-5">
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase text-muted-foreground">{c("Proveedor")}</p>
              <div className="rounded-md border bg-muted px-3 py-2 text-sm">
                {compra.proveedor?.nombre ?? c('Proveedor no encontrado')}
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase text-muted-foreground">{c("Fecha")}</p>
              <div className="rounded-md border bg-muted px-3 py-2 text-sm">{formatFrontendDate(compra.fecha, dateLocale)}</div>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase text-muted-foreground">{c("Estado")}</p>
              <div className="rounded-md border bg-muted px-3 py-2 text-sm">{c(estadoLabel(compra.estado))}</div>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase text-muted-foreground">{c("Medio de pago")}</p>
              <div className="rounded-md border bg-muted px-3 py-2 text-sm">{c(compra.medio_pago)}</div>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase text-muted-foreground">{c("Comprobante")}</p>
              <div className="rounded-md border bg-muted px-3 py-2 text-sm">{compra.numero_comprobante || '-'}</div>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase text-muted-foreground">{c("Total")}</p>
              <div className="rounded-md border bg-muted px-3 py-2 text-sm font-semibold">{formatCurrencyARS(compra.total, locale)}</div>
            </div>
          </section>

          {compra.observaciones && (
            <div className="rounded-xl border bg-muted/30 p-3 text-sm">
              <p className="mb-1 font-semibold">{c("Observaciones")}</p>
              <p className="text-muted-foreground">{compra.observaciones}</p>
            </div>
          )}

          <section className="rounded-xl border p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">{c("Productos comprados")}</h3>
              <span className="text-sm text-muted-foreground">{detalles.length} {c("ítems")}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-muted/60 text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">{c("Producto")}</th>
                    <th className="px-3 py-2 text-right">{c("Cantidad")}</th>
                    <th className="px-3 py-2 text-right">{c("Costo unitario")}</th>
                    <th className="px-3 py-2 text-right">{c("Subtotal")}</th>
                  </tr>
                </thead>
                <tbody>
                  {detalles.map((detalle) => (
                    <tr key={detalle.id} className="border-t">
                      <td className="px-3 py-2">{detalle.producto?.nombre ?? detalle.producto_id}</td>
                      <td className="px-3 py-2 text-right">{detalle.cantidad}</td>
                      <td className="px-3 py-2 text-right">{formatCurrencyARS(detalle.costo_unitario, locale)}</td>
                      <td className="px-3 py-2 text-right font-medium">{formatCurrencyARS(detalle.subtotal, locale)}</td>
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
