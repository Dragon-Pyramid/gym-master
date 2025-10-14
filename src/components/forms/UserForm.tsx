'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Usuario,
  CreateUsuarioDto,
  UpdateUsuarioDto,
} from '@/interfaces/usuario.interface';
import { createUsuarios, updateUsuarios } from '@/services/usuarioService';
import { toast } from 'sonner';

export interface UserFormProps {
  usuario?: Usuario | null;
  onCreated: () => void;
  onCancel: () => void;
}

const emptyForm = {
  nombre: '',
  email: '',
  password: '',
  rol: '',
};

export default function UserForm({
  usuario,
  onCreated,
  onCancel,
}: UserFormProps) {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (usuario) {
      setForm({
        nombre: usuario.nombre ?? '',
        email: usuario.email ?? '',
        rol: usuario.rol ?? '',
        password: '',
      });
    } else {
      setForm(emptyForm);
    }
  }, [usuario]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (usuario && usuario.id) {
        const updateData: UpdateUsuarioDto = {
          nombre: form.nombre,
          email: form.email,
          rol: form.rol,
          ...(form.password && { password: form.password }),
        };

        await updateUsuarios(undefined as any, usuario.id, updateData);
        toast.success('Usuario actualizado exitosamente.');
      } else {
        const createData: CreateUsuarioDto = {
          nombre: form.nombre,
          email: form.email,
          password: form.password,
        };

        if (!createData.password) {
          toast.error(
            'La contraseña es obligatoria para crear un nuevo usuario.'
          );
          setLoading(false);
          return;
        }

        await createUsuarios(undefined as any, createData);
        toast.success('Usuario creado exitosamente.');
      }
      setForm(emptyForm);
      onCreated();
    } catch (error: any) {
      let msg = error.message || 'Error al guardar el usuario.';
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
      className='grid grid-cols-1 gap-4 md:grid-cols-2'
    >
      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='nombre'>Nombre</Label>
        <Input
          id='nombre'
          name='nombre'
          placeholder='Ingrese nombre'
          value={form.nombre}
          onChange={handleChange}
          required
        />
      </div>

      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='email'>Email</Label>
        <Input
          id='email'
          name='email'
          type='email'
          placeholder='Ingrese correo electrónico'
          value={form.email}
          onChange={handleChange}
          required
        />
      </div>

      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='rol'>Rol</Label>
        <Input
          id='rol'
          name='rol'
          placeholder="Ingrese rol (ej. 'socio', 'admin')"
          value={form.rol}
          onChange={handleChange}
        />
      </div>

      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='password'>Contraseña</Label>
        <Input
          id='password'
          name='password'
          type='password'
          placeholder={
            usuario ? 'Dejar vacío para no cambiar' : 'Ingrese contraseña'
          }
          value={form.password}
          onChange={handleChange}
          required={!usuario}
        />
      </div>

      <Button
        type='submit'
        className='col-span-full justify-self-end'
        disabled={loading}
      >
        {loading
          ? 'Guardando...'
          : usuario
          ? 'Actualizar Usuario'
          : 'Crear Usuario'}
      </Button>

      <Button
        type='button'
        onClick={onCancel}
        className='text-gray-800 bg-gray-200 col-span-full justify-self-end hover:bg-gray-300'
        disabled={loading}
      >
        Cancelar
      </Button>
    </form>
  );
}
