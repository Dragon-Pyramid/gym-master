'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_LOCALE,
  I18N_COOKIE_KEY,
  I18N_STORAGE_KEY,
  LOCALE_OPTIONS,
  detectBrowserLocale,
  type GymMasterLocale,
  type GymMasterLocaleOption,
  getLocaleOption,
  normalizeLocale,
} from './config';
import { getI18nMessage, type I18nParams } from './translator';

type I18nContextValue = {
  locale: GymMasterLocale;
  localeOption: GymMasterLocaleOption;
  options: GymMasterLocaleOption[];
  isHydrated: boolean;
  setLocale: (locale: GymMasterLocale) => void;
  toggleLocale: () => void;
  t: (key: string, params?: I18nParams) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function resolveClientLocale(): GymMasterLocale {
  if (typeof window === 'undefined') {
    return DEFAULT_LOCALE;
  }

  try {
    const storedLocale = window.localStorage.getItem(I18N_STORAGE_KEY);
    if (storedLocale) {
      return normalizeLocale(storedLocale);
    }
  } catch {
    // Si localStorage no está disponible, usamos detección del navegador.
  }

  const candidates = [
    ...(Array.isArray(window.navigator.languages) ? window.navigator.languages : []),
    window.navigator.language,
    Intl.DateTimeFormat().resolvedOptions().locale,
  ].filter((candidate): candidate is string => Boolean(candidate));

  return detectBrowserLocale(candidates);
}

function persistLocaleCookie(locale: GymMasterLocale) {
  if (typeof document === 'undefined') {
    return;
  }

  document.cookie = `${I18N_COOKIE_KEY}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function I18nProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
}: {
  children: React.ReactNode;
  initialLocale?: GymMasterLocale;
}) {
  const [locale, setLocaleState] = useState<GymMasterLocale>(() => normalizeLocale(initialLocale));
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const resolvedLocale = resolveClientLocale();
    setLocaleState(resolvedLocale);
    persistLocaleCookie(resolvedLocale);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = 'ltr';
    document.documentElement.dataset.locale = locale;
  }, [locale]);

  const setLocale = useCallback((nextLocale: GymMasterLocale) => {
    const normalizedLocale = normalizeLocale(nextLocale);
    setLocaleState(normalizedLocale);
    setIsHydrated(true);

    try {
      window.localStorage.setItem(I18N_STORAGE_KEY, normalizedLocale);
    } catch {
      // No bloqueamos el cambio visual de idioma si localStorage no está disponible.
    }

    persistLocaleCookie(normalizedLocale);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'es' ? 'en' : 'es');
  }, [locale, setLocale]);

  const t = useCallback(
    (key: string, params?: I18nParams) => getI18nMessage(locale, key, params),
    [locale],
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      localeOption: getLocaleOption(locale),
      options: LOCALE_OPTIONS,
      isHydrated,
      setLocale,
      toggleLocale,
      t,
    }),
    [isHydrated, locale, setLocale, t, toggleLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }

  return context;
}
