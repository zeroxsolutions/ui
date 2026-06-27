// Regenerate `packages/fluent-emoji/assets/anim/` — the ANIMATED Fluent Emoji
// style — from lobehub's repackages of Microsoft's MIT-licensed artwork.
//
// Animated webp are large, so lobehub ships them split across FOUR npm packages
// (npm/CDN per-package size limits): @lobehub/fluent-emoji-anim-1 … -anim-4,
// partitioned by codepoint range. They are NOT added as devDeps (~700 MB would
// bloat every install); instead this script streams each package's tarball
// straight from the npm registry, extracts only its `assets/*.webp`, copies the
// catalog matches under OUR codepoint key (emojiToUnicode), and cleans up — the
// same network-fetch approach as `fill-gaps.mjs`.
//
// Upstream names pad each codepoint segment to >=4 hex digits and keep FE0F
// (e.g. `0023-fe0f-20e3.webp`, `1f600.webp`); our key strips the padding
// (`23-fe0f-20e3`, `1f600`), so we match on a canonical (leading-zeros-stripped),
// FE0F-tolerant key. Glyphs with no animated artwork upstream fall back to the
// native glyph at runtime, by design.
//
// Run independently of `sync-assets.mjs`/`fill-gaps.mjs` (those own the four
// static styles; this owns only `assets/anim/`).
//
// Usage:  node packages/fluent-emoji/scripts/sync-anim.mjs [--dry]
import { execFileSync } from 'node:child_process';
import {
  copyFileSync,
  createWriteStream,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';

const DRY = process.argv.includes('--dry');
const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(here, '..');

const REGISTRY = 'https://registry.npmjs.org';
const PACKAGES = [
  '@lobehub/fluent-emoji-anim-1',
  '@lobehub/fluent-emoji-anim-2',
  '@lobehub/fluent-emoji-anim-3',
  '@lobehub/fluent-emoji-anim-4',
];
const EXT = 'webp';

/** Same key as the runtime resolver: every code point as lowercase hex, '-'. */
const emojiToUnicode = (glyph) =>
  [...glyph]
    .map((char) => char.codePointAt(0)?.toString(16))
    .filter(Boolean)
    .join('-');

/** Strip leading zeros from each hex segment so upstream's `0023` matches our
 *  `23` (keep at least one digit). Our keys carry no padding, so this is the
 *  identity on them and only normalizes the upstream filenames. */
const canon = (key) =>
  key
    .toLowerCase()
    .split('-')
    .map((seg) => seg.replace(/^0+(?=.)/, ''))
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

// ourKey → { canon, stripped } and the reverse lookups upstream files match on.
const byCanon = new Map(); // canon(ourKey) → ourKey
const byStripped = new Map(); // stripFe0f(canon(ourKey)) → ourKey
for (const glyph of glyphs) {
  const ourKey = emojiToUnicode(glyph);
  if (!ourKey) continue;
  const c = canon(ourKey);
  if (!byCanon.has(c)) byCanon.set(c, ourKey);
  const s = stripFe0f(c);
  if (!byStripped.has(s)) byStripped.set(s, ourKey);
}

// An upstream stem matches our catalog two ways, in strict priority order so an
// EXACT match always wins over an FE0F-tolerant one. They MUST stay separate
// passes: upstream ships both `<cp>.webp` and `<cp>-fe0f.webp` for a few glyphs
// (e.g. `26a7`/`26a7-fe0f` ⚧️), and a single resolve()+first-readdir-wins loop
// would let whichever filename sorts first (the bare one) shadow the exact match.
/** Exact codepoint match (leading-zeros normalized), or null. */
const exactKey = (stem) => byCanon.get(canon(stem)) ?? null;
/** FE0F-stripped fallback match, or null. */
const strippedKey = (stem) => byStripped.get(stripFe0f(canon(stem))) ?? null;

// --- (re)build assets/anim/ ---------------------------------------------------
// Build into a sibling staging dir and swap it in atomically at the very end, so
// a mid-run failure (registry/tarball/`tar`) leaves any existing `assets/anim`
// untouched instead of half-wiped. Staging lives next to the target (same
// filesystem) so the final rename can't hit EXDEV.
const outDir = join(pkgRoot, 'assets', 'anim');
const stageDir = join(pkgRoot, 'assets', '.anim.staging');
if (!DRY) {
  rmSync(stageDir, { recursive: true, force: true });
  mkdirSync(stageDir, { recursive: true });
}

async function tarballUrl(pkg) {
  const res = await fetch(`${REGISTRY}/${pkg}/latest`, {
    headers: { 'User-Agent': 'chisel-fluent-emoji-sync', Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`${pkg}: metadata fetch failed ${res.status} ${res.statusText}`);
  const meta = await res.json();
  const url = meta?.dist?.tarball;
  if (!url) throw new Error(`${pkg}: no dist.tarball in metadata`);
  return { url, version: meta.version };
}

async function download(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': 'chisel-fluent-emoji-sync' } });
  if (!res.ok || !res.body) throw new Error(`tarball fetch failed ${res.status} ${res.statusText}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
}

const resolved = new Set(); // ourKeys already copied (first match wins)
let copied = 0;
let swapped = false;
const tmp = mkdtempSync(join(tmpdir(), 'fluent-anim-'));
try {
  for (const pkg of PACKAGES) {
    const { url, version } = await tarballUrl(pkg);
    const slug = pkg.replace(/[@/]/g, '_');
    const tgz = join(tmp, `${slug}.tgz`);
    const srcDir = join(tmp, slug);

    if (DRY) {
      console.log(`[dry] ${pkg}@${version} → ${url}`);
      continue;
    }

    await download(url, tgz);
    mkdirSync(srcDir, { recursive: true });
    // bsdtar/gnutar: extract only the assets subtree, dropping the
    // `package/assets/` prefix so files land directly in `srcDir`.
    execFileSync('tar', ['-xzf', tgz, '-C', srcDir, '--strip-components=2', 'package/assets'], {
      stdio: ['ignore', 'ignore', 'inherit'],
    });

    const files = readdirSync(srcDir).filter((f) => f.endsWith(`.${EXT}`));
    const take = (file, ourKey) => {
      if (!ourKey || resolved.has(ourKey)) return false;
      copyFileSync(join(srcDir, file), join(stageDir, `${ourKey}.${EXT}`));
      resolved.add(ourKey);
      return true;
    };
    let hits = 0;
    // Pass 1: exact codepoint matches. Pass 2: FE0F-stripped fallback for keys
    // still unmatched. Both variants of a glyph live in the SAME chunk (codepoint
    // partitioning), so two passes per chunk are enough to make exact always win.
    for (const file of files) hits += take(file, exactKey(file.slice(0, -(EXT.length + 1)))) ? 1 : 0;
    for (const file of files) hits += take(file, strippedKey(file.slice(0, -(EXT.length + 1)))) ? 1 : 0;
    copied += hits;
    console.log(`fluent-emoji anim ← ${pkg}@${version}: +${hits} (running ${copied}/${glyphs.length})`);

    // Free disk before the next ~170 MB chunk.
    rmSync(tgz, { force: true });
    rmSync(srcDir, { recursive: true, force: true });
  }

  // Everything succeeded — swap staging into place atomically.
  if (!DRY) {
    if (copied === 0) {
      throw new Error('No anim assets copied — registry/tarball fetch or `tar` extraction failed.');
    }
    rmSync(outDir, { recursive: true, force: true });
    renameSync(stageDir, outDir);
    swapped = true;
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
  // Drop a leftover staging dir on any path that didn't complete the swap, so a
  // failed run leaves the prior good `assets/anim` (if any) as the only set.
  if (!swapped) rmSync(stageDir, { recursive: true, force: true });
}

// --- report -------------------------------------------------------------------
const missing = glyphs.filter((g) => {
  const k = emojiToUnicode(g);
  return k && !resolved.has(k);
});
console.log(
  `\n${DRY ? '[dry] ' : ''}fluent-emoji anim: ${glyphs.length} glyphs → ${copied} copied, ${missing.length} missing (native-glyph fallback)`,
);
if (!DRY && existsSync(outDir)) {
  // Sanity: surface the on-disk count so a partial run is obvious.
  const onDisk = readdirSync(outDir).filter((f) => f.endsWith(`.${EXT}`)).length;
  if (onDisk !== copied) console.log(`note: ${onDisk} files on disk vs ${copied} copied this run`);
}
