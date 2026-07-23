'use client';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Compra } from '@/interfaces/compra.interface';
import { formatCurrencyARS } from '@/lib/comercial/productos';
import { formatFrontendDate } from '@/utils/dateFormat';
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
import { useI18n } from '@/i18n/I18nProvider';
import { translateCommercialUi } from '@/i18n/commercialUi';

function estadoLabel(estado?: string | null) {
  if (estado === 'pagada') return 'Pagada';
  if (estado === 'pendiente') return 'Pendiente';
  if (estado === 'anulada') return 'Anulada';
  return 'Sin estado';
}

function getItemsLabel(compra: Compra, c: (text: string) => string) {
  const detalles = compra.compra_detalle ?? compra.detalles ?? [];
  if (!detalles.length) return c('Sin detalle');
  return detalles
    .map((detalle) => `${detalle.cantidad} x ${detalle.producto?.nombre ?? c('Producto')}`)
    .join(' | ');
}

export default function CompraTable({
  compras,
  loading,
  onView,
  onCancel,
}: {
  compras: Compra[];
  loading?: boolean;
  onView: (compra: Compra) => void;
  onCancel: (compra: Compra) => void;
}) {
  const { locale } = useI18n();
  const c = (text: string) => translateCommercialUi(locale, text);

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, index) => (
          <Skeleton key={index} className="h-9 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (compras.length === 0) {
    return <div className="py-10 text-center text-muted-foreground">{c("No hay compras registradas aún.")}</div>;
  }

  return (
    <Table className="w-full overflow-hidden text-sm border rounded-md border-border">
      <TableHeader>
        <TableRow className="bg-muted/50 text-muted-foreground">
          <TableHead>{c("Proveedor")}</TableHead>
          <TableHead>{c("Fecha")}</TableHead>
          <TableHead>{c("Comprobante")}</TableHead>
          <TableHead>{c("Productos")}</TableHead>
          <TableHead>{c("Estado")}</TableHead>
          <TableHead className="text-right">{c("Total")}</TableHead>
          <TableHead>{c("Acciones")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {compras.map((compra) => (
          <TableRow key={compra.id} className="odd:bg-muted/40 hover:bg-[#a8d9f9] transition-colors">
            <TableCell>
              <div className="space-y-1">
                <p className="font-medium">{compra.proveedor?.nombre ?? c('Proveedor no encontrado')}</p>
                <p className="text-xs text-muted-foreground">{compra.proveedor?.identificacion_fiscal ?? c('Sin identificación fiscal')}</p>
              </div>
            </TableCell>
            <TableCell>{formatFrontendDate(compra.fecha)}</TableCell>
            <TableCell>{compra.numero_comprobante || '-'}</TableCell>
            <TableCell className="max-w-[360px] truncate">{getItemsLabel(compra, c)}</TableCell>
            <TableCell>{c(estadoLabel(compra.estado))}</TableCell>
            <TableCell className="text-right font-semibold">{formatCurrencyARS(compra.total, locale)}</TableCell>
            <TableCell className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => onView(compra)}>{c("Ver")}</Button>
              {compra.estado !== 'anulada' && compra.activo !== false && (
                <Button size="sm" className="bg-red-500 text-white hover:bg-red-600" onClick={() => onCancel(compra)}>
                  {c("Anular")}
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={6}>{c("Total de compras listadas")}</TableCell>
          <TableCell className="text-right">{compras.length}</TableCell>
        </TableRow>
      </TableFooter>
      <TableCaption>{c("Listado de compras y reposiciones registradas.")}</TableCaption>
    </Table>
  );
}
