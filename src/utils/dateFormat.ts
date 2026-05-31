export const FRONTEND_DATE_LOCALE = 'es-AR';

export type DateInput = string | number | Date | null | undefined;

function parseDateValue(value: DateInput): Date | null {
  if (value === null || value === undefined || value === '') return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const rawValue = String(value).trim();
  if (!rawValue) return null;

  const dateOnlyMatch = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(rawValue);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatFrontendDate(value: DateInput, locale = FRONTEND_DATE_LOCALE, fallback = '-'): string {
  const date = parseDateValue(value);
  if (!date) return fallback;

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatFrontendDateTime(value: DateInput, locale = FRONTEND_DATE_LOCALE, fallback = '-'): string {
  const date = parseDateValue(value);
  if (!date) return fallback;

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatFrontendTime(value: DateInput, locale = FRONTEND_DATE_LOCALE, fallback = '-'): string {
  const date = parseDateValue(value);
  if (!date) return fallback;

  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

export function formatFrontendShortDate(value: DateInput, locale = FRONTEND_DATE_LOCALE, fallback = '-'): string {
  const date = parseDateValue(value);
  if (!date) return fallback;

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
  }).format(date);
}
