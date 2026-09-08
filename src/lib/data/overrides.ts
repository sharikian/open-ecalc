import type { ComponentRecord } from './types';

const OVERRIDE_KEY = 'open-ecalc.component-overrides';
const CUSTOM_KEY = 'open-ecalc.custom-components';
const HIDDEN_KEY = 'open-ecalc.hidden-components';

function read<T>(key: string, fallback: T): T {
  if (typeof localStorage === 'undefined') return fallback;
  try { return JSON.parse(localStorage.getItem(key) ?? '') as T; } catch { return fallback; }
}

export function componentOverrides(): Record<string, Partial<ComponentRecord>> { return read(OVERRIDE_KEY, {}); }
export function saveComponentOverride(id: string, values: Partial<ComponentRecord>): void {
  const all = componentOverrides(); all[id] = { ...(all[id] ?? {}), ...values }; localStorage.setItem(OVERRIDE_KEY, JSON.stringify(all));
}
export function applyComponentOverride<T extends ComponentRecord>(record: T): T { return { ...record, ...(componentOverrides()[record.id] ?? {}) } as T; }
export function customComponents(): ComponentRecord[] { return read(CUSTOM_KEY, []); }
export function saveCustomComponent(record: ComponentRecord): void {
  const all = customComponents().filter((item) => item.id !== record.id); all.push(record); localStorage.setItem(CUSTOM_KEY, JSON.stringify(all));
}
export function hiddenComponents(): string[] { return read(HIDDEN_KEY, []); }
export function hideComponent(id: string): void {
  const all = hiddenComponents();
  if (!all.includes(id)) all.push(id);
  localStorage.setItem(HIDDEN_KEY, JSON.stringify(all));
}
