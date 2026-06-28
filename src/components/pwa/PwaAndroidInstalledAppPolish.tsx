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

export function PwaAndroidInstalledAppPolish() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncInstalledModeClasses = () => {
      const standalone = isStandaloneMode();
      const android = isAndroidDevice();
      const ios = isIosDevice();

      document.body.classList.toggle('gm-pwa-standalone', standalone);
      document.body.classList.toggle('gm-pwa-android', standalone && android);
      document.body.classList.toggle('gm-pwa-ios', standalone && ios);
    };

    syncInstalledModeClasses();

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', syncInstalledModeClasses);

    return () => {
      mediaQuery.removeEventListener('change', syncInstalledModeClasses);
      document.body.classList.remove('gm-pwa-standalone', 'gm-pwa-android', 'gm-pwa-ios');
    };
  }, []);

  return null;
}
