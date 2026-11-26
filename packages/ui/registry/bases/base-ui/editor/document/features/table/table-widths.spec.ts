import { describe, expect, it } from 'vitest';
import { COLUMN_WIDTH_MIN, columnWidthsOf, fittedShares } from './table-widths';

const sumOf = (values: readonly number[]) => values.reduce((sum, value) => sum + value, 0);

describe('fittedShares', () => {
  it('widens a column the browser drew under a twentieth, takes the room from the others, and sums to 1', () => {
    const fitted = fittedShares([0.94, 0.03, 0.03]);
    expect(Math.min(...fitted)).toBeGreaterThanOrEqual(COLUMN_WIDTH_MIN);
    expect(sumOf(fitted)).toBeCloseTo(1, 4);
    expect(fitted[0]).toBeCloseTo(0.9, 4);
    expect(columnWidthsOf(fitted)).toEqual(fitted);
  });

  it('keeps shares that already fit', () => {
    expect(fittedShares([0.3, 0.7])).toEqual([0.3, 0.7]);
  });

  it('keeps a column narrower than a twentieth from pushing another under it', () => {
    const fitted = fittedShares([0.9, 0.06, 0.02, 0.02]);
    expect(Math.min(...fitted)).toBeGreaterThanOrEqual(COLUMN_WIDTH_MIN);
    expect(sumOf(fitted)).toBeCloseTo(1, 4);
  });
});
