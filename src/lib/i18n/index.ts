import { browser } from '$app/environment';
import { derived, writable } from 'svelte/store';
import { messages, type Locale, type MessageKey } from './messages';

const STORAGE_KEY = 'open-ecalc.locale';

function detectLocale(): Locale {
  if (!browser) return 'fa';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'fa' || stored === 'en') return stored;
  // Persian is the product's first-run language; the user can switch to English
  // explicitly and the choice is persisted for subsequent sessions.
  return 'fa';
}

export const locale = writable<Locale>(detectLocale());

locale.subscribe((next) => {
  if (!browser) return;
  localStorage.setItem(STORAGE_KEY, next);
  document.documentElement.lang = next;
  document.documentElement.dir = next === 'fa' ? 'rtl' : 'ltr';
});

export const direction = derived(locale, ($locale) => ($locale === 'fa' ? 'rtl' : 'ltr'));
export const t = derived(locale, ($locale) => (key: MessageKey) => messages[$locale][key]);
