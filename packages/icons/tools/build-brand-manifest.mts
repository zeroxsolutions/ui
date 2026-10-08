/**
 * Writes `src/lib/brand-manifest.ts` from `assets/brands/`: per name, the variants it has a file for
 * and each file's width/height ratio from its viewBox. Run after adding or removing a file:
 * `nx brand-manifest @zeroxsolutions/icons`; `brand-manifest.spec.ts` fails if the two disagree.
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const VARIANTS = ['color', 'mono', 'avatar', 'combine'] as const;
const OUT = resolve(ROOT, 'src/lib/brand-manifest.ts');
const HEADER = '// Written by tools/build-brand-manifest.mts from assets/brands/. Regenerate, never hand-edit.';

const marks = new Map<string, Record<string, number>>();
for (const variant of VARIANTS) {
  const dir = resolve(ROOT, 'assets/brands', variant);
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.svg'))) {
    const name = file.slice(0, -4);
    const [, , w, h] = readFileSync(resolve(dir, file), 'utf8')
      .match(/viewBox="([^"]+)"/)![1]
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    const entry = marks.get(name) ?? {};
    entry[variant] = Number((w / h).toFixed(4));
    marks.set(name, entry);
  }
}

const body = [...marks.keys()]
  .sort()
  .map((name) => `  '${name}': ${JSON.stringify(marks.get(name))},`)
  .join('\n');

writeFileSync(
  OUT,
  `${HEADER}

export const BRAND_MARKS = {
${body}
} as const;

/** A brand this package has artwork for. */
export type BrandMarkName = keyof typeof BRAND_MARKS;
`,
);
execFileSync('pnpm', ['exec', 'oxfmt', '--write', OUT], { cwd: ROOT, stdio: 'inherit' });
console.log(`brand manifest: ${marks.size} marks`);
