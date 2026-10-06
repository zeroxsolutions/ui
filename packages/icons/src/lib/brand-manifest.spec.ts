// @vitest-environment node
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { BRAND_MARKS } from './brand-manifest';

const ROOT = resolve(import.meta.dirname, '../..');
const VARIANTS = ['color', 'mono', 'avatar', 'combine'] as const;

const files = VARIANTS.flatMap((variant) =>
  readdirSync(resolve(ROOT, 'assets/brands', variant))
    .filter((f) => f.endsWith('.svg'))
    .map((f) => `${variant}/${f.slice(0, -4)}`),
).sort();

const listed = Object.entries(BRAND_MARKS)
  .flatMap(([name, variants]) => Object.keys(variants).map((variant) => `${variant}/${name}`))
  .sort();

describe('brand-manifest (generated from assets/brands/)', () => {
  it('lists every file under assets/brands/, and nothing without a file', () => {
    expect(listed).toEqual(files);
  });

  it('gives every mark at least one of color or mono, the end of every fallback chain', () => {
    const bare = Object.entries(BRAND_MARKS).filter(([, v]) => !('color' in v) && !('mono' in v));
    expect(bare).toEqual([]);
  });
});
