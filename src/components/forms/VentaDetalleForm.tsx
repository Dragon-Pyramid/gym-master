'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  createVentaDetalle,
  updateVentaDetalle,
} from '@/services/ventaDetalleService';
import { toast } from 'sonner';

export interface VentaDetalleFormProps {
  detalle?: {
    id?: string;
    venta_id: string;
    producto_id: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
  } | null;
  onCreated: () => void;
}

const emptyForm = {
  venta_id: '',
  producto_id: '',
  cantidad: 0,
  precio_unitario: 0,
  subtotal: 0,
};

export default function VentaDetalleForm({
  detalle,
  onCreated,
}: VentaDetalleFormProps) {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (detalle) {
      setForm({
        venta_id: detalle.venta_id ?? '',
        producto_id: detalle.producto_id ?? '',
        cantidad: detalle.cantidad ?? 0,
        precio_unitario: detalle.precio_unitario ?? 0,
        subtotal: detalle.subtotal ?? 0,
      });
    } else {
      setForm(emptyForm);
    }
  }, [detalle]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === 'cantidad' || name === 'precio_unitario' || name === 'subtotal'
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (detalle && detalle.id) {
        await updateVentaDetalle(undefined as any, detalle.id, form);
        toast.success('Detalle actualizado');
      } else {
        await createVentaDetalle(undefined as any, form, form.venta_id);
        toast.success('Detalle creado');
      }
      setForm(emptyForm);
      onCreated();
    } catch (error: any) {
      let msg = error.message || 'Error al guardar detalle';
      if (msg.includes('value too long')) {
        msg =
          'Uno de los campos excede la cantidad máxima de caracteres permitidos.';
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className='grid grid-cols-1 md:grid-cols-2 gap-4'
    >
      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='venta_id'>Venta</Label>
        <Input
          id='venta_id'
          name='venta_id'
          placeholder='ID de la venta'
          value={form.venta_id}
          onChange={handleChange}
          required
        />
      </div>
      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='producto_id'>Producto</Label>
        <Input
          id='producto_id'
          name='producto_id'
          placeholder='ID del producto'
          value={form.producto_id}
          onChange={handleChange}
          required
        />
      </div>
      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='cantidad'>Cantidad</Label>
        <Input
          id='cantidad'
          name='cantidad'
          type='number'
          placeholder='Cantidad'
          value={form.cantidad}
          onChange={handleChange}
          required
          min={1}
        />
      </div>
      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='precio_unitario'>Precio Unitario</Label>
        <Input
          id='precio_unitario'
          name='precio_unitario'
          type='number'
          placeholder='Precio unitario'
          value={form.precio_unitario}
          onChange={handleChange}
          required
          min={0}
        />
      </div>
      <div className='flex flex-col gap-1.5 md:col-span-2'>
        <Label htmlFor='subtotal'>Subtotal</Label>
        <Input
          id='subtotal'
          name='subtotal'
          type='number'
          placeholder='Subtotal'
          value={form.subtotal}
          onChange={handleChange}
          required
          min={0}
        />
      </div>
      <Button
        type='submit'
        className='col-span-full justify-self-end'
        disabled={loading}
      >
        {loading
          ? 'Guardando...'
          : detalle
          ? 'Actualizar Detalle'
          : 'Crear Detalle'}
      </Button>
    </form>
  );
}
