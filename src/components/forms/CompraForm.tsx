'use client';

import { QaFileNameBadge } from '@/components/qa/QaFileNameBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Producto } from '@/interfaces/producto.interface';
import { Proveedor } from '@/interfaces/proveedor.interface';
import { CompraMedioPago, CompraEstado, CreateCompraDto } from '@/interfaces/compra.interface';
import { createCompra } from '@/services/compraService';
import { formatCurrencyARS } from '@/lib/comercial/productos';
import { Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useI18n } from '@/i18n/I18nProvider';
import { translateCommercialUi } from '@/i18n/commercialUi';

type CompraItemForm = {
  producto_id: string;
  cantidad: string;
  costo_unitario: string;
};

const MEDIOS_PAGO: Array<{ value: CompraMedioPago; label: string }> = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'mercado_pago', label: 'Mercado Pago' },
  { value: 'stripe', label: 'Stripe' },
  { value: 'otro', label: 'Otro' },
];

const ESTADOS: Array<{ value: CompraEstado; label: string }> = [
  { value: 'pagada', label: 'Pagada / recibida' },
  { value: 'pendiente', label: 'Pendiente' },
];

function createEmptyItem(): CompraItemForm {
  return { producto_id: '', cantidad: '1', costo_unitario: '' };
}

function toNumber(value: string) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

export default function CompraForm({
  proveedores,
  productos,
  onCreated,
  onCancel,
}: {
  proveedores: Proveedor[];
  productos: Producto[];
  onCreated: () => void;
  onCancel: () => void;
}) {
  const { locale } = useI18n();
  const c = (text: string) => translateCommercialUi(locale, text);

  const [proveedorId, setProveedorId] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [estado, setEstado] = useState<CompraEstado>('pagada');
  const [medioPago, setMedioPago] = useState<CompraMedioPago>('efectivo');
  const [numeroComprobante, setNumeroComprobante] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [items, setItems] = useState<CompraItemForm[]>([createEmptyItem()]);
  const [loading, setLoading] = useState(false);

  const productosActivos = useMemo(() => productos.filter((producto) => producto.activo !== false), [productos]);
  const proveedoresActivos = useMemo(
    () => proveedores.filter((proveedor) => proveedor.estado !== 'inactivo' && proveedor.estado !== 'discontinuado'),
    [proveedores]
  );

  const productoById = useMemo(() => new Map(productos.map((producto) => [producto.id, producto])), [productos]);

  const total = useMemo(
    () =>
      items.reduce((acc, item) => {
        return acc + toNumber(item.cantidad) * toNumber(item.costo_unitario);
      }, 0),
    [items]
  );

  const updateItem = (index: number, next: Partial<CompraItemForm>) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const updated = { ...item, ...next };
        if (next.producto_id) {
          const producto = productoById.get(next.producto_id);
          updated.costo_unitario = String(Number(producto?.costo ?? 0) || '');
        }
        return updated;
      })
    );
  };

  const addItem = () => setItems((prev) => [...prev, createEmptyItem()]);
  const removeItem = (index: number) => setItems((prev) => prev.filter((_, idx) => idx !== index));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (!proveedorId) throw new Error(c('Debe seleccionar un proveedor'));

      const detalles = items.map((item, index) => {
        if (!item.producto_id) throw new Error(`${c('Debe seleccionar producto en el ítem')} ${index + 1}`);
        const cantidad = Number(item.cantidad);
        const costoUnitario = Number(item.costo_unitario);
        if (!Number.isInteger(cantidad) || cantidad <= 0) {
          throw new Error(`${c('La cantidad del ítem')} ${index + 1} ${c('debe ser entera y mayor a 0')}`);
        }
        if (!Number.isFinite(costoUnitario) || costoUnitario <= 0) {
          throw new Error(`${c('El costo unitario del ítem')} ${index + 1} ${c('debe ser mayor a 0')}`);
        }
        return {
          producto_id: item.producto_id,
          cantidad,
          costo_unitario: costoUnitario,
        };
      });

      const payload: CreateCompraDto = {
        proveedor_id: proveedorId,
        fecha,
        estado,
        medio_pago: medioPago,
        numero_comprobante: numeroComprobante.trim() || null,
        observaciones: observaciones.trim() || null,
        detalles,
      };

      await createCompra(payload);
      toast.success(c('Compra registrada y stock actualizado'));
      onCreated();
    } catch (error: any) {
      toast.error(error.message || c('No se pudo registrar la compra'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <QaFileNameBadge file="src/components/forms/CompraForm.tsx" />
      <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
        {c('Registrá compras de productos a proveedores. Al guardar, se actualiza stock, costo vigente, movimientos de stock e historial de costo cuando corresponda.')}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="proveedor_id">{c("Proveedor")}</Label>
          <select
            id="proveedor_id"
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={proveedorId}
            onChange={(event) => setProveedorId(event.target.value)}
            required
          >
            <option value="">{c("Seleccionar proveedor")}</option>
            {proveedoresActivos.map((proveedor) => (
              <option key={proveedor.id} value={proveedor.id}>
                {proveedor.nombre}{proveedor.razon_social ? ` · ${proveedor.razon_social}` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="fecha">{c("Fecha")}</Label>
          <Input id="fecha" type="date" value={fecha} onChange={(event) => setFecha(event.target.value)} required />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="estado">{c("Estado")}</Label>
          <select
            id="estado"
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={estado}
            onChange={(event) => setEstado(event.target.value as CompraEstado)}
          >
            {ESTADOS.map((item) => (
              <option key={item.value} value={item.value}>{c(item.label)}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="medio_pago">{c("Medio de pago")}</Label>
          <select
            id="medio_pago"
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={medioPago}
            onChange={(event) => setMedioPago(event.target.value as CompraMedioPago)}
          >
            {MEDIOS_PAGO.map((item) => (
              <option key={item.value} value={item.value}>{c(item.label)}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="numero_comprobante">{c("Número de comprobante")}</Label>
          <Input
            id="numero_comprobante"
            placeholder={c("Factura / remito / ticket")}
            value={numeroComprobante}
            onChange={(event) => setNumeroComprobante(event.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label>{c("Total estimado")}</Label>
          <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm font-semibold">
            {formatCurrencyARS(total, locale)}
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold">{c("Productos comprados")}</h3>
            <p className="text-sm text-muted-foreground">{c('Cada ítem suma stock y actualiza el costo de compra vigente.')}</p>
          </div>
          <Button type="button" variant="outline" onClick={addItem}>
            <Plus className="mr-2 h-4 w-4" /> {c("Agregar ítem")}
          </Button>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => {
            const producto = productoById.get(item.producto_id);
            const subtotal = toNumber(item.cantidad) * toNumber(item.costo_unitario);
            return (
              <div key={index} className="grid grid-cols-1 gap-3 rounded-lg border bg-muted/20 p-3 lg:grid-cols-[1.4fr_0.5fr_0.7fr_0.7fr_auto]">
                <div className="space-y-1.5">
                  <Label>{c("Producto")}</Label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={item.producto_id}
                    onChange={(event) => updateItem(index, { producto_id: event.target.value })}
                    required
                  >
                    <option value="">{c("Seleccionar producto")}</option>
                    {productosActivos.map((productoItem) => (
                      <option key={productoItem.id} value={productoItem.id}>
                        {productoItem.nombre} · {c('Stock').toLowerCase()} {productoItem.stock ?? 0}
                      </option>
                    ))}
                  </select>
                  {producto && (
                    <p className="text-xs text-muted-foreground">
                      {c('Stock actual')}: {producto.stock ?? 0} · {c('Costo vigente')}: {formatCurrencyARS(producto.costo ?? 0, locale)}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>{c("Cantidad")}</Label>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    value={item.cantidad}
                    onChange={(event) => updateItem(index, { cantidad: event.target.value.replace(/\D/g, '') || '1' })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{c("Costo unitario")}</Label>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    value={item.costo_unitario}
                    onChange={(event) => updateItem(index, { costo_unitario: event.target.value.replace(/[^0-9.]/g, '') })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Subtotal</Label>
                  <div className="flex h-10 items-center rounded-md border bg-background px-3 text-sm font-semibold">
                    {formatCurrencyARS(subtotal, locale)}
                  </div>
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={items.length === 1}
                    onClick={() => removeItem(index)}
                    title={c("Quitar ítem")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="observaciones">{c("Observaciones")}</Label>
        <textarea
          id="observaciones"
          className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={observaciones}
          onChange={(event) => setObservaciones(event.target.value)}
          placeholder={c("Detalle de la compra, reposición, factura o condiciones del proveedor")}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>{c("Cancelar")}</Button>
        <Button type="submit" className="bg-[#02a8e1] hover:bg-[#0288b1]" disabled={loading}>
          {loading ? c('Registrando...') : c('Registrar compra')}
        </Button>
      </div>
    </form>
  );
}
