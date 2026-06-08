'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LockKeyhole, Moon, Sun } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getPasswordPolicyChecks } from '@/utils/passwordPolicy';
import { getToken } from '@/services/storageService';
import { useAuthStore } from '@/stores/authStore';

function useDarkMode() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const prefersSystem = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;
    const initial = saved ? saved === 'dark' : prefersSystem;
    setDark(initial);
    document.documentElement.classList.toggle('dark', initial);
  }, []);

  const toggle = () => {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('theme', next ? 'dark' : 'light');
      return next;
    });
  };

  return { dark, toggle };
}

export default function ChangePasswordPage() {
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    isInitialized,
    initializeAuth,
    refreshSession,
    logout,
  } = useAuthStore();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { dark, toggle } = useDarkMode();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, isInitialized, router]);

  const checks = useMemo(() => getPasswordPolicyChecks(password), [password]);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const isPasswordValid = Object.values(checks).every(Boolean) && passwordsMatch;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!isPasswordValid) {
      toast.error('La contraseña debe cumplir todos los requisitos y coincidir.');
      return;
    }

    const token = getToken();

    if (!token) {
      toast.error('Sesión vencida. Volvé a iniciar sesión.');
      router.replace('/auth/login');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ new_password: password }),
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok || !payload.token) {
        throw new Error(payload.error || 'No se pudo actualizar la contraseña');
      }

      refreshSession(payload.token);
      toast.success('Contraseña actualizada correctamente.');
      router.replace('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Error al cambiar contraseña');
    } finally {
      setLoading(false);
    }
  };

  if (!isInitialized || !isAuthenticated) {
    return null;
  }

  const isInitialPasswordChange = Boolean(user?.must_change_password);

  return (
    <div className='relative flex min-h-screen flex-col items-center justify-center bg-background px-4'>
      <div className='absolute right-4 top-4'>
        <Button
          variant='ghost'
          size='icon'
          onClick={toggle}
          aria-label='Cambiar modo claro/oscuro'
          title='Cambiar modo claro/oscuro'
        >
          {dark ? <Moon className='h-6 w-6' /> : <Sun className='h-6 w-6' />}
        </Button>
      </div>

      <div className='mb-2 text-center'>
        <div className='relative mx-auto h-40 w-40 md:h-52 md:w-52'>
          <Image
            src='/gm_logo.svg'
            alt='Gym Master Logo'
            fill
            className='object-contain dark:invert'
            priority
          />
        </div>
      </div>

      <Card className='w-full max-w-md'>
        <CardHeader className='space-y-2 text-center'>
          <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary'>
            <LockKeyhole className='h-6 w-6' />
          </div>
          <CardTitle>{isInitialPasswordChange ? 'Cambiá tu contraseña inicial' : 'Cambiar contraseña'}</CardTitle>
          <CardDescription>
            {isInitialPasswordChange
              ? 'Tu usuario fue creado con una contraseña temporal. Para continuar, debés definir una contraseña personal y segura.'
              : 'Actualizá tu contraseña personal manteniendo los requisitos de seguridad de Gym Master.'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='grid gap-2'>
              <Label htmlFor='password'>Nueva contraseña</Label>
              <div className='relative'>
                <Input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className='pr-12'
                  autoComplete='new-password'
                  required
                />
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground'
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                </Button>
              </div>
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='confirmPassword'>Confirmar contraseña</Label>
              <div className='relative'>
                <Input
                  id='confirmPassword'
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className='pr-12'
                  autoComplete='new-password'
                  required
                />
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground'
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  aria-label={showConfirmPassword ? 'Ocultar confirmación' : 'Mostrar confirmación'}
                >
                  {showConfirmPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                </Button>
              </div>
            </div>

            <div className='rounded-lg border bg-muted/30 p-3 text-sm'>
              <p className='mb-2 font-medium'>Requisitos de seguridad</p>
              <div className='grid gap-1'>
                <span className={checks.minLength ? 'text-emerald-600' : 'text-red-600'}>
                  • Mínimo 8 caracteres
                </span>
                <span className={checks.uppercase ? 'text-emerald-600' : 'text-red-600'}>
                  • Al menos una mayúscula
                </span>
                <span className={checks.lowercase ? 'text-emerald-600' : 'text-red-600'}>
                  • Al menos una minúscula
                </span>
                <span className={checks.number ? 'text-emerald-600' : 'text-red-600'}>
                  • Al menos un número
                </span>
                <span className={checks.symbol ? 'text-emerald-600' : 'text-red-600'}>
                  • Al menos un símbolo
                </span>
                <span className={passwordsMatch ? 'text-emerald-600' : 'text-red-600'}>
                  • Ambas contraseñas coinciden
                </span>
              </div>
            </div>

            <Button type='submit' className='w-full' disabled={loading}>
              {loading ? 'Actualizando...' : 'Guardar nueva contraseña'}
            </Button>

            <Button
              type='button'
              variant='ghost'
              className='w-full'
              onClick={() => {
                logout();
                router.replace('/auth/login');
              }}
            >
              Cambiar usuario
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
