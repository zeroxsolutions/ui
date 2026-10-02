// @vitest-environment node
import { readdirSync } from 'node:fs';
import { extname, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { FLUENT_EMOJI_MANIFEST_KEYS, FLUENT_EMOJI_MANIFEST_MISSING } from './emoji-manifest';

const STYLES = ['3d', 'flat', 'modern', 'mono', 'anim'] as const;
const PACKAGE_ROOT = resolve(import.meta.dirname, '../..');

/** The codepoint keys (filenames minus extension) actually committed under one `assets/<style>/`. */
function styleKeys(style: string): Set<string> {
  const dir = resolve(PACKAGE_ROOT, 'assets', style);
  return new Set(readdirSync(dir).map((file) => file.slice(0, -extname(file).length)));
}

const keysByStyle = new Map(STYLES.map((style): [string, Set<string>] => [style, styleKeys(style)]));
const universe = [...new Set(STYLES.flatMap((style) => [...keysByStyle.get(style)!]))].sort();

describe('emoji-manifest (generated from assets/)', () => {
  it('lists every key that has a file in some assets/<style>/ folder, and no key that does not', () => {
    expect([...FLUENT_EMOJI_MANIFEST_KEYS].sort()).toEqual(universe);
  });

  it.each(STYLES)('lists exactly the keys assets/%s/ is missing, among the keys that exist elsewhere', (style) => {
    const missing = universe.filter((key) => !keysByStyle.get(style)!.has(key));
    expect([...FLUENT_EMOJI_MANIFEST_MISSING[style]].sort()).toEqual(missing);
  });
});
