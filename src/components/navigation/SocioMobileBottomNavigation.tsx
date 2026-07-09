'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CreditCard,
  Dumbbell,
  Home,
  Utensils,
  UserRound,
} from 'lucide-react';
import { useEffect } from 'react';
import type { ElementType } from 'react';

import { useIsMobile } from '@/hooks/use-mobile';
import { useAuthStore } from '@/stores/authStore';
import { useI18n } from '@/i18n/I18nProvider';

type SocioBottomNavItem = {
  labelKey: string;
  href: string;
  icon: ElementType;
  isActive: (pathname: string) => boolean;
};

const socioBottomNavItems: SocioBottomNavItem[] = [
  {
    labelKey: 'socioDashboard.bottomNav.home',
    href: '/dashboard',
    icon: Home,
    isActive: (pathname) => pathname === '/dashboard' || pathname === '/dashboard/',
  },
  {
    labelKey: 'socioDashboard.bottomNav.routine',
    href: '/dashboard/rutinas/asistente',
    icon: Dumbbell,
    isActive: (pathname) => pathname.startsWith('/dashboard/rutinas'),
  },
  {
    labelKey: 'socioDashboard.bottomNav.diet',
    href: '/dashboard/dietas',
    icon: Utensils,
    isActive: (pathname) =>
      pathname.startsWith('/dashboard/dietas') ||
      pathname.startsWith('/dashboard/gestion-dietas'),
  },
  {
    labelKey: 'socioDashboard.bottomNav.payments',
    href: '/dashboard/mi-cuenta/pagar-cuota',
    icon: CreditCard,
    isActive: (pathname) =>
      pathname.startsWith('/dashboard/mi-cuenta') ||
      pathname.startsWith('/dashboard/pagos') ||
      pathname.startsWith('/dashboard/cuotas'),
  },
  {
    labelKey: 'socioDashboard.bottomNav.profile',
    href: '/dashboard/perfil',
    icon: UserRound,
    isActive: (pathname) => pathname.startsWith('/dashboard/perfil'),
  },
];

export function SocioMobileBottomNavigation() {
  const pathname = usePathname() ?? '';
  const { t } = useI18n();
  const isMobile = useIsMobile();
  const { user, isAuthenticated } = useAuthStore();

  const isSocio = user?.rol?.trim().toLowerCase() === 'socio';
  const shouldShow = isAuthenticated && isSocio && isMobile;

  useEffect(() => {
    document.body.classList.toggle('gm-socio-bottom-nav', shouldShow);

    return () => {
      document.body.classList.remove('gm-socio-bottom-nav');
    };
  }, [shouldShow]);

  if (!shouldShow) return null;

  return (
    <nav
      aria-label={t('socioDashboard.bottomNav.aria')}
      className='gm-pwa-bottom-nav fixed inset-x-0 bottom-0 z-[80] border-t border-slate-200 bg-white/95 px-2 pb-[calc(0.6rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_28px_rgba(15,23,42,0.16)] backdrop-blur supports-[backdrop-filter]:bg-white/85 md:hidden dark:border-slate-800 dark:bg-slate-950/95 dark:supports-[backdrop-filter]:bg-slate-950/85'
    >
      <div className='mx-auto grid max-w-md grid-cols-5 gap-1'>
        {socioBottomNavItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive(pathname);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              aria-label={t(item.labelKey)}
              className={`group flex min-h-[3.45rem] min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1.5 py-1.5 text-[10px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                active
                  ? 'bg-sky-50 text-sky-700 shadow-sm ring-1 ring-sky-100 dark:bg-sky-950/60 dark:text-sky-100 dark:ring-sky-800'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Icon
                className={`h-5 w-5 transition ${
                  active ? 'scale-110' : 'group-hover:-translate-y-0.5'
                }`}
                aria-hidden='true'
              />
              <span className='max-w-full truncate leading-none tracking-[-0.01em]'>{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
