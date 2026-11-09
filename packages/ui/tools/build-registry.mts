/**
 * Writes the web registry once per base style, to `dist/r/styles/base-<style>/`. Each style's published
 * files are copied into `dist/staging/<style>/` with every `cn-` slot replaced by the classes that style
 * draws it with, as `src/build/style-source.ts` reads them, and `shadcn build` turns that copy into the
 * served JSON. A slot left in a style's output stops the build, naming the file and the style.
 */
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import { STYLES, styleMapOf, styleSource, type Style } from '../src/build/style-source.ts';

const ROOT = resolve(import.meta.dirname, '..');
const STAGING = join(ROOT, 'dist/staging');
const OUT = join(ROOT, 'dist/r/styles');
const SHADCN = join(ROOT, 'node_modules/.bin/shadcn');
const WORKSPACE = resolve(ROOT, '../..');
const OXFMT = join(WORKSPACE, 'node_modules/.bin/oxfmt');
const SLOT = /\bcn-[a-z0-9-]+/g;
const HAS_SLOT = /\bcn-[a-z0-9-]+/;

interface Registry {
  items: { files?: { path: string }[] }[];
}

const registry = JSON.parse(readFileSync(join(ROOT, 'registry.json'), 'utf8')) as Registry;
const paths = [...new Set(registry.items.flatMap((item) => (item.files ?? []).map((file) => file.path)))];

/** The slots each served file of `style` still holds, as `<file>: <slot>`. */
function slotsLeft(directory: string): string[] {
  return readdirSync(directory)
    .filter((name) => name.endsWith('.json'))
    .flatMap((name) => {
      const item = JSON.parse(readFileSync(join(directory, name), 'utf8')) as {
        files?: { path: string; content?: string }[];
      };
      return (item.files ?? []).flatMap((file) =>
        [...new Set(file.content?.match(SLOT) ?? [])].map((slot) => `${file.path}: ${slot}`),
      );
    });
}

async function buildStyle(style: Style): Promise<void> {
  const staging = join(STAGING, style);
  const styleMap = styleMapOf(ROOT, style);
  mkdirSync(staging, { recursive: true });
  copyFileSync(join(ROOT, 'registry.json'), join(staging, 'registry.json'));
  const transformed: string[] = [];
  for (const path of paths) {
    const source = readFileSync(join(ROOT, path), 'utf8');
    mkdirSync(dirname(join(staging, path)), { recursive: true });
    if (!HAS_SLOT.test(source)) {
      writeFileSync(join(staging, path), source);
      continue;
    }
    writeFileSync(join(staging, path), await styleSource(source, styleMap));
    transformed.push(path);
  }
  // The transform reprints the strings it rewrites on one line; the workspace's formatter lays them out as
  // the source is, under its own config, whose ignore list would pass over everything under `dist`.
  const { ignorePatterns: _ignored, ...format } = JSON.parse(
    readFileSync(join(WORKSPACE, '.oxfmtrc.json'), 'utf8'),
  ) as Record<string, unknown>;
  writeFileSync(join(staging, '.oxfmtrc.json'), JSON.stringify(format));
  if (transformed.length > 0)
    execFileSync(OXFMT, ['-c', '.oxfmtrc.json', ...transformed], { cwd: staging, stdio: 'ignore' });
  const out = join(OUT, `base-${style}`);
  execFileSync(SHADCN, ['build', '-o', out], { cwd: staging, stdio: ['ignore', 'ignore', 'inherit'] });
  const left = slotsLeft(out);
  if (left.length > 0) throw new Error(`base-${style} still holds slots:\n${left.join('\n')}`);
}

rmSync(STAGING, { recursive: true, force: true });
for (const style of STYLES) await buildStyle(style);
rmSync(STAGING, { recursive: true, force: true });
console.log(`dist/r/styles: ${STYLES.length} styles, ${paths.length} files each`);
