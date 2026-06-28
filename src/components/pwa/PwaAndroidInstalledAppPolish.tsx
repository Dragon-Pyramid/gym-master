'use client';

import { useEffect } from 'react';

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

function isAndroidDevice() {
  if (typeof window === 'undefined') return false;
  return /android/i.test(window.navigator.userAgent);
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

function updateViewportHeightVariable() {
  if (typeof window === 'undefined') return;

  document.documentElement.style.setProperty('--gm-vh', `${window.innerHeight * 0.01}px`);
}

export function PwaAndroidInstalledAppPolish() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(display-mode: standalone)');

    const syncInstalledModeClasses = () => {
      const standalone = isStandaloneMode();
      const android = isAndroidDevice();
      const ios = isIosDevice();

      document.body.classList.toggle('gm-pwa-standalone', standalone);
      document.body.classList.toggle('gm-pwa-android', standalone && android);
      document.body.classList.toggle('gm-pwa-ios', standalone && ios);

      updateViewportHeightVariable();
    };

    syncInstalledModeClasses();

    window.addEventListener('resize', syncInstalledModeClasses);
    window.addEventListener('orientationchange', syncInstalledModeClasses);
    window.addEventListener('pageshow', syncInstalledModeClasses);
    document.addEventListener('visibilitychange', syncInstalledModeClasses);
    mediaQuery.addEventListener('change', syncInstalledModeClasses);

    return () => {
      window.removeEventListener('resize', syncInstalledModeClasses);
      window.removeEventListener('orientationchange', syncInstalledModeClasses);
      window.removeEventListener('pageshow', syncInstalledModeClasses);
      document.removeEventListener('visibilitychange', syncInstalledModeClasses);
      mediaQuery.removeEventListener('change', syncInstalledModeClasses);

      document.body.classList.remove('gm-pwa-standalone', 'gm-pwa-android', 'gm-pwa-ios');
    };
  }, []);

  return null;
}
