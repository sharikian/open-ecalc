import { describe, expect, it } from 'vitest';
import { numericDisplay, numericEditorValue } from './numeric-display';

describe('component numeric presentation', () => {
  it('shows no more than three decimal places without trailing zeros', () => {
    expect(numericDisplay(0.12700000000000003)).toBe('0.127');
    expect(numericDisplay(0.16509999999999997)).toBe('0.165');
    expect(numericDisplay(22.2)).toBe('22.2');
    expect(numericDisplay(1200)).toBe('1200');
    expect(numericDisplay(-0.00001)).toBe('0');
    for (const value of [undefined, null, '', NaN, Infinity]) expect(numericDisplay(value)).toBe('');
  });
  it('retains source precision unless the user changes the displayed value', () => {
    const exact = 5 * .0254;
    expect(numericEditorValue(numericDisplay(exact), exact)).toBe(exact);
    expect(numericEditorValue('0.128', exact)).toBe(.128);
    expect(numericEditorValue('0', .0003)).toBe(.0003);
    expect(numericEditorValue('3.125', undefined)).toBe(3.125);
  });
});
