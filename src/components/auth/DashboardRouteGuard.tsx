'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import {
  canAccessDashboardPath,
  getDashboardRoutePermission,
} from '@/lib/permissions/menuPermissions';

function DashboardRouteLoading() {
  return (
    <div className='flex min-h-screen items-center justify-center bg-background px-4 text-sm text-muted-foreground'>
      Validando acceso...
    </div>
  );
}

function DashboardRouteUnauthorized({
  permissionLabel,
}: {
  permissionLabel?: string;
}) {
  return (
    <main className='flex min-h-screen items-center justify-center bg-background px-4 py-8'>
      <section className='w-full max-w-xl rounded-2xl border border-red-300 bg-red-50/95 p-6 text-center shadow-lg shadow-red-900/10 dark:border-red-900/70 dark:bg-red-950/80'>
        <div className='mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300'>
          <ShieldAlert className='h-7 w-7' aria-hidden='true' />
        </div>

        <h1 className='text-2xl font-bold tracking-tight text-red-700 dark:text-red-200'>
          USTED NO TIENE ACCESO A ESTE MENÚ
        </h1>

        <p className='mt-3 text-sm leading-6 text-red-900/80 dark:text-red-100/80'>
          Tu usuario no tiene permisos para ingresar a esta sección del panel.
          {permissionLabel
            ? ` Se requiere el módulo “${permissionLabel}”.`
            : ' Solicitá a un administrador que revise tus permisos.'}
        </p>

        <div className='mt-6 flex flex-col justify-center gap-3 sm:flex-row'>
          <Link
            href='/dashboard'
            className='inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90'
          >
            Volver al inicio
          </Link>
          <Link
            href='/auth/login'
            className='inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground'
          >
            Cambiar usuario
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function DashboardRouteGuard({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isInitialized, initializeAuth } =
    useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, isInitialized, router]);

  useEffect(() => {
    if (isInitialized && isAuthenticated && user?.must_change_password) {
      router.replace('/auth/change-password');
    }
  }, [isAuthenticated, isInitialized, router, user?.must_change_password]);

  if (!isInitialized) {
    return <DashboardRouteLoading />;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (user.must_change_password) {
    return <DashboardRouteLoading />;
  }

  const canAccess = canAccessDashboardPath(
    user.rol,
    user.permisos_menu ?? null,
    pathname
  );

  if (!canAccess) {
    const routePermission = getDashboardRoutePermission(pathname);

    return (
      <DashboardRouteUnauthorized
        permissionLabel={routePermission?.permissionKey}
      />
    );
  }

  return <>{children}</>;
}
