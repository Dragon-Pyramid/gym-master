'use client';

import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, MailCheck, Moon, Sun } from 'lucide-react';
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
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';
import { useI18n } from '@/i18n/I18nProvider';
import { translateAuthMessage } from '@/i18n/authErrorMessages';

type LoginRole = 'admin' | 'usuario' | 'socio';

const roleValues: LoginRole[] = ['admin', 'usuario', 'socio'];

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

function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const { dark, toggle } = useDarkMode();
  const { t } = useI18n();
  const initialRole = searchParams.get('rol') as LoginRole | null;
  const safeInitialRole = roleValues.includes(initialRole as LoginRole) ? initialRole : 'socio';

  const [email, setEmail] = useState('');
  const [rol, setRol] = useState<LoginRole>(safeInitialRole ?? 'socio');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const roleOptions = useMemo(
    () => [
      { value: 'admin' as const, label: t('preferences.roleAdmin') },
      { value: 'usuario' as const, label: t('preferences.roleInternalUser') },
      { value: 'socio' as const, label: t('preferences.roleMember') },
    ],
    [t],
  );

  const backHref = useMemo(() => {
    if (rol === 'socio') return '/auth/login/socio';
    if (rol === 'admin' || rol === 'usuario') return '/auth/login/admin';
    return '/auth/login';
  }, [rol]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!email.trim()) {
      toast.error(t('auth.forgot.emailRequired'));
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), rol }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || t('auth.errors.requestFailed'));
      }

      setSent(true);
      toast.success(
        translateAuthMessage(payload.message, t, 'auth.recovery.requestProcessedToast'),
      );
    } catch (error: any) {
      toast.error(translateAuthMessage(error.message, t, 'auth.errors.requestFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='relative flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10'>
      <div className='absolute left-4 top-4'>
        <Button variant='ghost' asChild>
          <Link href={backHref}>
            <ArrowLeft className='mr-2 h-4 w-4' />
            {t('auth.common.backToLogin')}
          </Link>
        </Button>
      </div>

      <div className='absolute right-4 top-4 flex items-center gap-2'>
        <Button
          variant='ghost'
          size='icon'
          onClick={toggle}
          aria-label={t('auth.common.themeToggle')}
          title={t('auth.common.themeToggle')}
        >
          {dark ? <Moon className='h-6 w-6' /> : <Sun className='h-6 w-6' />}
        </Button>
        <LanguageSwitcher compact />
      </div>

      <div className='mb-2 text-center'>
        <div className='relative mx-auto h-40 w-40 md:h-52 md:w-52'>
          <Image
            src='/gm_logo.svg'
            alt={t('common.logoAlt')}
            fill
            className='object-contain dark:invert'
            priority
          />
        </div>
      </div>

      <Card className='w-full max-w-md'>
        <CardHeader className='space-y-2 text-center'>
          <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary'>
            <MailCheck className='h-6 w-6' />
          </div>
          <CardTitle>{t('auth.forgot.title')}</CardTitle>
          <CardDescription>{t('auth.forgot.description')}</CardDescription>
        </CardHeader>

        <CardContent>
          {sent ? (
            <div className='space-y-4'>
              <div className='rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-100'>
                {t('auth.forgot.sentMessage')}
              </div>
              <Button asChild className='w-full'>
                <Link href={backHref}>{t('auth.common.backToLogin')}</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div className='grid gap-2'>
                <Label htmlFor='rol'>{t('auth.common.accessType')}</Label>
                <select
                  id='rol'
                  value={rol}
                  onChange={(event) => setRol(event.target.value as LoginRole)}
                  className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='email'>{t('auth.common.email')}</Label>
                <Input
                  id='email'
                  type='email'
                  placeholder='usuario@correo.com'
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete='email'
                  required
                />
              </div>

              <div className='rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground'>
                {t('auth.forgot.privacyNotice')}
              </div>

              <Button type='submit' className='w-full' disabled={loading}>
                {loading ? t('auth.forgot.submitting') : t('auth.forgot.submit')}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
