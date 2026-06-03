'use client';

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff } from 'lucide-react';
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
import { buildInitialPasswordFromDni, getPasswordPolicyChecks } from '@/utils/passwordPolicy';

export interface UserFormProps {
  usuario?: Usuario | null;
  onCreated: () => void;
  onCancel: () => void;
}

const emptyForm = {
  nombre: '',
  email: '',
  password: '',
  confirmPassword: '',
  rol: 'socio',
  dni: '',
  telefono: '',
  direccion: '',
  sexo: '',
  fecnac: '',
  ciudad: '',
  provincia: '',
  pais: 'Argentina',
  contacto_emergencia_nombre: '',
  contacto_emergencia_telefono: '',
  fecha_alta: '',
  use_initial_password: true,
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (usuario) {
      setForm({
        nombre: usuario.nombre ?? '',
        email: usuario.email ?? '',
        rol: usuario.rol ?? 'socio',
        password: '',
        confirmPassword: '',
        dni: usuario.dni ?? '',
        telefono: '',
        direccion: '',
        sexo: '',
        fecnac: '',
        ciudad: '',
        provincia: '',
        pais: 'Argentina',
        contacto_emergencia_nombre: '',
        contacto_emergencia_telefono: '',
        fecha_alta: '',
        use_initial_password: false,
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
      if (isPasswordRequired) {
        if (!isPasswordValid) {
          toast.error('La contraseña debe tener mínimo 8 caracteres, mayúscula, minúscula, número y símbolo.');
          setLoading(false);
          return;
        }

        if (!passwordsMatch) {
          toast.error('La confirmación de contraseña no coincide.');
          setLoading(false);
          return;
        }
      }

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
        const useInitialPassword = form.use_initial_password;
        const initialPassword = buildInitialPasswordFromDni(form.dni);
        const createData: CreateUsuarioDto = {
          nombre: form.nombre,
          email: form.email,
          password: useInitialPassword ? initialPassword : form.password,
          rol,
          dni: form.dni,
          use_initial_password: useInitialPassword,
          permisos_menu:
            rol === 'admin'
              ? null
              : sanitizeMenuPermissionsForRole(rol, form.permisos_menu),
          ...(rol === 'socio' && {
            telefono: form.telefono,
            direccion: form.direccion,
            sexo: form.sexo ? (form.sexo as 'M' | 'F') : null,
            fecnac: form.fecnac || null,
            ciudad: form.ciudad,
            provincia: form.provincia,
            pais: form.pais,
            contacto_emergencia_nombre: form.contacto_emergencia_nombre,
            contacto_emergencia_telefono: form.contacto_emergencia_telefono,
            fecha_alta: form.fecha_alta || null,
          }),
        };

        if (useInitialPassword && !form.dni.trim()) {
          toast.error('El DNI es obligatorio para generar la contraseña inicial.');
          setLoading(false);
          return;
        }

        if (!useInitialPassword && !createData.password) {
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
        toast.success(
          useInitialPassword
            ? `Usuario creado. Contraseña inicial: ${initialPassword}`
            : 'Usuario creado exitosamente.'
        );
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
  const isInternalUser = form.rol === 'usuario';
  const availablePermissions = getAvailableMenuPermissionsForRole(form.rol);
  const isInitialPasswordMode = !usuario && form.use_initial_password;
  const normalizedDni = form.dni.replace(/\D/g, '');
  const initialPasswordPreview = normalizedDni
    ? buildInitialPasswordFromDni(normalizedDni)
    : 'GymMaster + DNI';
  const passwordChecks = getPasswordPolicyChecks(form.password);
  const isPasswordRequired = !isInitialPasswordMode && (!usuario || form.password.length > 0 || form.confirmPassword.length > 0);
  const isPasswordValid = Object.values(passwordChecks).every(Boolean);
  const passwordsMatch = form.password === form.confirmPassword && form.confirmPassword.length > 0;
  const showPasswordRules = isPasswordRequired || form.password.length > 0 || form.confirmPassword.length > 0;

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

      {!usuario && (
        <div className='flex flex-col gap-1.5'>
          <Label htmlFor='dni'>DNI</Label>
          <Input
            id='dni'
            name='dni'
            placeholder='Ingrese DNI para contraseña inicial'
            value={form.dni}
            onChange={handleChange}
            required={isSocio || isInitialPasswordMode}
          />
        </div>
      )}

      {!usuario && isSocio && (
        <div className='col-span-full rounded-lg border bg-muted/20 p-4'>
          <div className='mb-3'>
            <h3 className='text-base font-semibold'>Datos operativos del socio</h3>
            <p className='text-sm text-muted-foreground'>
              Estos datos crean el perfil de socio vinculado al usuario. Después se pueden revisar o modificar desde el menú Socios.
            </p>
          </div>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='telefono'>Teléfono</Label>
              <Input
                id='telefono'
                name='telefono'
                placeholder='Ingrese teléfono'
                value={form.telefono}
                onChange={handleChange}
              />
            </div>

            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='sexo'>Sexo</Label>
              <select
                id='sexo'
                name='sexo'
                value={form.sexo}
                onChange={handleChange}
                className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
              >
                <option value=''>Seleccionar</option>
                <option value='M'>Masculino</option>
                <option value='F'>Femenino</option>
              </select>
            </div>

            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='fecnac'>Fecha de nacimiento</Label>
              <Input
                id='fecnac'
                name='fecnac'
                type='date'
                value={form.fecnac}
                onChange={handleChange}
              />
            </div>

            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='fecha_alta'>Fecha de alta</Label>
              <Input
                id='fecha_alta'
                name='fecha_alta'
                type='date'
                value={form.fecha_alta}
                onChange={handleChange}
              />
            </div>

            <div className='flex flex-col gap-1.5 md:col-span-2'>
              <Label htmlFor='direccion'>Dirección</Label>
              <Input
                id='direccion'
                name='direccion'
                placeholder='Ingrese dirección'
                value={form.direccion}
                onChange={handleChange}
              />
            </div>

            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='ciudad'>Ciudad</Label>
              <Input
                id='ciudad'
                name='ciudad'
                placeholder='Ingrese ciudad'
                value={form.ciudad}
                onChange={handleChange}
              />
            </div>

            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='provincia'>Provincia</Label>
              <Input
                id='provincia'
                name='provincia'
                placeholder='Ingrese provincia'
                value={form.provincia}
                onChange={handleChange}
              />
            </div>

            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='pais'>País</Label>
              <Input
                id='pais'
                name='pais'
                placeholder='Ingrese país'
                value={form.pais}
                onChange={handleChange}
              />
            </div>

            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='contacto_emergencia_nombre'>Contacto de emergencia</Label>
              <Input
                id='contacto_emergencia_nombre'
                name='contacto_emergencia_nombre'
                placeholder='Nombre del contacto'
                value={form.contacto_emergencia_nombre}
                onChange={handleChange}
              />
            </div>

            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='contacto_emergencia_telefono'>Teléfono de emergencia</Label>
              <Input
                id='contacto_emergencia_telefono'
                name='contacto_emergencia_telefono'
                placeholder='Teléfono para urgencias'
                value={form.contacto_emergencia_telefono}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
      )}

      {!usuario && (
        <div className='col-span-full rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900 dark:border-sky-900/70 dark:bg-sky-950/40 dark:text-sky-100'>
          <label className='flex cursor-pointer items-start gap-2'>
            <Checkbox
              checked={form.use_initial_password}
              onCheckedChange={(checked) =>
                setForm((prev) => ({
                  ...prev,
                  use_initial_password: Boolean(checked),
                  password: Boolean(checked) ? '' : prev.password,
                  confirmPassword: Boolean(checked) ? '' : prev.confirmPassword,
                }))
              }
            />
            <span>
              <span className='font-medium'>
                Usar contraseña inicial automática
              </span>
              <span className='block text-xs'>
                Patrón: <strong>{initialPasswordPreview}</strong>. En el primer
                ingreso el usuario deberá cambiarla obligatoriamente.
              </span>
            </span>
          </label>
        </div>
      )}

      {!isInitialPasswordMode && (
        <>
      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='password'>Contraseña</Label>
        <div className='relative'>
          <Input
            id='password'
            name='password'
            type={showPassword ? 'text' : 'password'}
            placeholder={
              usuario ? 'Dejar vacío para no cambiar' : 'Ingrese contraseña'
            }
            value={form.password}
            onChange={handleChange}
            required={!usuario}
            className='pr-10'
          />
          <button
            type='button'
            onClick={() => setShowPassword((prev) => !prev)}
            className='absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-md text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
          </button>
        </div>
      </div>

      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='confirmPassword'>Confirmar contraseña</Label>
        <div className='relative'>
          <Input
            id='confirmPassword'
            name='confirmPassword'
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder={usuario ? 'Repetir solo si cambia contraseña' : 'Repita la contraseña'}
            value={form.confirmPassword}
            onChange={handleChange}
            required={!usuario}
            className='pr-10'
          />
          <button
            type='button'
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className='absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-md text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
            aria-label={showConfirmPassword ? 'Ocultar confirmación de contraseña' : 'Mostrar confirmación de contraseña'}
            title={showConfirmPassword ? 'Ocultar confirmación de contraseña' : 'Mostrar confirmación de contraseña'}
          >
            {showConfirmPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
          </button>
        </div>
      </div>

        </>
      )}

      {showPasswordRules && (
        <div className='col-span-full rounded-md border bg-muted/20 p-3 text-sm'>
          <p className='mb-2 font-medium'>Requisitos de contraseña</p>
          <div className='grid gap-1 md:grid-cols-2'>
            <span className={passwordChecks.minLength ? 'text-emerald-600' : 'text-red-600'}>• Mínimo 8 caracteres</span>
            <span className={passwordChecks.uppercase ? 'text-emerald-600' : 'text-red-600'}>• Al menos una mayúscula</span>
            <span className={passwordChecks.lowercase ? 'text-emerald-600' : 'text-red-600'}>• Al menos una minúscula</span>
            <span className={passwordChecks.number ? 'text-emerald-600' : 'text-red-600'}>• Al menos un número</span>
            <span className={passwordChecks.symbol ? 'text-emerald-600' : 'text-red-600'}>• Al menos un símbolo</span>
            <span className={passwordsMatch ? 'text-emerald-600' : 'text-red-600'}>• Ambas contraseñas coinciden</span>
          </div>
        </div>
      )}

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
          <>
            {isInternalUser && (
              <div className='mb-4 rounded-md border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900 dark:border-sky-900/70 dark:bg-sky-950/40 dark:text-sky-100'>
                Este usuario interno puede representar a un empleado administrativo.
                Marcá solo los módulos que podrá ver y utilizar. El menú lateral
                mostrará únicamente las opciones habilitadas y las rutas no
                permitidas quedarán bloqueadas por seguridad.
              </div>
            )}
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
          </>
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
