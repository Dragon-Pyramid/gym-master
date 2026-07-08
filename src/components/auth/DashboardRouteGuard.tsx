'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { LockKeyhole, RefreshCcw, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import {
  canAccessDashboardPath,
  getDashboardRoutePermission,
} from '@/lib/permissions/menuPermissions';
import { getDragonPyramidLicenseSuspensionStatus } from '@/services/apiClient';
import type { DragonPyramidSuspensionStatus } from '@/utils/dragonPyramidSuspension';
import { useI18n } from '@/i18n/I18nProvider';

function DashboardRouteLoading() {
  const { t } = useI18n();

  return (
    <div className='flex min-h-screen items-center justify-center bg-background px-4 text-sm text-muted-foreground'>
      {t('common.validatingAccess')}
    </div>
  );
}


function isSuspensionBypassDashboardPath(pathname?: string | null) {
  if (!pathname) return false;
  return pathname === '/dashboard/masteradmin/license' || pathname.startsWith('/dashboard/masteradmin/');
}

function DashboardRouteSuspended({
  suspensionStatus,
}: {
  suspensionStatus: DragonPyramidSuspensionStatus;
}) {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  const handleReload = () => {
    window.location.reload();
  };

  const handleChangeUser = () => {
    logout();
    router.replace('/auth/login');
  };

  return (
    <main className='grid h-[100dvh] max-h-[100dvh] min-h-0 overflow-hidden bg-background px-4 py-6'>
      <section className='m-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-red-300 bg-red-50/95 p-6 text-center shadow-2xl shadow-red-950/10 dark:border-red-900/70 dark:bg-red-950/85'>
        <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-200'>
          <LockKeyhole className='h-8 w-8' aria-hidden='true' />
        </div>

        <p className='text-xs font-black uppercase tracking-[0.28em] text-red-700 dark:text-red-200'>
          Dragon Pyramid · Control de licencia
        </p>
        <h1 className='mt-3 text-2xl font-black tracking-tight text-red-800 dark:text-red-100 sm:text-3xl'>
          {suspensionStatus.title}
        </h1>
        <p className='mx-auto mt-3 max-w-xl text-sm leading-6 text-red-950/80 dark:text-red-100/85'>
          {suspensionStatus.message}
        </p>

        {suspensionStatus.clientName ? (
          <div className='mx-auto mt-5 max-w-md rounded-2xl border border-red-200 bg-white/70 p-4 text-left text-sm dark:border-red-900/70 dark:bg-red-950/40'>
            <p className='text-xs font-bold uppercase tracking-wide text-red-700 dark:text-red-200'>Cliente</p>
            <p className='mt-1 font-black text-red-950 dark:text-red-50'>{suspensionStatus.clientName}</p>
          </div>
        ) : null}

        {suspensionStatus.details.length > 0 ? (
          <ul className='mx-auto mt-5 max-w-xl space-y-2 rounded-2xl border border-red-200 bg-white/70 p-4 text-left text-sm text-red-950/85 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-100/85'>
            {suspensionStatus.details.map((detail) => (
              <li key={detail} className='leading-6'>• {detail}</li>
            ))}
          </ul>
        ) : null}

        <div className='mt-6 grid gap-3 sm:grid-cols-3'>
          <button
            type='button'
            onClick={handleReload}
            className='inline-flex h-11 items-center justify-center rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-900 transition-colors hover:bg-red-50 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-100 dark:hover:bg-red-950/50'
          >
            <RefreshCcw className='mr-2 h-4 w-4' />
            Reintentar
          </button>
          <Link
            href='/auth/login/masteradmin'
            className='inline-flex h-11 items-center justify-center rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-800 dark:bg-red-600 dark:hover:bg-red-500'
          >
            Acceso Dragon Pyramid
          </Link>
          <button
            type='button'
            onClick={handleChangeUser}
            className='inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-semibold transition-colors hover:bg-accent hover:text-accent-foreground'
          >
            Cambiar usuario
          </button>
        </div>

        <p className='mt-5 text-xs leading-5 text-red-900/70 dark:text-red-100/70'>
          El bloqueo no afecta el acceso reservado Master Admin ni la sincronización interna de Dragon Pyramid para permitir regularización o reactivación del servicio.
        </p>
      </section>
    </main>
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
  const [suspensionStatus, setSuspensionStatus] =
    useState<DragonPyramidSuspensionStatus | null>(null);
  const [loadingSuspensionStatus, setLoadingSuspensionStatus] = useState(false);

  const shouldCheckSuspension = useMemo(
    () =>
      Boolean(
        isInitialized &&
          isAuthenticated &&
          user &&
          user.rol !== 'masteradmin' &&
          !isSuspensionBypassDashboardPath(pathname),
      ),
    [isAuthenticated, isInitialized, pathname, user],
  );

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

  useEffect(() => {
    if (!shouldCheckSuspension) {
      setSuspensionStatus(null);
      setLoadingSuspensionStatus(false);
      return;
    }

    let isMounted = true;
    setLoadingSuspensionStatus(true);

    getDragonPyramidLicenseSuspensionStatus()
      .then((response) => {
        if (!isMounted) return;
        setSuspensionStatus(response.ok ? response.data ?? null : null);
      })
      .catch(() => {
        if (!isMounted) return;
        // Fail open: si el aviso de licencia no puede consultarse por un error temporal,
        // no bloqueamos accidentalmente la operación del cliente.
        setSuspensionStatus(null);
      })
      .finally(() => {
        if (!isMounted) return;
        setLoadingSuspensionStatus(false);
      });

    return () => {
      isMounted = false;
    };
  }, [shouldCheckSuspension, pathname]);

  if (!isInitialized) {
    return <DashboardRouteLoading />;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (user.must_change_password) {
    return <DashboardRouteLoading />;
  }

  if (shouldCheckSuspension && loadingSuspensionStatus) {
    return <DashboardRouteLoading />;
  }

  if (shouldCheckSuspension && suspensionStatus?.isSuspended) {
    return <DashboardRouteSuspended suspensionStatus={suspensionStatus} />;
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
