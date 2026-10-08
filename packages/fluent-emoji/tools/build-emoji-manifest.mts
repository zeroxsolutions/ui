/**
 * Writes `src/lib/emoji-manifest.ts` from `assets/`: which codepoint keys have a
 * committed file, and in which of the five style folders. Run after adding or
 * removing a file under `assets/<style>/`: `nx emoji-manifest fluent-emoji` (or
 * `node tools/build-emoji-manifest.mts`); `emoji-manifest.spec.ts` fails if the
 * committed output and `assets/` disagree, as a reminder.
 *
 * Most keys carry all five styles, so the keys are one list, the union across
 * every style, plus, per style, only the keys MISSING from it. Listing the far
 * larger "present" set per style would repeat nearly the whole key list five
 * times over.
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { FluentEmojiStyle } from '../src/lib/fluent-emoji-url';

const PACKAGE_ROOT = resolve(import.meta.dirname, '..');
const STYLES = ['3d', 'flat', 'modern', 'mono', 'anim'] as const;
// Each style's own file extension - a directory entry with any other extension
// (a gitignored `.DS_Store` left by Finder, say) is not a key and is skipped.
const STYLE_EXT: Record<FluentEmojiStyle, string> = {
  '3d': '.webp',
  flat: '.svg',
  modern: '.svg',
  mono: '.svg',
  anim: '.webp',
};
const HEADER = '// Written by tools/build-emoji-manifest.mts from assets/. Regenerate, never hand-edit.';
const OUT_PATH = resolve(PACKAGE_ROOT, 'src/lib/emoji-manifest.ts');

/** The codepoint keys (filenames minus `style`'s own extension) committed under one `assets/<style>/`. */
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

const missingByStyle = new Map(
  STYLES.map((style): [FluentEmojiStyle, string[]] => [
    style,
    universe.filter((key) => !keysByStyle.get(style)!.has(key)),
  ]),
);

const printKeys = (keys: string[], indent: string) => keys.map((key) => `${indent}'${key}',`).join('\n');

writeFileSync(
  OUT_PATH,
  `${HEADER}

import type { FluentEmojiStyle } from './fluent-emoji-url';

export const FLUENT_EMOJI_MANIFEST_KEYS: readonly string[] = [
${printKeys(universe, '  ')}
];

export const FLUENT_EMOJI_MANIFEST_MISSING: Readonly<Record<FluentEmojiStyle, readonly string[]>> = {
${STYLES.map((style) => `  '${style}': [\n${printKeys(missingByStyle.get(style)!, '    ')}\n  ],`).join('\n')}
};
`,
);

// The template above is not oxfmt-identical (e.g. an empty array prints over two lines, every
// style key is quoted) - this is the generator's own output, so it formats it rather than leaving a
// diff for the next person (or the next regeneration) to clean up by hand.
execFileSync('pnpm', ['exec', 'oxfmt', '--write', OUT_PATH], { cwd: PACKAGE_ROOT, stdio: 'inherit' });

console.log(
  `emoji manifest: ${universe.length} keys; missing ${STYLES.map((style) => `${style}=${missingByStyle.get(style)!.length}`).join(', ')}`,
);
