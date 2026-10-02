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
import { readdirSync, writeFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';

const PACKAGE_ROOT = resolve(import.meta.dirname, '..');
const STYLES = ['3d', 'flat', 'modern', 'mono', 'anim'] as const;
const HEADER = '// Written by tools/build-emoji-manifest.mts from assets/. Regenerate, never hand-edit.';

/** The codepoint keys (filenames minus extension) committed under one `assets/<style>/`. */
function styleKeys(style: string): Set<string> {
  const dir = resolve(PACKAGE_ROOT, 'assets', style);
  return new Set(readdirSync(dir).map((file) => file.slice(0, -extname(file).length)));
}

const keysByStyle = new Map(STYLES.map((style): [string, Set<string>] => [style, styleKeys(style)]));

const universe = [...new Set(STYLES.flatMap((style) => [...keysByStyle.get(style)!]))].sort();

const missingByStyle = new Map(
  STYLES.map((style): [string, string[]] => [style, universe.filter((key) => !keysByStyle.get(style)!.has(key))]),
);

const printKeys = (keys: string[], indent: string) => keys.map((key) => `${indent}'${key}',`).join('\n');

writeFileSync(
  resolve(PACKAGE_ROOT, 'src/lib/emoji-manifest.ts'),
  `${HEADER}

export const FLUENT_EMOJI_MANIFEST_KEYS: readonly string[] = [
${printKeys(universe, '  ')}
];

export const FLUENT_EMOJI_MANIFEST_MISSING: Readonly<Record<string, readonly string[]>> = {
${STYLES.map((style) => `  '${style}': [\n${printKeys(missingByStyle.get(style)!, '    ')}\n  ],`).join('\n')}
};
`,
);

console.log(
  `emoji manifest: ${universe.length} keys; missing ${STYLES.map((style) => `${style}=${missingByStyle.get(style)!.length}`).join(', ')}`,
);
