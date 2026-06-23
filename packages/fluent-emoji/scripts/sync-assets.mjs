// Regenerate `packages/fluent-emoji/assets/` from @lobehub/fluent-emoji-3d
// (MIT, repackaging Microsoft's MIT-licensed Fluent Emoji). For every glyph in
// our catalog it copies the matching 3D `.webp`, saved under OUR codepoint key
// (emojiToUnicode) so the runtime resolver always lines up — independent of how
// the upstream set names its files. The artwork is then committed; this script
// is only re-run to refresh or extend the set.
//
// Usage:  node packages/fluent-emoji/scripts/sync-assets.mjs
import { createRequire } from 'node:module';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(here, '..');
const require = createRequire(import.meta.url);

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

// --- index the upstream 3D set, tolerant of FE0F naming differences ----------
const srcAssetsDir = join(
  dirname(require.resolve('@lobehub/fluent-emoji-3d/package.json')),
  'assets',
);
const srcFiles = readdirSync(srcAssetsDir).filter((f) => f.endsWith('.webp'));
const byExact = new Set(srcFiles.map((f) => f.replace(/\.webp$/, '')));
const byStripped = new Map();
for (const f of srcFiles) {
  const key = f.replace(/\.webp$/, '');
  const s = stripFe0f(key);
  if (!byStripped.has(s)) byStripped.set(s, key);
}

const resolveSource = (ourKey) => {
  if (byExact.has(ourKey)) return ourKey;
  const stripped = stripFe0f(ourKey);
  if (byExact.has(stripped)) return stripped;
  if (byStripped.has(stripped)) return byStripped.get(stripped);
  return null;
};

// --- rebuild assets/ ----------------------------------------------------------
const outDir = join(pkgRoot, 'assets');
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

let copied = 0;
const missed = [];
for (const glyph of glyphs) {
  const ourKey = emojiToUnicode(glyph);
  const sourceKey = resolveSource(ourKey);
  if (!sourceKey) {
    missed.push({ glyph, key: ourKey });
    continue;
  }
  copyFileSync(
    join(srcAssetsDir, `${sourceKey}.webp`),
    join(outDir, `${ourKey}.webp`),
  );
  copied += 1;
}

console.log(`fluent-emoji: ${glyphs.length} glyphs → ${copied} copied, ${missed.length} missing`);
if (missed.length) {
  console.log('missing (will fall back to the native glyph at runtime):');
  for (const m of missed) console.log(`  ${m.glyph}  ${m.key}`);
}
if (!existsSync(join(outDir, '.gitkeep')) && copied === 0) {
  throw new Error('No assets copied — is @lobehub/fluent-emoji-3d installed?');
}
