'use client';

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { createVenta, updateVenta } from '@/services/ventaService';
import { getAllProductos } from '@/services/productoService';
import { getAllServicios } from '@/services/servicioService';
import { fetchSocios } from '@/services/socioService';
import { Producto } from '@/interfaces/producto.interface';
import { Servicio } from '@/interfaces/servicio.interface';
import { Socio } from '@/interfaces/socio.interface';
import {
  ResponseVenta,
  VentaClienteTipo,
  VentaMetodoPago,
} from '@/interfaces/venta.interface';
import { VentaDetalleItemTipo } from '@/interfaces/venta_detalle.interface';
import { formatCurrencyARS } from '@/lib/comercial/productos';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/i18n/I18nProvider';
import { translateCommercialUi } from '@/i18n/commercialUi';

export interface VentaFormProps {
  venta?: ResponseVenta | null;
  onCreated: () => void;
}

type VentaDetalleFormRow = {
  id: string;
  item_tipo: VentaDetalleItemTipo;
  item_id: string;
  cantidad: string;
  descuento: string;
};

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = {
  cliente_tipo: 'consumidor_final' as VentaClienteTipo,
  socio_id: '',
  cliente_nombre: 'Consumidor Final',
  cliente_documento: '',
  fecha: today(),
  metodo_pago: 'efectivo' as VentaMetodoPago,
  observaciones: '',
};

const emptyDetalle = (): VentaDetalleFormRow => ({
  id: crypto.randomUUID(),
  item_tipo: 'producto',
  item_id: '',
  cantidad: '1',
  descuento: '',
});

const onlyIntegerText = (value: string) =>
  value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');

export default function VentaForm({ venta, onCreated }: VentaFormProps) {
  const { locale } = useI18n();
  const c = (text: string) => translateCommercialUi(locale, text);

  const [form, setForm] = useState(emptyForm);
  const [detalles, setDetalles] = useState<VentaDetalleFormRow[]>([
    emptyDetalle(),
  ]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [socios, setSocios] = useState<Socio[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadCatalogosVenta() {
      try {
        const [productosData, serviciosData, sociosData] = await Promise.all([
          getAllProductos().catch(() => [] as Producto[]),
          getAllServicios().catch(() => [] as Servicio[]),
          fetchSocios(undefined as any).catch(() => [] as Socio[]),
        ]);

        setProductos((productosData ?? []).filter((producto) => producto.activo !== false));
        setServicios((serviciosData ?? []).filter((servicio) => servicio.activo !== false));
        setSocios((sociosData ?? []).filter((socio) => socio.activo !== false));
      } catch {
        setProductos([]);
        setServicios([]);
        setSocios([]);
      }
    }

    loadCatalogosVenta();
  }, []);

  useEffect(() => {
    if (venta) {
      setForm({
        cliente_tipo: venta.cliente_tipo ?? (venta.socio_id ? 'socio' : 'consumidor_final'),
        socio_id: venta.socio_id ?? '',
        cliente_nombre: venta.cliente_nombre ?? 'Consumidor Final',
        cliente_documento: venta.cliente_documento ?? '',
        fecha: venta.fecha ?? today(),
        metodo_pago: venta.metodo_pago ?? 'efectivo',
        observaciones: venta.observaciones ?? '',
      });

      const ventaDetalles = venta.venta_detalle ?? venta.detalles ?? [];
      setDetalles(
        ventaDetalles.length > 0
          ? ventaDetalles.map((detalle) => ({
              id: detalle.id,
              item_tipo: detalle.item_tipo ?? (detalle.servicio_id ? 'servicio' : 'producto'),
              item_id: detalle.servicio_id ?? detalle.producto_id ?? '',
              cantidad: String(detalle.cantidad ?? 1),
              descuento: detalle.descuento ? String(Math.trunc(Number(detalle.descuento))) : '',
            }))
          : [emptyDetalle()]
      );
    } else {
      setForm({ ...emptyForm, fecha: today() });
      setDetalles([emptyDetalle()]);
    }
  }, [venta]);

  const productosById = useMemo(
    () => new Map(productos.map((producto) => [producto.id, producto])),
    [productos]
  );

  const serviciosById = useMemo(
    () => new Map(servicios.map((servicio) => [servicio.id, servicio])),
    [servicios]
  );

  const getItemPrecio = (detalle: VentaDetalleFormRow) => {
    if (!detalle.item_id) return 0;
    if (detalle.item_tipo === 'producto') {
      return Number(productosById.get(detalle.item_id)?.precio ?? 0);
    }
    return Number(serviciosById.get(detalle.item_id)?.precio ?? 0);
  };

  const getItemStock = (detalle: VentaDetalleFormRow) => {
    if (detalle.item_tipo !== 'producto' || !detalle.item_id) return null;
    return Number(productosById.get(detalle.item_id)?.stock ?? 0);
  };

  const getDetalleTotal = (detalle: VentaDetalleFormRow) => {
    const cantidad = Number(detalle.cantidad || 0);
    const descuento = Number(detalle.descuento || 0);
    return Math.max(cantidad * getItemPrecio(detalle) - descuento, 0);
  };

  const totalVenta = useMemo(
    () => detalles.reduce((acc, detalle) => acc + getDetalleTotal(detalle), 0),
    [detalles, productosById, serviciosById]
  );

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => {
      if (name === 'cliente_tipo') {
        const clienteTipo = value as VentaClienteTipo;
        return {
          ...prev,
          cliente_tipo: clienteTipo,
          socio_id: clienteTipo === 'socio' ? prev.socio_id : '',
          cliente_nombre:
            clienteTipo === 'socio' ? '' : prev.cliente_nombre || 'Consumidor Final',
          cliente_documento: clienteTipo === 'socio' ? '' : prev.cliente_documento,
        };
      }

      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const handleDetalleChange = (
    detalleId: string,
    field: keyof VentaDetalleFormRow,
    value: string
  ) => {
    setDetalles((prev) =>
      prev.map((detalle) => {
        if (detalle.id !== detalleId) return detalle;

        if (field === 'cantidad' || field === 'descuento') {
          return { ...detalle, [field]: onlyIntegerText(value) };
        }

        if (field === 'item_tipo') {
          return {
            ...detalle,
            item_tipo: value as VentaDetalleItemTipo,
            item_id: '',
          };
        }

        return { ...detalle, [field]: value };
      })
    );
  };

  const addDetalle = () => setDetalles((prev) => [...prev, emptyDetalle()]);

  const removeDetalle = (detalleId: string) => {
    setDetalles((prev) =>
      prev.length === 1 ? prev : prev.filter((detalle) => detalle.id !== detalleId)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (form.cliente_tipo === 'socio' && !form.socio_id) {
        throw new Error(c("Seleccioná un socio para esta venta"));
      }

      const parsedDetalles = detalles.map((detalle) => {
        const cantidad = Number(detalle.cantidad);
        const descuento = Number(detalle.descuento || 0);
        const precioUnitario = getItemPrecio(detalle);
        const stock = getItemStock(detalle);

        if (!detalle.item_id) {
          throw new Error(c('Cada línea debe tener un producto o servicio seleccionado'));
        }

        if (!Number.isInteger(cantidad) || cantidad <= 0) {
          throw new Error(c("La cantidad debe ser un número entero mayor a 0"));
        }

        if (detalle.item_tipo === 'producto' && stock !== null && cantidad > stock) {
          throw new Error(`Stock insuficiente. {c('Stock disponible')}: ${stock}`);
        }

        if (descuento < 0 || descuento > cantidad * precioUnitario) {
          throw new Error(c('El descuento no puede superar el subtotal de la línea'));
        }

        return {
          item_tipo: detalle.item_tipo,
          producto_id: detalle.item_tipo === 'producto' ? detalle.item_id : null,
          servicio_id: detalle.item_tipo === 'servicio' ? detalle.item_id : null,
          cantidad,
          precio_unitario: precioUnitario,
          descuento,
        };
      });

      const payload = {
        venta: {
          cliente_tipo: form.cliente_tipo,
          socio_id: form.cliente_tipo === 'socio' ? form.socio_id : null,
          cliente_nombre:
            form.cliente_tipo === 'socio'
              ? null
              : form.cliente_nombre.trim() || 'Consumidor Final',
          cliente_documento:
            form.cliente_tipo === 'socio'
              ? null
              : form.cliente_documento.trim() || null,
          fecha: form.fecha,
          metodo_pago: form.metodo_pago,
          observaciones: form.observaciones.trim() || null,
        },
        detalles: parsedDetalles,
      };

      if (venta?.id) {
        await updateVenta(undefined as any, venta.id, payload.venta);
        toast.success(c('Cabecera de venta actualizada'));
      } else {
        await createVenta(undefined as any, payload);
        toast.success(c('Venta registrada'));
      }

      setForm({ ...emptyForm, fecha: today() });
      setDetalles([emptyDetalle()]);
      onCreated();
    } catch (error: any) {
      toast.error(error.message || c('Error al guardar venta'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-5'>
      <QaFileNameBadge file="src/components/forms/VentaForm.tsx" />
      <section className='grid grid-cols-1 gap-4 md:grid-cols-3'>
        <div className='flex flex-col gap-1.5'>
          <Label htmlFor='cliente_tipo'>{c('Tipo de cliente')}</Label>
          <select
            id='cliente_tipo'
            name='cliente_tipo'
            value={form.cliente_tipo}
            onChange={handleFormChange}
            className='h-10 rounded-md border border-input bg-background px-3 py-2 text-sm'
          >
            <option value='consumidor_final'>{c('Consumidor final')}</option>
            <option value='socio'>{c('Socio')}</option>
            <option value='visitante'>{c('Visitante')}</option>
          </select>
        </div>

        {form.cliente_tipo === 'socio' ? (
          <div className='flex flex-col gap-1.5 md:col-span-2'>
            <Label htmlFor='socio_id'>{c('Socio')}</Label>
            <select
              id='socio_id'
              name='socio_id'
              value={form.socio_id}
              onChange={handleFormChange}
              className='h-10 rounded-md border border-input bg-background px-3 py-2 text-sm'
              required
            >
              <option value=''>{c('Seleccionar socio')}</option>
              {socios.map((socio) => (
                <option key={socio.id_socio} value={socio.id_socio}>
                  {socio.nombre_completo} {socio.dni ? `- DNI ${socio.dni}` : ''}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <>
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='cliente_nombre'>{c('Nombre del cliente')}</Label>
              <Input
                id='cliente_nombre'
                name='cliente_nombre'
                placeholder={c('Consumidor Final')}
                value={form.cliente_nombre}
                onChange={handleFormChange}
              />
            </div>
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='cliente_documento'>{c('DNI/CUIT opcional')}</Label>
              <Input
                id='cliente_documento'
                name='cliente_documento'
                placeholder={c('Opcional')}
                value={form.cliente_documento}
                onChange={handleFormChange}
              />
            </div>
          </>
        )}

        <div className='flex flex-col gap-1.5'>
          <Label htmlFor='fecha'>{c('Fecha')}</Label>
          <Input
            id='fecha'
            name='fecha'
            type='date'
            value={form.fecha}
            onChange={handleFormChange}
            required
          />
        </div>
        <div className='flex flex-col gap-1.5'>
          <Label htmlFor='metodo_pago'>{c("Método de pago")}</Label>
          <select
            id='metodo_pago'
            name='metodo_pago'
            value={form.metodo_pago}
            onChange={handleFormChange}
            className='h-10 rounded-md border border-input bg-background px-3 py-2 text-sm'
          >
            <option value='efectivo'>{c('Efectivo')}</option>
            <option value='transferencia'>{c('Transferencia')}</option>
            <option value='debito'>{c('Débito')}</option>
            <option value='credito'>{c('Crédito')}</option>
            <option value='mercado_pago'>{c('Mercado Pago')}</option>
            <option value='stripe'>Stripe</option>
            <option value='otro'>{c('Otro')}</option>
          </select>
        </div>
        <div className='flex flex-col gap-1.5'>
          <Label>{c('Total calculado')}</Label>
          <div className='flex h-10 items-center rounded-md border bg-muted px-3 text-sm font-semibold'>
            {formatCurrencyARS(totalVenta, locale)}
          </div>
        </div>
      </section>

      <section className='space-y-3 rounded-xl border p-4'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div>
            <h3 className='font-semibold'>{c("Ítems de la venta")}</h3>
            <p className='text-sm text-muted-foreground'>
              {c('Agregá productos o servicios. Los productos descuentan stock al registrar la venta.')}
            </p>
          </div>
          {!venta?.id && (
            <Button type='button' variant='outline' onClick={addDetalle}>
              <Plus className='mr-2 h-4 w-4' />
              {c("Agregar ítem")}
            </Button>
          )}
        </div>

        <div className='space-y-3'>
          {detalles.map((detalle, index) => {
            const precio = getItemPrecio(detalle);
            const stock = getItemStock(detalle);
            const subtotal = getDetalleTotal(detalle);
            const opciones = detalle.item_tipo === 'producto' ? productos : servicios;

            return (
              <div
                key={detalle.id}
                className='grid grid-cols-1 gap-3 rounded-lg border bg-muted/30 p-3 md:grid-cols-12'
              >
                <div className='md:col-span-2'>
                  <Label>{c("Tipo")}</Label>
                  <select
                    value={detalle.item_tipo}
                    onChange={(e) =>
                      handleDetalleChange(detalle.id, 'item_tipo', e.target.value)
                    }
                    disabled={!!venta?.id}
                    className='mt-1 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
                  >
                    <option value='producto'>{c('Producto')}</option>
                    <option value='servicio'>{c('Servicio')}</option>
                  </select>
                </div>
                <div className='md:col-span-4'>
                  <Label>{c(detalle.item_tipo === 'producto' ? 'Producto' : 'Servicio')}</Label>
                  <select
                    value={detalle.item_id}
                    onChange={(e) =>
                      handleDetalleChange(detalle.id, 'item_id', e.target.value)
                    }
                    disabled={!!venta?.id}
                    className='mt-1 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
                    required
                  >
                    <option value=''>{c('Seleccionar')}</option>
                    {opciones.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nombre}
                      </option>
                    ))}
                  </select>
                  {stock !== null && (
                    <p className='mt-1 text-xs text-muted-foreground'>{c('Stock disponible')}: {stock}</p>
                  )}
                </div>
                <div className='md:col-span-2'>
                  <Label>{c('Cantidad')}</Label>
                  <Input
                    value={detalle.cantidad}
                    onChange={(e) =>
                      handleDetalleChange(detalle.id, 'cantidad', e.target.value)
                    }
                    disabled={!!venta?.id}
                    inputMode='numeric'
                    pattern='[0-9]*'
                    className='mt-1'
                    required
                  />
                </div>
                <div className='md:col-span-1'>
                  <Label>{c("Desc.")}</Label>
                  <Input
                    value={detalle.descuento}
                    onChange={(e) =>
                      handleDetalleChange(detalle.id, 'descuento', e.target.value)
                    }
                    disabled={!!venta?.id}
                    inputMode='numeric'
                    pattern='[0-9]*'
                    className='mt-1'
                    placeholder='0'
                  />
                </div>
                <div className='md:col-span-2'>
                  <Label>{c("Subtotal")}</Label>
                  <div className='mt-1 flex h-10 items-center rounded-md border bg-background px-3 text-sm font-medium'>
                    {formatCurrencyARS(subtotal, locale)}
                  </div>
                  <p className='mt-1 text-xs text-muted-foreground'>
                    {c("Unitario")}: {formatCurrencyARS(precio, locale)}
                  </p>
                </div>
                <div className='flex items-end justify-end md:col-span-1'>
                  {!venta?.id && (
                    <Button
                      type='button'
                      size='icon'
                      variant='outline'
                      onClick={() => removeDetalle(detalle.id)}
                      disabled={detalles.length === 1}
                      title={`${c("Eliminar ítem")} ${index + 1}`}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='observaciones'>{c('Observaciones')}</Label>
        <Input
          id='observaciones'
          name='observaciones'
          placeholder={c('Observaciones internas opcionales')}
          value={form.observaciones}
          onChange={handleFormChange}
        />
      </div>

      {venta?.id && (
        <div className='rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900'>
          {c('En esta etapa se permite editar la cabecera de la venta. La edición de ítems, devoluciones y reposición de stock queda para la feature de anulaciones/devoluciones.')}
        </div>
      )}

      <div className='flex justify-end'>
        <Button type='submit' disabled={loading}>
          {loading ? c('Guardando...') : venta ? c('Actualizar Venta') : c('Registrar Venta')}
        </Button>
      </div>
    </form>
  );
}
