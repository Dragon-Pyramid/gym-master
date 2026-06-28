'use client';

import React from 'react';
import { useSidebar } from '../ui/sidebar';
import { Lock, Menu, Moon, Search, Settings, SlidersHorizontal, Sun, User } from 'lucide-react';
import ProfileImage from '@/components/perfil/ProfileImage';
import { HeaderNotificationsBell } from '@/components/header/HeaderNotificationsBell';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useRouter } from 'next/navigation';
import FechaHora from '../ui/FechaHora';
import Image from 'next/image';
import { useAuthStore } from '@/stores/authStore';

function useDarkMode() {
  const [dark, setDark] = React.useState(false);

  React.useEffect(() => {
    const savedSessionTheme = sessionStorage.getItem('theme');
    const initialDark = savedSessionTheme === 'dark';

    setDark(initialDark);
    document.documentElement.classList.toggle('dark', initialDark);
  }, []);

  const toggle = React.useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      sessionStorage.setItem('theme', next ? 'dark' : 'light');
      return next;
    });
  }, []);

  return { dark, toggle };
}

interface AppHeaderProps {
  title: string;
}

export const AppHeader = ({ title }: AppHeaderProps) => {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { isMobile, setOpenMobile } = useSidebar();
  const { dark, toggle } = useDarkMode();

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const handlePrimaryNavigation = () => {
    if (isMobile) {
      setOpenMobile(true);
      return;
    }

    router.push('/dashboard');
  };

  const userEmail = user?.email ?? '';
  const isAdmin = user?.rol === 'admin';

  return (
    <header className='sticky top-0 z-40 flex min-h-16 w-full flex-nowrap items-center justify-between gap-2 border-b border-border bg-background/95 px-2 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-3 md:px-4 md:py-3'>
      <div className='flex min-w-0 items-center gap-2 md:gap-3'>
        <Image
          src='/gm_logo.svg'
          alt='Gym Master Logo'
          width={isMobile ? 38 : 120}
          height={isMobile ? 38 : 120}
          className='shrink-0 rounded-sm dark:invert'
        />
        <h1 className='max-w-[34vw] truncate text-sm font-semibold tracking-tight sm:max-w-[46vw] sm:text-base md:max-w-none md:text-xl'>{title}</h1>
      </div>

      <div className='flex shrink-0 items-center gap-0.5 sm:gap-1 md:gap-4'>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                className='text-muted-foreground hover:text-foreground'
                onClick={toggle}
                aria-label='Cambiar modo claro/oscuro'
              >
                {dark ? <Moon className='h-5 w-5' /> : <Sun className='h-5 w-5' />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{dark ? 'Modo claro' : 'Modo oscuro'}</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className='hidden md:block'>
          <FechaHora />
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                className='text-muted-foreground hover:text-foreground'
                onClick={handlePrimaryNavigation}
                aria-label={isMobile ? 'Abrir menú del dashboard' : 'Buscar'}
              >
                {isMobile ? <Menu className='h-5 w-5' /> : <Search className='h-5 w-5' />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isMobile ? 'Abrir menú' : 'Buscar'}</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <HeaderNotificationsBell />

        <DropdownMenu>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='text-muted-foreground hover:text-foreground'
                    aria-label='Abrir configuración'
                  >
                    <Settings className='h-5 w-5' />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Configuración</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DropdownMenuContent align='end' className='w-56'>
            <DropdownMenuLabel>Configuración</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/dashboard/perfil')}>
              <User className='h-4 w-4' />
              Mi perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/dashboard/settings/preferences')}>
              <SlidersHorizontal className='h-4 w-4' />
              Preferencias
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/auth/change-password')}>
              <Lock className='h-4 w-4' />
              Cambiar contraseña
            </DropdownMenuItem>
            {isAdmin ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/dashboard/gimnasio-parametrizacion')}>
                  Datos del gimnasio
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/dashboard/parametrizacion')}>
                  Parametrización
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger>
            <div className='cursor-pointer'>
              <ProfileImage
                foto={user?.foto ?? null}
                size={40}
                showButton={false}
                alt={user?.nombre ?? 'Avatar'}
              />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuLabel>{userEmail}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/dashboard/perfil')}>
              Editar perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/dashboard/settings/preferences')}>
              Preferencias
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>Cerrar sesión</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
