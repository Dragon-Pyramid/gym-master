'use client';

import { CheckCircle2, RefreshCw, WifiOff, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuthStore } from '@/stores/authStore';
import { useI18n } from '@/i18n/I18nProvider';

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;
const ONLINE_RESTORED_VISIBLE_MS = 4500;
const UPDATE_ACTIVATION_TIMEOUT_MS = 10_000;

function isStandaloneMode() {
  if (typeof window === 'undefined') return false;

  const navigatorWithStandalone = window.navigator as Navigator & {
    standalone?: boolean;
  };

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    navigatorWithStandalone.standalone === true
  );
}

function requestRegistrationUpdate(registration: ServiceWorkerRegistration) {
  if (!window.navigator.onLine) return;

  void registration.update().catch(() => {
    // An update check is opportunistic. Network or browser failures must not
    // interrupt the active Gym Master session.
  });
}

export function PwaConnectionUpdateBanner() {
  const isMobile = useIsMobile();
  const { t } = useI18n();
  const { user, isAuthenticated } = useAuthStore();

  const [isOnline, setIsOnline] = useState(true);
  const [showOnlineRestored, setShowOnlineRestored] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  const onlineRestoredTimerRef = useRef<number | null>(null);
  const wasOfflineRef = useRef(false);

  const isSocio = user?.rol?.trim().toLowerCase() === 'socio';
  const isSocioMobile = isSocio && isMobile;

  // Mobile users keep the original compact experience. Any authenticated role
  // also receives update/offline notices when Gym Master runs as an installed
  // standalone app on desktop, tablet or mobile.
  const shouldShowPwaStatus =
    isAuthenticated && (isMobile || isStandalone);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initialOnline = window.navigator.onLine;

    wasOfflineRef.current = !initialOnline;
    setIsOnline(initialOnline);
    setIsStandalone(isStandaloneMode());

    const handleDisplayModeChange = () => {
      setIsStandalone(isStandaloneMode());
    };

    const handleOffline = () => {
      wasOfflineRef.current = true;
      setIsOnline(false);
      setShowOnlineRestored(false);
    };

    const handleOnline = () => {
      setIsOnline(true);

      if (wasOfflineRef.current) {
        setShowOnlineRestored(true);

        if (onlineRestoredTimerRef.current) {
          window.clearTimeout(onlineRestoredTimerRef.current);
        }

        onlineRestoredTimerRef.current = window.setTimeout(() => {
          wasOfflineRef.current = false;
          setShowOnlineRestored(false);
        }, ONLINE_RESTORED_VISIBLE_MS);
      }
    };

    const mediaQuery = window.matchMedia('(display-mode: standalone)');

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      mediaQuery.removeEventListener('change', handleDisplayModeChange);

      if (onlineRestoredTimerRef.current) {
        window.clearTimeout(onlineRestoredTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    let intervalId: number | null = null;
    let cleanupRegistrationWatch: (() => void) | undefined;
    let activeRegistration: ServiceWorkerRegistration | null = null;

    const markUpdateReady = () => {
      setUpdateReady(true);
    };

    const watchRegistration = (registration: ServiceWorkerRegistration) => {
      activeRegistration = registration;

      if (registration.waiting && navigator.serviceWorker.controller) {
        markUpdateReady();
      }

      const handleUpdateFound = () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        const handleStateChange = () => {
          if (
            newWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            markUpdateReady();
          }
        };

        newWorker.addEventListener('statechange', handleStateChange);
      };

      registration.addEventListener('updatefound', handleUpdateFound);

      return () => {
        registration.removeEventListener('updatefound', handleUpdateFound);
      };
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && activeRegistration) {
        requestRegistrationUpdate(activeRegistration);
      }
    };

    const handleOnlineUpdateCheck = () => {
      if (activeRegistration) {
        requestRegistrationUpdate(activeRegistration);
      }
    };

    navigator.serviceWorker.ready
      .then((registration) => {
        cleanupRegistrationWatch = watchRegistration(registration);
        requestRegistrationUpdate(registration);

        intervalId = window.setInterval(() => {
          requestRegistrationUpdate(registration);
        }, UPDATE_CHECK_INTERVAL_MS);
      })
      .catch(() => {
        // Online/offline feedback remains available even when registration
        // cannot be resolved in the current browser.
      });

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnlineUpdateCheck);

    return () => {
      cleanupRegistrationWatch?.();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnlineUpdateCheck);

      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, []);

  const handleUpdateNow = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return;

    setIsRefreshing(true);

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const waitingWorker = registration?.waiting;

      if (!waitingWorker) {
        setUpdateReady(false);
        setIsRefreshing(false);

        if (registration) {
          requestRegistrationUpdate(registration);
        }

        return;
      }

      await new Promise<void>((resolve) => {
        let completed = false;

        const finish = () => {
          if (completed) return;
          completed = true;
          window.clearTimeout(timeoutId);
          navigator.serviceWorker.removeEventListener(
            'controllerchange',
            handleControllerChange,
          );
          resolve();
        };

        const handleControllerChange = () => {
          finish();
        };

        const timeoutId = window.setTimeout(
          finish,
          UPDATE_ACTIVATION_TIMEOUT_MS,
        );

        navigator.serviceWorker.addEventListener(
          'controllerchange',
          handleControllerChange,
        );

        waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      });
    } catch {
      // A controlled reload is still the safest recovery if the waiting worker
      // disappeared between detection and user confirmation.
    }

    window.location.reload();
  }, []);

  const handleDismissUpdate = () => {
    setUpdateReady(false);
  };

  const banner = useMemo(() => {
    if (!isOnline) {
      return {
        kind: 'offline' as const,
        icon: WifiOff,
        title: t('socioDashboard.pwa.offlineTitle'),
        body: t('socioDashboard.pwa.offlineBody'),
      };
    }

    if (updateReady) {
      return {
        kind: 'update' as const,
        icon: RefreshCw,
        title: t('socioDashboard.pwa.updateTitle'),
        body: t('socioDashboard.pwa.updateBody'),
      };
    }

    if (showOnlineRestored) {
      return {
        kind: 'online' as const,
        icon: CheckCircle2,
        title: t('socioDashboard.pwa.onlineTitle'),
        body: t('socioDashboard.pwa.onlineBody'),
      };
    }

    return null;
  }, [isOnline, showOnlineRestored, t, updateReady]);

  if (!shouldShowPwaStatus || !banner) return null;

  const Icon = banner.icon;
  const positionClassName = isSocioMobile
    ? 'inset-x-3 bottom-[calc(10.2rem+env(safe-area-inset-bottom))] mx-auto max-w-md'
    : 'inset-x-3 bottom-[calc(1rem+env(safe-area-inset-bottom))] mx-auto max-w-md md:left-auto md:right-4 md:mx-0 md:w-full';

  return (
    <aside
      className={`fixed z-[76] rounded-3xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-800 dark:bg-slate-950 gm-pwa-floating-card ${positionClassName}`}
      role='status'
      aria-live='polite'
    >
      <div className='flex items-start gap-3'>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
            banner.kind === 'offline'
              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-200'
              : banner.kind === 'update'
                ? 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-200'
                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200'
          }`}
        >
          <Icon className='h-5 w-5' aria-hidden='true' />
        </div>

        <div className='min-w-0 flex-1'>
          <p className='text-sm font-bold text-slate-950 dark:text-slate-50'>
            {banner.title}
          </p>
          <p className='mt-0.5 text-xs leading-5 text-slate-600 dark:text-slate-300'>
            {banner.body}
          </p>

          {banner.kind === 'update' ? (
            <div className='mt-3 flex items-center gap-2'>
              <Button
                size='sm'
                className='h-8 rounded-full px-4 text-xs'
                onClick={handleUpdateNow}
                disabled={isRefreshing}
              >
                {isRefreshing
                  ? t('socioDashboard.pwa.updating')
                  : t('socioDashboard.pwa.update')}
              </Button>
              <Button
                size='sm'
                variant='ghost'
                className='h-8 rounded-full px-3 text-xs'
                onClick={handleDismissUpdate}
                disabled={isRefreshing}
              >
                {t('socioDashboard.pwa.later')}
              </Button>
            </div>
          ) : null}
        </div>

        {banner.kind === 'update' ? (
          <button
            type='button'
            className='rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-slate-900 dark:hover:text-slate-200'
            onClick={handleDismissUpdate}
            aria-label={t('socioDashboard.pwa.hideUpdate')}
            disabled={isRefreshing}
          >
            <X className='h-4 w-4' aria-hidden='true' />
          </button>
        ) : null}
      </div>
    </aside>
  );
}
