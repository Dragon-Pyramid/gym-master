'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Venta } from '@/interfaces/venta.interface';
import { VentaDetalle } from '@/interfaces/venta_detalle.interface';
import { formatCurrencyARS } from '@/lib/comercial/productos';

function getClienteLabel(venta: Venta) {
  if (venta.socio?.nombre_completo) return venta.socio.nombre_completo;
  if (venta.cliente_nombre) return venta.cliente_nombre;
  return 'Consumidor Final';
}

function getDetalles(venta: Venta): VentaDetalle[] {
  return venta.venta_detalle ?? venta.detalles ?? [];
}

function getDetalleNombre(detalle: VentaDetalle) {
  if (detalle.item_tipo === 'servicio') {
    return detalle.servicio?.nombre ?? 'Servicio';
  }
  return detalle.producto?.nombre ?? 'Producto';
}

function getDetalleTotal(detalle: VentaDetalle) {
  const totalLinea = Number(detalle.total_linea ?? NaN);
  if (Number.isFinite(totalLinea)) return totalLinea;
  return Math.max(Number(detalle.subtotal ?? 0) - Number(detalle.descuento ?? 0), 0);
}

export default function VentaViewModal({
  open,
  onClose,
  venta,
}: {
  open: boolean;
  onClose: () => void;
  venta?: Venta | null;
}) {
  if (!venta) return null;

  const detalles = getDetalles(venta);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='!max-w-[92vw] !w-full bg-background text-foreground sm:!max-w-[900px]'>
        <DialogHeader>
          <DialogTitle className='text-xl font-semibold text-foreground'>
            Detalle de Venta
          </DialogTitle>
          <div className='text-right text-sm text-muted-foreground'>
            {new Date().toLocaleString('es-AR')}
          </div>
        </DialogHeader>

        <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-3'>
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Cliente</label>
            <div className='rounded-md border bg-muted p-2 text-foreground'>
              {getClienteLabel(venta)}
            </div>
          </div>
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Tipo</label>
            <div className='rounded-md border bg-muted p-2 capitalize text-foreground'>
              {(venta.cliente_tipo ?? 'consumidor_final').replace('_', ' ')}
            </div>
          </div>
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Documento</label>
            <div className='rounded-md border bg-muted p-2 text-foreground'>
              {venta.cliente_documento || '-'}
            </div>
          </div>
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Fecha</label>
            <div className='rounded-md border bg-muted p-2 text-foreground'>
              {venta.fecha || '-'}
            </div>
          </div>
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Método de pago</label>
            <div className='rounded-md border bg-muted p-2 capitalize text-foreground'>
              {(venta.metodo_pago ?? 'efectivo').replace('_', ' ')}
            </div>
          </div>
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Estado</label>
            <div className='rounded-md border bg-muted p-2 capitalize text-foreground'>
              {venta.estado ?? (venta.activo === false ? 'anulada' : 'pagada')}
            </div>
          </div>
        </div>

        <div className='mt-6 overflow-hidden rounded-lg border'>
          <table className='w-full text-sm'>
            <thead className='bg-muted/60 text-muted-foreground'>
              <tr>
                <th className='px-3 py-2 text-left'>Ítem</th>
                <th className='px-3 py-2 text-right'>Cantidad</th>
                <th className='px-3 py-2 text-right'>Unitario</th>
                <th className='px-3 py-2 text-right'>Descuento</th>
                <th className='px-3 py-2 text-right'>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {detalles.length > 0 ? (
                detalles.map((detalle) => (
                  <tr key={detalle.id} className='border-t'>
                    <td className='px-3 py-2'>
                      <div>
                        <p className='font-medium'>{getDetalleNombre(detalle)}</p>
                        <p className='text-xs capitalize text-muted-foreground'>
                          {detalle.item_tipo}
                        </p>
                      </div>
                    </td>
                    <td className='px-3 py-2 text-right'>{detalle.cantidad}</td>
                    <td className='px-3 py-2 text-right'>
                      {formatCurrencyARS(detalle.precio_unitario)}
                    </td>
                    <td className='px-3 py-2 text-right'>
                      {formatCurrencyARS(detalle.descuento ?? 0)}
                    </td>
                    <td className='px-3 py-2 text-right font-semibold'>
                      {formatCurrencyARS(getDetalleTotal(detalle))}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className='px-3 py-8 text-center text-muted-foreground'>
                    Esta venta no tiene detalle cargado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-2'>
          <div className='rounded-lg border bg-muted/40 p-3 text-sm'>
            <p className='font-medium'>Código de comprobante</p>
            <p className='text-muted-foreground'>{venta.comprobante_codigo || '-'}</p>
          </div>
          <div className='rounded-lg border bg-muted/40 p-3 text-right'>
            <p className='text-sm text-muted-foreground'>Total</p>
            <p className='text-2xl font-bold'>{formatCurrencyARS(venta.total)}</p>
          </div>
        </div>

        {venta.observaciones && (
          <div className='mt-4 rounded-lg border bg-muted/40 p-3 text-sm'>
            <p className='font-medium'>Observaciones</p>
            <p className='text-muted-foreground'>{venta.observaciones}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
