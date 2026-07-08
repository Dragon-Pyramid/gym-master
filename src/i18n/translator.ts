import { DEFAULT_LOCALE, type GymMasterLocale } from './config';
import { dictionaries } from './dictionaries';

export type I18nParams = Record<string, string | number | boolean | null | undefined>;

function resolvePath(source: Record<string, unknown>, key: string): string | undefined {
  const value = key.split('.').reduce<unknown>((current, part) => {
    if (current && typeof current === 'object' && part in current) {
      return (current as Record<string, unknown>)[part];
    }

    return undefined;
  }, source);

  return typeof value === 'string' ? value : undefined;
}

function interpolate(message: string, params?: I18nParams): string {
  if (!params) {
    return message;
  }

  return Object.entries(params).reduce((text, [key, value]) => {
    return text.replaceAll(`{{${key}}}`, value == null ? '' : String(value));
  }, message);
}

export function getI18nMessage(locale: GymMasterLocale, key: string, params?: I18nParams): string {
  const activeDictionary = dictionaries[locale];
  const fallbackDictionary = dictionaries[DEFAULT_LOCALE];
  const message = resolvePath(activeDictionary, key) ?? resolvePath(fallbackDictionary, key) ?? key;

  return interpolate(message, params);
}
