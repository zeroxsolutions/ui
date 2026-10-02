// @vitest-environment node
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { FLUENT_EMOJI_MANIFEST_KEYS, FLUENT_EMOJI_MANIFEST_MISSING } from './emoji-manifest';
import type { FluentEmojiStyle } from './fluent-emoji-url';

const PACKAGE_ROOT = resolve(import.meta.dirname, '../..');
// Each style's own file extension - a directory entry with any other extension (a gitignored
// `.DS_Store` left by Finder, say) is not a key and is skipped.
const STYLE_EXT: Record<FluentEmojiStyle, string> = {
  '3d': '.webp',
  flat: '.svg',
  modern: '.svg',
  mono: '.svg',
  anim: '.webp',
};
const STYLES = Object.keys(STYLE_EXT) as FluentEmojiStyle[];

/** The codepoint keys (filenames minus `style`'s own extension) actually committed under one `assets/<style>/`. */
function styleKeys(style: FluentEmojiStyle): Set<string> {
  const dir = resolve(PACKAGE_ROOT, 'assets', style);
  const ext = STYLE_EXT[style];
  return new Set(
    readdirSync(dir)
      .filter((file) => file.endsWith(ext))
      .map((file) => file.slice(0, -ext.length)),
  );
}

const keysByStyle = new Map(STYLES.map((style): [FluentEmojiStyle, Set<string>] => [style, styleKeys(style)]));
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
