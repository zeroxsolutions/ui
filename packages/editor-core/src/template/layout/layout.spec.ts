// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  COLOR_TOKENS,
  HUES,
  layoutSchema,
  ratioFractions,
  readLayout,
  snapRatio,
  snapWidth,
  widthFromPixels,
} from './index.js';

describe('snapWidth', () => {
  it.each([
    [0.512, 0.5],
    [0.1, 0.25],
    [1.4, 1],
    [0.33, 0.35],
  ])('snaps %d to %d, within [0.25, 1]', (fraction, snapped) => {
    expect(snapWidth(fraction)).toBe(snapped);
  });
});

describe('widthFromPixels', () => {
  it.each([
    [360, 720, 0.5],
    [283, 566, 0.5],
    [2000, 720, 1],
    [10, 566, 0.25],
  ])('reads a legacy %dpx of %dpx as %d', (px, base, fraction) => {
    expect(widthFromPixels(px, base)).toBe(fraction);
  });
});

describe('layoutSchema', () => {
  it.each([
    ['a pixel width', { width: 300 }],
    ['a width below a quarter', { width: 0.2 }],
    ['an email align name', { align: 'left' }],
    ['an unknown space', { spaceBefore: 'huge' }],
    ['an unknown key', { float: 'left' }],
  ])('refuses %s', (_case, raw) => {
    expect(layoutSchema.safeParse(raw).success).toBe(false);
  });

  it('accepts full width and every token', () => {
    expect(layoutSchema.safeParse({ width: 'full', align: 'center', spaceBefore: 'none' }).success).toBe(true);
  });

  it('validates responsive overrides one level deep', () => {
    expect(layoutSchema.safeParse({ responsive: { sm: { width: 1 } } }).success).toBe(true);
    expect(layoutSchema.safeParse({ responsive: { xl: {} } }).success).toBe(false);
    expect(layoutSchema.safeParse({ responsive: { sm: { responsive: {} } } }).success).toBe(false);
  });
});

describe('readLayout', () => {
  it('drops what is invalid and keeps the rest', () => {
    expect(readLayout({ align: 'left', width: 0.5 })).toEqual({ width: 0.5 });
  });

  it('reads anything that is not an object as no layout', () => {
    expect(readLayout('x')).toEqual({});
    expect(readLayout(null)).toEqual({});
  });

  it('keeps a valid responsive override and drops an invalid one', () => {
    expect(readLayout({ responsive: { sm: { width: 1 }, xl: { width: 1 } } })).toEqual({
      responsive: { sm: { width: 1 } },
    });
  });
});

describe('snapRatio', () => {
  it.each([
    [
      [0.64, 0.36],
      [8, 4],
    ],
    [
      [0.52, 0.48],
      [6, 6],
    ],
    [
      [0.27, 0.73],
      [3, 9],
    ],
    [
      [0.34, 0.33, 0.33],
      [4, 4, 4],
    ],
    [
      [0.5, 0.25, 0.25],
      [6, 3, 3],
    ],
  ])('snaps %j to the weights %j, summing to 12', (fractions, weights) => {
    const snapped = snapRatio(fractions);
    expect(snapped).toEqual(weights);
    expect(snapped.reduce((sum, weight) => sum + weight, 0)).toBe(12);
  });

  it('gives every lane at least one twelfth', () => {
    const snapped = snapRatio([0.01, 0.99]);
    expect(Math.min(...snapped)).toBeGreaterThanOrEqual(1);
    expect(snapped.reduce((sum, weight) => sum + weight, 0)).toBe(12);
  });
});

describe('ratioFractions', () => {
  it('turns weights into fractions of their sum', () => {
    expect(ratioFractions([8, 4])).toEqual([2 / 3, 1 / 3]);
  });
});

describe('the colour set', () => {
  it('is closed: four theme tokens and eight hues', () => {
    expect(COLOR_TOKENS).toHaveLength(12);
    expect(HUES).toEqual(['red', 'orange', 'amber', 'green', 'teal', 'blue', 'violet', 'pink']);
  });
});
