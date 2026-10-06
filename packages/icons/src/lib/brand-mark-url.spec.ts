// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest';

import type { BrandMarkName } from './brand-manifest';
import {
  brandMarkChain,
  brandMarkUrl,
  DEFAULT_BRAND_MARK_BASE,
  setBrandMarkBase,
  setBrandMarkStyle,
} from './brand-mark-url';

afterEach(() => {
  setBrandMarkBase(undefined);
  setBrandMarkStyle(undefined);
});

describe('brandMarkUrl', () => {
  it('resolves the colour file on the default base', () => {
    expect(brandMarkUrl('facebook')).toBe(`${DEFAULT_BRAND_MARK_BASE}/color/facebook.svg`);
  });

  it('takes a per-call variant and base over the module defaults', () => {
    setBrandMarkBase('https://elsewhere.example');
    setBrandMarkStyle('avatar');
    expect(brandMarkUrl('openai', { variant: 'mono', base: '/marks' })).toBe('/marks/mono/openai.svg');
  });

  it('drops a trailing slash on the base', () => {
    setBrandMarkBase('/brand-marks/');
    expect(brandMarkUrl('facebook')).toBe('/brand-marks/color/facebook.svg');
  });

  it('answers undefined for a variant the mark has no file for', () => {
    // google-play ships no combine file; <BrandMark> falls back, brandMarkUrl reports.
    expect(brandMarkUrl('google-play', { variant: 'combine' })).toBeUndefined();
  });

  it('answers undefined for a name the manifest does not list', () => {
    expect(brandMarkUrl('no-such-brand' as BrandMarkName)).toBeUndefined();
  });
});

describe('brandMarkChain', () => {
  it('walks combine to color, then color to mono, for a mark with every variant', () => {
    expect(brandMarkChain('claude', 'combine')).toEqual(['combine', 'color', 'mono']);
  });

  it('skips a variant the mark has no file for', () => {
    // openai ships no colour file: its mark is one colour.
    expect(brandMarkChain('openai', 'combine')).toEqual(['combine', 'mono']);
  });

  it('ends at mono', () => {
    expect(brandMarkChain('openai', 'mono')).toEqual(['mono']);
  });
});
