// Fill the few catalog glyphs the lobehub sets miss, from Microsoft's source
// repo (microsoft/fluentui-emoji, MIT). lobehub's packages are built from an
// older Microsoft snapshot, so some glyphs (mostly Unicode 15.1/16 + a handful
// of others) are absent — they fall back to the native glyph. Where Microsoft's
// repo HAS the artwork we pull it into the matching style:
//   3d     ← MS 3D            (png → webp via sharp)
//   flat   ← MS Flat          (svg)
//   modern ← MS Color         (svg)
//   mono   ← MS High Contrast (svg)
// Many gaps (newest Unicode, regional/subdivision flags, family ZWJ) are absent
// from Microsoft too — those stay on the native-glyph fallback, by design.
//
// Run AFTER sync-assets.mjs (which lays down the lobehub artwork + the gaps).
// Usage:  node packages/fluent-emoji/scripts/fill-gaps.mjs [--dry]
import { createRequire } from 'node:module';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DRY = process.argv.includes('--dry');
const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(here, '..');
const require = createRequire(import.meta.url);

const MS = 'microsoft/fluentui-emoji';
const RAW = `https://raw.githubusercontent.com/${MS}/main`;

/** our style id → { MS style folder, output ext, convert? }. */
const STYLE_MAP = {
  '3d': { ms: '3D', ext: 'webp', png: true },
  flat: { ms: 'Flat', ext: 'svg', png: false },
  modern: { ms: 'Color', ext: 'svg', png: false },
  mono: { ms: 'High Contrast', ext: 'svg', png: false },
};

const emojiToUnicode = (glyph) =>
  [...glyph].map((c) => c.codePointAt(0)?.toString(16)).filter(Boolean).join('-');

/** Codepoint key, FE0F-stripped + lowercased — the cross-naming match key. */
const normKey = (s) =>
  s.replace(/\s+/g, '-').toLowerCase().split('-').filter((x) => x && x !== 'fe0f').join('-');

/** Folder/name → snake slug: lowercase, non-alphanumeric runs → `_`. */
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

// --- catalog: key → { glyph, name } ------------------------------------------
const dataSrc = readFileSync(join(pkgRoot, 'src/lib/emoji-data.ts'), 'utf8');
const categories = JSON.parse(
  dataSrc.match(/EMOJI_CATEGORIES[^=]*=\s*(\[[\s\S]*?\]);/)[1],
);
const catalog = new Map();
for (const c of categories) {
  for (const e of c.emojis) {
    const key = emojiToUnicode(e.e);
    if (!catalog.has(key)) catalog.set(key, { glyph: e.e, name: e.n });
  }
}

// --- index Microsoft's repo from one recursive tree request -------------------
async function fetchTree() {
  const res = await fetch(
    `https://api.github.com/repos/${MS}/git/trees/main?recursive=1`,
    { headers: { 'User-Agent': 'chisel-fluent-emoji-sync', Accept: 'application/vnd.github+json' } },
  );
  if (!res.ok) throw new Error(`MS tree fetch failed: ${res.status} ${res.statusText}`);
  return res.json();
}

const tree = await fetchTree();
if (tree.truncated) throw new Error('MS tree truncated — needs paged fetch');
const folderBySlug = new Map(); // slug → folder name
const pathsByFolder = new Map(); // folder → { '3D': path, 'Color': path, ... }
// Toneless emoji: assets/<folder>/<Style>/<file>. Skin-tone emoji nest a tone
// level — assets/<folder>/Default/<Style>/<file> — and we want the Default tone
// (our catalog glyphs carry no tone modifier); the optional `Default/` matches
// both and skips Dark/Light/etc.
for (const node of tree.tree) {
  const m = node.path.match(
    /^assets\/([^/]+)\/(?:Default\/)?(3D|Color|Flat|High Contrast)\/[^/]+\.(png|svg)$/,
  );
  if (!m) continue;
  const [, folder, style] = m;
  if (!pathsByFolder.has(folder)) {
    pathsByFolder.set(folder, {});
    folderBySlug.set(slugify(folder), folder);
  }
  pathsByFolder.get(folder)[style] = node.path;
}

// --- per-style missing keys (catalog keys with no committed artwork) ----------
const missingByStyle = {};
for (const id of Object.keys(STYLE_MAP)) {
  const dir = join(pkgRoot, 'assets', id);
  const have = new Set(
    existsSync(dir) ? readdirSync(dir).map((f) => f.replace(/\.[^.]+$/, '')) : [],
  );
  missingByStyle[id] = [...catalog.keys()].filter((k) => !have.has(k));
}
const candidates = [...new Set(Object.values(missingByStyle).flat())];

// --- resolve each candidate against MS, download what exists ------------------
const metaCache = new Map();
async function msFolderFor(key) {
  const { name, glyph } = catalog.get(key);
  const folder = folderBySlug.get(slugify(name));
  if (!folder) return null;
  // Verify by codepoint so a slug collision can't pull the wrong glyph.
  if (!metaCache.has(folder)) {
    const res = await fetch(`${RAW}/assets/${encodeURIComponent(folder)}/metadata.json`);
    metaCache.set(folder, res.ok ? await res.json() : null);
  }
  const meta = metaCache.get(folder);
  if (!meta) return null;
  const ok = normKey(meta.unicode ?? '') === normKey(key) || meta.glyph === glyph;
  return ok ? folder : null;
}

const sharp = DRY ? null : require('sharp');
const filled = Object.fromEntries(Object.keys(STYLE_MAP).map((id) => [id, 0]));
let matched = 0;
const unmatched = [];

for (const key of candidates) {
  const folder = await msFolderFor(key);
  if (!folder) {
    unmatched.push(key);
    continue;
  }
  matched += 1;
  const paths = pathsByFolder.get(folder);
  for (const [id, { ms, ext, png }] of Object.entries(STYLE_MAP)) {
    if (!missingByStyle[id].includes(key)) continue; // this style already has it
    const srcPath = paths[ms];
    if (!srcPath) continue; // MS lacks this style for this glyph
    const out = join(pkgRoot, 'assets', id, `${key}.${ext}`);
    if (DRY) {
      filled[id] += 1;
      continue;
    }
    const res = await fetch(`${RAW}/${srcPath.split('/').map(encodeURIComponent).join('/')}`);
    if (!res.ok) continue;
    if (png) {
      const buf = Buffer.from(await res.arrayBuffer());
      await sharp(buf).resize(160, 160, { fit: 'inside' }).webp({ quality: 90 }).toFile(out);
    } else {
      writeFileSync(out, Buffer.from(await res.arrayBuffer()));
    }
    filled[id] += 1;
  }
}

// --- report -------------------------------------------------------------------
console.log(`${DRY ? '[dry] ' : ''}candidates: ${candidates.length} · matched in MS: ${matched} · no MS artwork: ${unmatched.length}`);
for (const id of Object.keys(STYLE_MAP)) {
  const before = missingByStyle[id].length;
  console.log(`  ${id}: filled ${filled[id]} / ${before} missing → ${before - filled[id]} still fall back`);
}
if (unmatched.length) {
  console.log('\nno Fluent artwork anywhere (native-glyph fallback, by design):');
  console.log('  ' + unmatched.map((k) => catalog.get(k).glyph).join(' '));
}
