/** Round only the presentation, never the stored engineering value. */
export function numericDisplay(value: unknown): string {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value !== 'number') return String(value);
  if (!Number.isFinite(value)) return '';
  return Number(value.toFixed(3)).toString();
}

/** Preserve a sourced value when its rounded editor representation is unchanged. */
export function numericEditorValue(display: string, original: unknown): number {
  if (typeof original === 'number' && Number.isFinite(original) && display === numericDisplay(original)) return original;
  return Number(display);
}
