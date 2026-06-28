'use client';

import { Download, Share2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuthStore } from '@/stores/authStore';

type BeforeInstallPromptChoice = {
  outcome: 'accepted' | 'dismissed';
  platform: string;
};

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<BeforeInstallPromptChoice>;
}

const DISMISS_KEY = 'gm-pwa-install-dismissed-at';
const DISMISS_DAYS = 7;

function isDismissedRecently() {
  if (typeof window === 'undefined') return true;

  const raw = window.localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;

  const dismissedAt = Number(raw);
  if (!Number.isFinite(dismissedAt)) return false;

  const maxAgeMs = DISMISS_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() - dismissedAt < maxAgeMs;
}

function isIosDevice() {
  if (typeof window === 'undefined') return false;

  const ua = window.navigator.userAgent.toLowerCase();
  const platform = window.navigator.platform?.toLowerCase() ?? '';

  return (
    /iphone|ipad|ipod/.test(ua) ||
    (platform === 'macintel' && window.navigator.maxTouchPoints > 1)
  );
}

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

export function SocioPwaInstallPrompt() {
  const isMobile = useIsMobile();
  const { user, isAuthenticated } = useAuthStore();

  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);

  const isSocio = user?.rol?.trim().toLowerCase() === 'socio';
  const shouldTargetSocio = isAuthenticated && isSocio && isMobile;

  const canInstallWithPrompt = Boolean(installEvent);

  const copy = useMemo(() => {
    if (isIos && !canInstallWithPrompt) {
      return {
        title: 'Instalá Gym Master',
        body: 'Abrilo como app desde el inicio del celular: Compartir y luego Agregar a inicio.',
        action: 'Entendido',
      };
    }

    return {
      title: 'Instalá Gym Master',
      body: 'Usalo como app para entrar más rápido a rutina, dieta, pagos y perfil.',
      action: 'Instalar',
    };
  }, [canInstallWithPrompt, isIos]);

  useEffect(() => {
    const syncInstalledState = () => {
      const standalone = isStandaloneMode();

      setIsStandalone(standalone);
      setIsIos(isIosDevice());

      if (standalone) {
        setShowPrompt(false);
        setInstallEvent(null);
      }
    };

    syncInstalledState();

    const mediaQuery = window.matchMedia('(display-mode: standalone)');

    window.addEventListener('pageshow', syncInstalledState);
    document.addEventListener('visibilitychange', syncInstalledState);
    mediaQuery.addEventListener('change', syncInstalledState);

    return () => {
      window.removeEventListener('pageshow', syncInstalledState);
      document.removeEventListener('visibilitychange', syncInstalledState);
      mediaQuery.removeEventListener('change', syncInstalledState);
    };
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setInstallEvent(null);
      setShowPrompt(false);
      setIsStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  useEffect(() => {
    if (!shouldTargetSocio || isStandalone || isDismissedRecently()) {
      setShowPrompt(false);
      return;
    }

    if (!canInstallWithPrompt && !isIos) {
      setShowPrompt(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setShowPrompt(true);
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [canInstallWithPrompt, isIos, isStandalone, shouldTargetSocio]);

  const handleDismiss = () => {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setShowPrompt(false);
  };

  const handleInstall = async () => {
    if (!installEvent) {
      handleDismiss();
      return;
    }

    await installEvent.prompt();
    const choice = await installEvent.userChoice;

    if (choice.outcome === 'accepted') {
      setShowPrompt(false);
    } else {
      handleDismiss();
    }

    setInstallEvent(null);
  };

  if (!showPrompt) return null;

  return (
    <aside
      className='fixed inset-x-3 bottom-[calc(5.9rem+env(safe-area-inset-bottom))] z-[75] mx-auto max-w-md rounded-3xl border border-sky-100 bg-white/95 p-3 shadow-[0_18px_48px_rgba(15,23,42,0.18)] backdrop-blur md:hidden dark:border-sky-900/70 dark:bg-slate-950/95'
      role='status'
      aria-live='polite'
    >
      <div className='flex items-start gap-3'>
        <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-200'>
          {isIos && !canInstallWithPrompt ? (
            <Share2 className='h-5 w-5' aria-hidden='true' />
          ) : (
            <Download className='h-5 w-5' aria-hidden='true' />
          )}
        </div>

        <div className='min-w-0 flex-1'>
          <p className='text-sm font-bold text-slate-950 dark:text-slate-50'>{copy.title}</p>
          <p className='mt-0.5 text-xs leading-5 text-slate-600 dark:text-slate-300'>{copy.body}</p>

          <div className='mt-3 flex items-center gap-2'>
            <Button size='sm' className='h-8 rounded-full px-4 text-xs' onClick={handleInstall}>
              {copy.action}
            </Button>
            <Button
              size='sm'
              variant='ghost'
              className='h-8 rounded-full px-3 text-xs'
              onClick={handleDismiss}
            >
              Después
            </Button>
          </div>
        </div>

        <button
          type='button'
          className='rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-900 dark:hover:text-slate-200'
          onClick={handleDismiss}
          aria-label='Ocultar sugerencia de instalación'
        >
          <X className='h-4 w-4' aria-hidden='true' />
        </button>
      </div>
    </aside>
  );
}
