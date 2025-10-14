'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { createVenta, updateVenta } from '@/services/ventaService';
import { toast } from 'sonner';

export interface VentaFormProps {
  venta?: {
    id?: string;
    socio_id: string;
    total: number;
    fecha: string;
  } | null;
  onCreated: () => void;
}

const emptyForm = {
  socio_id: '',
  total: 0,
  fecha: '',
};

export default function VentaForm({ venta, onCreated }: VentaFormProps) {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (venta) {
      setForm({
        socio_id: venta.socio_id ?? '',
        total: venta.total ?? 0,
        fecha: venta.fecha ?? '',
      });
    } else {
      setForm(emptyForm);
    }
  }, [venta]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'total' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (venta && venta.id) {
        await updateVenta(undefined as any, venta.id, form);
        toast.success('Venta actualizada');
      } else {
        await createVenta(undefined as any, {
          venta: { socio_id: form.socio_id, fecha: form.fecha },
          venta_detalle: { producto_id: '', cantidad: 0 },
        });
        toast.success('Venta creada');
      }
      setForm(emptyForm);
      onCreated();
    } catch (error: any) {
      let msg = error.message || 'Error al guardar venta';
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
        <Label htmlFor='socio_id'>Socio</Label>
        <Input
          id='socio_id'
          name='socio_id'
          placeholder='ID del socio'
          value={form.socio_id}
          onChange={handleChange}
          required
        />
      </div>
      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='fecha'>Fecha</Label>
        <Input
          id='fecha'
          name='fecha'
          type='date'
          value={form.fecha}
          onChange={handleChange}
          required
        />
      </div>
      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='total'>Total</Label>
        <Input
          id='total'
          name='total'
          type='number'
          placeholder='Total'
          value={form.total}
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
        {loading ? 'Guardando...' : venta ? 'Actualizar Venta' : 'Crear Venta'}
      </Button>
    </form>
  );
}
