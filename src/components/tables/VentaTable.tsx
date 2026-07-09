'use client';

import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Venta } from '@/interfaces/venta.interface';
import { VentaDetalle } from '@/interfaces/venta_detalle.interface';
import { formatCurrencyARS } from '@/lib/comercial/productos';
import { useI18n } from '@/i18n/I18nProvider';
import { translateCommercialUi } from '@/i18n/commercialUi';

function getVentaClienteLabel(venta: Venta) {
  if (venta.socio?.nombre_completo) return venta.socio.nombre_completo;
  if (venta.cliente_nombre) return venta.cliente_nombre;
  if (venta.cliente_tipo === 'visitante') return 'Visitante';
  return 'Consumidor Final';
}

function getVentaDetalles(venta: Venta): VentaDetalle[] {
  return venta.venta_detalle ?? venta.detalles ?? [];
}

function getItemsResumen(venta: Venta, c: (text: string) => string) {
  const detalles = getVentaDetalles(venta);

  if (!detalles.length) return c('Sin detalle cargado');

  const resumen = detalles
    .slice(0, 2)
    .map((detalle) => {
      const nombre =
        detalle.item_tipo === 'servicio'
          ? detalle.servicio?.nombre ?? c('Servicio')
          : detalle.producto?.nombre ?? c('Producto');
      return `${detalle.cantidad} x ${nombre}`;
    })
    .join(', ');

  return detalles.length > 2 ? `${resumen} +${detalles.length - 2}` : resumen;
}

function EstadoBadge({ venta }: { venta: Venta }) {
  const { locale } = useI18n();
  const c = (text: string) => translateCommercialUi(locale, text);
  const estado = venta.estado ?? (venta.activo === false ? 'anulada' : 'pagada');
  const className =
    estado === 'anulada'
      ? 'bg-red-100 text-red-700 border-red-200'
      : estado === 'pendiente'
      ? 'bg-amber-100 text-amber-800 border-amber-200'
      : 'bg-emerald-100 text-emerald-700 border-emerald-200';

  return (
    <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${className}`}>
      {estado === 'anulada' ? c('Anulada') : estado === 'pendiente' ? c('Pendiente') : c('Pagada')}
    </span>
  );
}

export default function VentaTable({
  ventas,
  loading,
  onEdit,
  onView,
  onDelete,
}: {
  ventas: Venta[];
  loading?: boolean;
  onEdit: (venta: Venta) => void;
  onView?: (venta: Venta) => void;
  onDelete?: (venta: Venta) => void;
}) {
  const { locale } = useI18n();
  const c = (text: string) => translateCommercialUi(locale, text);

  if (loading) {
    return (
      <div className='space-y-2'>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className='h-9 w-full rounded-md' />
        ))}
      </div>
    );
  }

  if (ventas.length === 0 && !loading) {
    return (
      <div className='py-10 text-center text-muted-foreground'>
        {c("No hay ventas registradas aún.")}
      </div>
    );
  }

  return (
    <Table className='w-full overflow-hidden rounded-md border border-border text-sm'>
      <TableHeader>
        <TableRow className='bg-muted/50 text-muted-foreground'>
          <TableHead>{c("Cliente")}</TableHead>
          <TableHead>{c("Detalle")}</TableHead>
          <TableHead>{c("Método")}</TableHead>
          <TableHead>{c("Total")}</TableHead>
          <TableHead>{c("Fecha")}</TableHead>
          <TableHead>{c("Estado")}</TableHead>
          <TableHead>{c("Acciones")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ventas.map((venta) => (
          <TableRow
            key={venta.id}
            className='odd:bg-muted/40 transition-colors hover:bg-[#a8d9f9]'
          >
            <TableCell>
              <div className='space-y-1'>
                <p className='font-medium'>{c(getVentaClienteLabel(venta))}</p>
                <p className='text-xs capitalize text-muted-foreground'>
                  {c((venta.cliente_tipo ?? 'consumidor_final').replace('_', ' '))}
                  {venta.cliente_documento ? ` · ${venta.cliente_documento}` : ''}
                </p>
              </div>
            </TableCell>
            <TableCell className='max-w-[320px]'>
              <p className='truncate'>{getItemsResumen(venta, c)}</p>
            </TableCell>
            <TableCell className='capitalize'>
              {c((venta.metodo_pago ?? 'efectivo').replace('_', ' '))}
            </TableCell>
            <TableCell className='font-semibold'>{formatCurrencyARS(venta.total)}</TableCell>
            <TableCell>{venta.fecha}</TableCell>
            <TableCell>
              <EstadoBadge venta={venta} />
            </TableCell>
            <TableCell className='flex gap-2'>
              <Button size='sm' variant='outline' onClick={() => onView && onView(venta)}>
                {c('Ver')}
              </Button>
              <Button size='sm' variant='outline' onClick={() => onEdit(venta)} title={c('Editar')}>
                <Pencil className='h-4 w-4' />
              </Button>
              <Button
                size='sm'
                className='w-[100px] bg-red-500 text-white hover:bg-red-600'
                onClick={() => onDelete && onDelete(venta)}
                disabled={venta.activo === false || venta.estado === 'anulada'}
              >
                {c('Anular')}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={6}>{c('Total de ventas')}</TableCell>
          <TableCell className='text-right'>{ventas.length}</TableCell>
        </TableRow>
      </TableFooter>
      <TableCaption>{c("Listado de ventas registradas.")}</TableCaption>
    </Table>
  );
}
