'use client';

import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Moon, Sun } from 'lucide-react';
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
import { useI18n } from '@/i18n/I18nProvider';

function useDarkMode() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const prefersSystem = window.matchMedia('(prefers-color-scheme: dark)').matches;
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

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const { dark, toggle } = useDarkMode();
  const { t } = useI18n();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(Boolean(token));
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [emailMasked, setEmailMasked] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenError('El enlace de recuperación no contiene token.');
      setValidating(false);
      return;
    }

    let mounted = true;

    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload.valid) {
          throw new Error(payload.message || 'El enlace no es válido o expiró');
        }
        if (mounted) setEmailMasked(payload.email_masked ?? null);
      })
      .catch((error) => {
        if (mounted) setTokenError(error.message || 'El enlace no es válido o expiró');
      })
      .finally(() => {
        if (mounted) setValidating(false);
      });

    return () => {
      mounted = false;
    };
  }, [token]);

  const checks = useMemo(() => getPasswordPolicyChecks(password), [password]);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const isPasswordValid = Object.values(checks).every(Boolean) && passwordsMatch;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!isPasswordValid) {
      toast.error('La contraseña debe cumplir todos los requisitos y coincidir.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'No se pudo restablecer la contraseña');
      }

      setDone(true);
      toast.success(payload.message || 'Contraseña actualizada correctamente.');
    } catch (error: any) {
      toast.error(error.message || 'No se pudo restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='relative flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10'>
      <div className='absolute left-4 top-4'>
        <Button variant='ghost' asChild>
          <Link href='/auth/login'>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Volver
          </Link>
        </Button>
      </div>

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
          <CardTitle>Crear nueva contraseña</CardTitle>
          <CardDescription>
            Definí una contraseña segura para volver a ingresar a Gym Master.
            {emailMasked ? <span className='block'>Cuenta: {emailMasked}</span> : null}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {validating ? (
            <div className='py-8 text-center text-sm text-muted-foreground'>{t('login.validatingRecoveryLink')}</div>
          ) : tokenError ? (
            <div className='space-y-4'>
              <div className='rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-100'>
                {tokenError}
              </div>
              <Button asChild className='w-full'>
                <Link href='/auth/forgot-password'>Solicitar nuevo enlace</Link>
              </Button>
            </div>
          ) : done ? (
            <div className='space-y-4'>
              <div className='rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-100'>
                Tu contraseña fue actualizada correctamente. Ya podés iniciar sesión.
              </div>
              <Button asChild className='w-full'>
                <Link href='/auth/login'>Ir al login</Link>
              </Button>
            </div>
          ) : (
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
                  <span className={checks.minLength ? 'text-emerald-600' : 'text-red-600'}>• Mínimo 8 caracteres</span>
                  <span className={checks.uppercase ? 'text-emerald-600' : 'text-red-600'}>• Al menos una mayúscula</span>
                  <span className={checks.lowercase ? 'text-emerald-600' : 'text-red-600'}>• Al menos una minúscula</span>
                  <span className={checks.number ? 'text-emerald-600' : 'text-red-600'}>• Al menos un número</span>
                  <span className={checks.symbol ? 'text-emerald-600' : 'text-red-600'}>• Al menos un símbolo</span>
                  <span className={passwordsMatch ? 'text-emerald-600' : 'text-red-600'}>• Ambas contraseñas coinciden</span>
                </div>
              </div>

              <Button type='submit' className='w-full' disabled={loading || !isPasswordValid}>
                {loading ? 'Actualizando...' : 'Guardar nueva contraseña'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}
