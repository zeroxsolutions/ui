// Regenerate `packages/fluent-emoji/assets/<style>/` from the lobehub repackages
// of Microsoft's MIT-licensed Fluent Emoji:
//   3D   → @lobehub/fluent-emoji-3d   (.webp)
//   Flat → @lobehub/fluent-emoji-flat (.svg)
// For every glyph in our catalog it copies the matching artwork, saved under OUR
// codepoint key (emojiToUnicode) so the runtime resolver always lines up —
// independent of how the upstream set names its files. Layout is by STYLE
// (assets/3d/<cp>.webp, assets/flat/<cp>.svg), not by name: the lookup key is the
// codepoint, and a runtime package keys on it, not on a human folder name. The
// artwork is committed; this script is only re-run to refresh or extend the set.
//
// Glyphs absent from a set fall back to the native glyph at runtime; see
// `fill-gaps.mjs` for pulling the few that exist in Microsoft's source repo.
//
// Usage:  node packages/fluent-emoji/scripts/sync-assets.mjs
import { createRequire } from 'node:module';
import { copyFileSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(here, '..');
const require = createRequire(import.meta.url);

// Each style: upstream lobehub package + file extension. Saved under assets/<id>/.
// All four are static and self-hosted; the animated `anim` style is NOT here —
// at ~300 KB/glyph it is ~527 MB, served lazily from a CDN instead (see the
// plan's "DEFERRED — anim" note), not committed.
const STYLES = [
  { id: '3d', pkg: '@lobehub/fluent-emoji-3d', ext: 'webp' },
  { id: 'flat', pkg: '@lobehub/fluent-emoji-flat', ext: 'svg' },
  { id: 'modern', pkg: '@lobehub/fluent-emoji-modern', ext: 'svg' },
  { id: 'mono', pkg: '@lobehub/fluent-emoji-mono', ext: 'svg' },
];

/** Same key as the runtime resolver: every code point as lowercase hex, '-'. */
const emojiToUnicode = (glyph) =>
  [...glyph]
    .map((char) => char.codePointAt(0)?.toString(16))
    .filter(Boolean)
    .join('-');

/** Drop the FE0F variation selector so keys match across set-naming styles. */
const stripFe0f = (key) =>
  key
    .split('-')
    .filter((seg) => seg !== 'fe0f')
    .join('-');

// --- collect every glyph from the catalog (pure JSON embedded in the .ts) -----
const dataSrc = readFileSync(join(pkgRoot, 'src/lib/emoji-data.ts'), 'utf8');
const match = dataSrc.match(/EMOJI_CATEGORIES[^=]*=\s*(\[[\s\S]*?\]);/);
if (!match) throw new Error('Could not locate EMOJI_CATEGORIES array in emoji-data.ts');
const categories = JSON.parse(match[1]);
const glyphs = [...new Set(categories.flatMap((c) => c.emojis.map((e) => e.e)))];

/** Index an upstream set, tolerant of FE0F naming differences. */
const indexSet = (srcDir, ext) => {
  const files = readdirSync(srcDir).filter((f) => f.endsWith(`.${ext}`));
  const byExact = new Set(files.map((f) => f.replace(new RegExp(`\\.${ext}$`), '')));
  const byStripped = new Map();
  for (const f of files) {
    const key = f.replace(new RegExp(`\\.${ext}$`), '');
    const s = stripFe0f(key);
    if (!byStripped.has(s)) byStripped.set(s, key);
  }
  const resolve = (ourKey) => {
    if (byExact.has(ourKey)) return ourKey;
    const stripped = stripFe0f(ourKey);
    if (byExact.has(stripped)) return stripped;
    if (byStripped.has(stripped)) return byStripped.get(stripped);
    return null;
  };
  return { resolve };
};

// --- rebuild assets/<style>/ for each style ----------------------------------
rmSync(join(pkgRoot, 'assets'), { recursive: true, force: true });

const missingByStyle = {};
for (const { id, pkg, ext } of STYLES) {
  const srcDir = join(dirname(require.resolve(`${pkg}/package.json`)), 'assets');
  const { resolve } = indexSet(srcDir, ext);
  const outDir = join(pkgRoot, 'assets', id);
  mkdirSync(outDir, { recursive: true });

  let copied = 0;
  const missed = [];
  for (const glyph of glyphs) {
    const ourKey = emojiToUnicode(glyph);
    const sourceKey = resolve(ourKey);
    if (!sourceKey) {
      missed.push({ glyph, key: ourKey });
      continue;
    }
    copyFileSync(join(srcDir, `${sourceKey}.${ext}`), join(outDir, `${ourKey}.${ext}`));
    copied += 1;
  }
  missingByStyle[id] = missed;
  console.log(`fluent-emoji ${id}: ${glyphs.length} glyphs → ${copied} copied, ${missed.length} missing`);
  if (copied === 0) {
    throw new Error(`No ${id} assets copied — is ${pkg} installed?`);
  }
}

// Keys missing from EVERY style — the gap `fill-gaps.mjs` tries from MS source.
const missingSets = STYLES.map((s) => new Set((missingByStyle[s.id] ?? []).map((m) => m.key)));
const everywhereMissing = (missingByStyle[STYLES[0].id] ?? []).filter((m) =>
  missingSets.every((set) => set.has(m.key)),
);
if (everywhereMissing.length) {
  console.log(`\nmissing from all styles (fall back to native glyph): ${everywhereMissing.length}`);
  for (const m of everywhereMissing) console.log(`  ${m.glyph}  ${m.key}`);
}
