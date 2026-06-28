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

type SocioBottomNavItem = {
  label: string;
  href: string;
  icon: ElementType;
  isActive: (pathname: string) => boolean;
};

const socioBottomNavItems: SocioBottomNavItem[] = [
  {
    label: 'Inicio',
    href: '/dashboard',
    icon: Home,
    isActive: (pathname) => pathname === '/dashboard' || pathname === '/dashboard/',
  },
  {
    label: 'Rutina',
    href: '/dashboard/rutinas/asistente',
    icon: Dumbbell,
    isActive: (pathname) => pathname.startsWith('/dashboard/rutinas'),
  },
  {
    label: 'Dieta',
    href: '/dashboard/dietas',
    icon: Utensils,
    isActive: (pathname) =>
      pathname.startsWith('/dashboard/dietas') ||
      pathname.startsWith('/dashboard/gestion-dietas'),
  },
  {
    label: 'Pagos',
    href: '/dashboard/mi-cuenta/pagar-cuota',
    icon: CreditCard,
    isActive: (pathname) =>
      pathname.startsWith('/dashboard/mi-cuenta') ||
      pathname.startsWith('/dashboard/pagos') ||
      pathname.startsWith('/dashboard/cuotas'),
  },
  {
    label: 'Perfil',
    href: '/dashboard/perfil',
    icon: UserRound,
    isActive: (pathname) => pathname.startsWith('/dashboard/perfil'),
  },
];

export function SocioMobileBottomNavigation() {
  const pathname = usePathname() ?? '';
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
      aria-label='Navegación principal del socio'
      className='gm-pwa-bottom-nav fixed inset-x-0 bottom-0 z-[80] border-t border-slate-200 bg-white px-2 pb-[calc(0.55rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_22px_rgba(15,23,42,0.12)] md:hidden dark:border-slate-800 dark:bg-slate-950'
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
              className={`group flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1.5 py-1.5 text-[10px] font-semibold transition ${
                active
                  ? 'bg-sky-50 text-sky-700 shadow-sm ring-1 ring-sky-100 dark:bg-sky-950/50 dark:text-sky-200 dark:ring-sky-800'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Icon
                className={`h-5 w-5 transition ${
                  active ? 'scale-110' : 'group-hover:-translate-y-0.5'
                }`}
                aria-hidden='true'
              />
              <span className='max-w-full truncate leading-none'>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
