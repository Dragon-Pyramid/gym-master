'use client';

import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { VentaDetalle } from '@/interfaces/venta_detalle.interface';
import { formatCurrencyARS } from '@/lib/comercial/productos';
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

function getDetalleNombre(detalle: VentaDetalle) {
  if (detalle.item_tipo === 'servicio') {
    return detalle.servicio?.nombre ?? detalle.servicio_id ?? '-';
  }
  return detalle.producto?.nombre ?? detalle.producto_id ?? '-';
}

function getDetalleTotal(detalle: VentaDetalle) {
  const totalLinea = Number(detalle.total_linea ?? NaN);
  if (Number.isFinite(totalLinea)) return totalLinea;
  return Math.max(Number(detalle.subtotal ?? 0) - Number(detalle.descuento ?? 0), 0);
}

export default function VentaDetalleTable({
  detalles,
  loading,
  onEdit,
  onView,
  onDelete,
}: {
  detalles: VentaDetalle[];
  loading?: boolean;
  onEdit: (detalle: VentaDetalle) => void;
  onView?: (detalle: VentaDetalle) => void;
  onDelete?: (detalle: VentaDetalle) => void;
}) {
  if (loading) {
    return (
      <div className='space-y-2'>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className='h-9 w-full rounded-md' />
        ))}
      </div>
    );
  }

  if (detalles.length === 0 && !loading) {
    return (
      <div className='py-10 text-center text-muted-foreground'>
        No hay detalles de venta registrados aún.
      </div>
    );
  }

  return (
    <Table className='w-full overflow-hidden rounded-md border border-border text-sm'>
      <TableHeader>
        <TableRow className='bg-muted/50 text-muted-foreground'>
          <TableHead>Venta</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Ítem</TableHead>
          <TableHead>Cantidad</TableHead>
          <TableHead>Precio Unitario</TableHead>
          <TableHead>Descuento</TableHead>
          <TableHead>Total línea</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {detalles.map((detalle) => (
          <TableRow
            key={detalle.id}
            className='odd:bg-muted/40 transition-colors hover:bg-[#a8d9f9]'
          >
            <TableCell className='font-medium'>{detalle.venta_id}</TableCell>
            <TableCell className='capitalize'>{detalle.item_tipo}</TableCell>
            <TableCell>{getDetalleNombre(detalle)}</TableCell>
            <TableCell>{detalle.cantidad}</TableCell>
            <TableCell>{formatCurrencyARS(detalle.precio_unitario)}</TableCell>
            <TableCell>{formatCurrencyARS(detalle.descuento ?? 0)}</TableCell>
            <TableCell>{formatCurrencyARS(getDetalleTotal(detalle))}</TableCell>
            <TableCell className='flex gap-2'>
              <Button size='sm' variant='outline' onClick={() => onView && onView(detalle)}>
                Ver
              </Button>
              <Button size='sm' variant='outline' onClick={() => onEdit(detalle)} title='Editar'>
                <Pencil className='h-4 w-4' />
              </Button>
              <Button
                size='sm'
                className='w-[100px] bg-red-500 text-white hover:bg-red-600'
                onClick={() => onDelete && onDelete(detalle)}
              >
                Eliminar
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={7}>Total de detalles</TableCell>
          <TableCell className='text-right'>{detalles.length}</TableCell>
        </TableRow>
      </TableFooter>
      <TableCaption>Listado de detalles de venta registrados.</TableCaption>
    </Table>
  );
}
