'use client';

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Usuario,
  CreateUsuarioDto,
  UpdateUsuarioDto,
} from '@/interfaces/usuario.interface';
import { createUsuarioApi, updateUsuarioApi } from '@/services/browser/usuarioApiClient';
import { toast } from 'sonner';
import {
  DEFAULT_MENU_PERMISSIONS_BY_ROLE,
  getAvailableMenuPermissionsForRole,
  sanitizeMenuPermissionsForRole,
} from '@/lib/permissions/menuPermissions';

export interface UserFormProps {
  usuario?: Usuario | null;
  onCreated: () => void;
  onCancel: () => void;
}

const emptyForm = {
  nombre: '',
  email: '',
  password: '',
  rol: 'socio',
  dni: '',
  permisos_menu: DEFAULT_MENU_PERMISSIONS_BY_ROLE.socio,
};

function getInitialPermissions(role: string, permisos?: string[] | null) {
  const sanitized = sanitizeMenuPermissionsForRole(role, permisos);
  return sanitized ?? [];
}

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
        rol: usuario.rol ?? 'socio',
        password: '',
        dni: '',
        permisos_menu: getInitialPermissions(usuario.rol, usuario.permisos_menu),
      });
    } else {
      setForm(emptyForm);
    }
  }, [usuario]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'rol') {
      setForm((prev) => ({
        ...prev,
        rol: value,
        permisos_menu:
          value === 'admin'
            ? []
            : getInitialPermissions(value, undefined),
      }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const togglePermission = (key: string) => {
    setForm((prev) => {
      const current = new Set(prev.permisos_menu);
      if (current.has(key)) {
        current.delete(key);
      } else {
        current.add(key);
      }

      return {
        ...prev,
        permisos_menu: Array.from(current),
      };
    });
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
          permisos_menu:
            form.rol === 'admin'
              ? null
              : sanitizeMenuPermissionsForRole(form.rol, form.permisos_menu),
          ...(form.password && { password: form.password }),
        };

        await updateUsuarioApi(usuario.id, updateData);
        toast.success('Usuario actualizado exitosamente.');
      } else {
        const rol = form.rol || 'socio';
        const createData: CreateUsuarioDto = {
          nombre: form.nombre,
          email: form.email,
          password: form.password,
          rol,
          permisos_menu:
            rol === 'admin'
              ? null
              : sanitizeMenuPermissionsForRole(rol, form.permisos_menu),
          ...(rol === 'socio' && { dni: form.dni }),
        };

        if (!createData.password) {
          toast.error(
            'La contraseña es obligatoria para crear un nuevo usuario.'
          );
          setLoading(false);
          return;
        }

        if (rol === 'socio' && !form.dni.trim()) {
          toast.error('El DNI es obligatorio para crear un usuario socio.');
          setLoading(false);
          return;
        }

        await createUsuarioApi(createData);
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

  const isSocio = form.rol === 'socio';
  const isAdmin = form.rol === 'admin';
  const availablePermissions = getAvailableMenuPermissionsForRole(form.rol);

  return (
    <form
      onSubmit={handleSubmit}
      className='grid grid-cols-1 gap-4 md:grid-cols-2'
    >
      <QaFileNameBadge file="src/components/forms/UserForm.tsx" />
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
        <select
          id='rol'
          name='rol'
          value={form.rol}
          onChange={handleChange}
          className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
        >
          <option value='socio'>Socio</option>
          <option value='admin'>Administrador</option>
          <option value='usuario'>Usuario interno</option>
        </select>
      </div>

      {isSocio && !usuario && (
        <div className='flex flex-col gap-1.5'>
          <Label htmlFor='dni'>DNI</Label>
          <Input
            id='dni'
            name='dni'
            placeholder='Ingrese DNI del socio'
            value={form.dni}
            onChange={handleChange}
            required={isSocio && !usuario}
          />
        </div>
      )}

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

      <div className='col-span-full rounded-lg border bg-muted/20 p-4'>
        <div className='mb-3'>
          <h3 className='text-base font-semibold'>Permisos de menú</h3>
          <p className='text-sm text-muted-foreground'>
            Definí qué módulos verá este usuario al iniciar sesión. El administrador conserva acceso total.
          </p>
        </div>

        {isAdmin ? (
          <div className='rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100'>
            El rol administrador tiene control total del panel.
          </div>
        ) : (
          <div className='grid gap-4 md:grid-cols-2'>
            {availablePermissions.map((group) => (
              <div key={group.group} className='rounded-md border bg-background p-3'>
                <p className='mb-2 text-sm font-semibold'>{group.group}</p>
                <div className='space-y-2'>
                  {group.items.map((item) => {
                    const checked = form.permisos_menu.includes(item.key);

                    return (
                      <label
                        key={item.key}
                        className='flex cursor-pointer items-start gap-2 text-sm'
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => togglePermission(item.key)}
                        />
                        <span>
                          <span className='font-medium'>{item.label}</span>
                          <span className='block text-xs text-muted-foreground'>
                            {item.path}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className='col-span-full flex justify-end gap-2'>
        <Button
          type='button'
          onClick={onCancel}
          className='text-gray-800 bg-gray-200 hover:bg-gray-300'
          disabled={loading}
        >
          Cancelar
        </Button>

        <Button type='submit' disabled={loading}>
          {loading
            ? 'Guardando...'
            : usuario
            ? 'Actualizar Usuario'
            : 'Crear Usuario'}
        </Button>
      </div>
    </form>
  );
}
