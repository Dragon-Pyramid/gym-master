export const I18N_STORAGE_KEY = 'gym-master-locale-v1';
export const I18N_COOKIE_KEY = 'gym-master-locale-v1';

export const SUPPORTED_LOCALES = ['es', 'en'] as const;

export type GymMasterLocale = (typeof SUPPORTED_LOCALES)[number];

export type GymMasterLocaleOption = {
  code: GymMasterLocale;
  label: string;
  nativeLabel: string;
  flag: string;
};

export const DEFAULT_LOCALE: GymMasterLocale = 'es';

export const BROWSER_FALLBACK_LOCALE: GymMasterLocale = 'en';

const SPANISH_LANGUAGE_PREFIXES = ['es'];

const SPANISH_SPEAKING_REGION_CODES = new Set([
  'AR',
  'BO',
  'CL',
  'CO',
  'CR',
  'CU',
  'DO',
  'EC',
  'ES',
  'GQ',
  'GT',
  'HN',
  'MX',
  'NI',
  'PA',
  'PE',
  'PR',
  'PY',
  'SV',
  'UY',
  'VE',
]);

export const LOCALE_OPTIONS: GymMasterLocaleOption[] = [
  {
    code: 'es',
    label: 'Spanish',
    nativeLabel: 'Español',
    flag: '🇪🇸',
  },
  {
    code: 'en',
    label: 'English',
    nativeLabel: 'English',
    flag: '🇺🇸',
  },
];

export function isSupportedLocale(value: unknown): value is GymMasterLocale {
  return typeof value === 'string' && SUPPORTED_LOCALES.includes(value as GymMasterLocale);
}

export function normalizeLocale(value: unknown): GymMasterLocale {
  if (isSupportedLocale(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const shortLocale = value.split('-')[0]?.toLowerCase();
    if (isSupportedLocale(shortLocale)) {
      return shortLocale;
    }
  }

  return DEFAULT_LOCALE;
}

export function detectBrowserLocale(localeCandidates: readonly string[] = []): GymMasterLocale {
  const normalizedCandidates = localeCandidates
    .map((candidate) => candidate.trim())
    .filter(Boolean);

  const hasSpanishLanguage = normalizedCandidates.some((candidate) => {
    const [language] = candidate.replace('_', '-').split('-');
    return SPANISH_LANGUAGE_PREFIXES.includes(language.toLowerCase());
  });

  if (hasSpanishLanguage) {
    return 'es';
  }

  const hasSpanishSpeakingRegion = normalizedCandidates.some((candidate) => {
    const [, region] = candidate.replace('_', '-').split('-');
    return region ? SPANISH_SPEAKING_REGION_CODES.has(region.toUpperCase()) : false;
  });

  if (hasSpanishSpeakingRegion) {
    return 'es';
  }

  return BROWSER_FALLBACK_LOCALE;
}

export function getLocaleOption(locale: GymMasterLocale): GymMasterLocaleOption {
  return LOCALE_OPTIONS.find((option) => option.code === locale) ?? LOCALE_OPTIONS[0];
}
