'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ShieldCheck, UserRound } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';
import { useI18n } from '@/i18n/I18nProvider';

export default function LoginEntryPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { isAuthenticated, initializeAuth, isInitialized, user } = useAuthStore();

  useEffect(() => {
    initializeAuth();
    if (isInitialized && isAuthenticated) {
      router.push(user?.must_change_password ? '/auth/change-password' : '/dashboard');
    }
  }, [initializeAuth, isAuthenticated, isInitialized, router, user?.must_change_password]);

  return (
    <div className='relative flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 py-10'>
      <div className='absolute right-4 top-4'>
        <LanguageSwitcher compact />
      </div>

      <div className='relative h-52 w-52 md:h-64 md:w-64'>
        <Image
          src='/gm_logo.svg'
          alt={t('common.logoAlt')}
          fill
          className='object-contain dark:invert'
          priority
        />
      </div>

      <div className='max-w-2xl text-center'>
        <p className='text-sm font-semibold uppercase tracking-[0.24em] text-primary'>
          {t('login.browserAuto')}
        </p>
        <h1 className='mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl'>
          {t('login.entryTitle')}
        </h1>
        <p className='mt-2 text-sm text-muted-foreground sm:text-base'>
          {t('login.entryDescription')}
        </p>
      </div>

      <div className='grid w-full max-w-3xl gap-4 md:grid-cols-2'>
        <Card className='border-primary/20'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <UserRound className='h-5 w-5' />
              {t('login.memberTitle')}
            </CardTitle>
            <CardDescription>{t('login.memberDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className='w-full'>
              <Link href='/auth/login/socio'>{t('login.memberAction')}</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className='border-primary/20'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <ShieldCheck className='h-5 w-5' />
              {t('login.adminTitle')}
            </CardTitle>
            <CardDescription>{t('login.adminDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant='outline' className='w-full'>
              <Link href='/auth/login/admin'>{t('login.adminAction')}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
