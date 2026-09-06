import type { Locale } from './messages';

export type UnitSystem = 'metric' | 'imperial';

export function formatEngineering(value: number, maximumFractionDigits = 1): string {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits,
    useGrouping: true
  }).format(value);
}

export function localizeLabel(locale: Locale, fa: string, en: string): string {
  return locale === 'fa' ? fa : en;
}
