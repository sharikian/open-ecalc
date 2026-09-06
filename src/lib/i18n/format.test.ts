import { describe, expect, it } from 'vitest';
import { formatEngineering } from './format';

describe('engineering formatting', () => {
  it('keeps digits Latin and returns a readable dash for invalid values', () => {
    expect(formatEngineering(1234.56, 1)).toBe('1,234.6');
    expect(formatEngineering(Number.NaN)).toBe('—');
  });
});
