# BrandMark Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 201 inline brand-mark components of `@zeroxsolutions/icons` with one `<BrandMark>` that draws SVG files served from `icons.zeroxsolutions.com`.

**Architecture:** A one-time script renders today's components to `packages/icons/assets/brands/<variant>/<name>.svg`; a generator writes `src/lib/brand-manifest.ts` from those files; `src/brand-mark.tsx` resolves a name and a variant to a URL and draws an `<img>` (`color`, `avatar`) or a `currentColor` mask (`mono`, `combine`), falling back along a fixed chain. `AiProviderIcon` keeps its API and renders `<BrandMark>`. The files ship in the tarball and are uploaded to R2 by the existing `rclone-sync` job.

**Tech Stack:** React 19, Vite library mode, Vitest (jsdom), Playwright (registry-ui e2e), nx, rclone, Terraform (human-run).

**Spec:** `docs/superpowers/specs/2026-10-06-brand-mark-design.md`

## Global Constraints

- Public entry: `@zeroxsolutions/icons/brand-mark` only; nothing under `src/lib/` becomes a subpath.
- Variants: `'color' | 'mono' | 'avatar' | 'combine'`, default `'color'`.
- Fallback chain: `combine` and `avatar` fall to `color`, `color` falls to `mono`, `mono` falls to the first letter.
- Default base: `https://icons.zeroxsolutions.com/brands`; URL shape `<base>/<variant>/<name>.svg`.
- `avatar` takes `shape: 'circle' | 'square'`, default `'circle'`; `circle` is `border-radius: 50%`, `square` is `25%`.
- Without `label` a mark is decorative (`alt=""` / `aria-hidden`); with it, it is named.
- No colour data beside the files: no `colorPrimary`, no colours JSON.
- CI variables: `FLUENT_EMOJI_BUCKET=ui-sdk-fluent-emoji-production`, `ICONS_BUCKET=ui-sdk-icons-production` (already set on the `production` environment). `RCLONE_S3_*` keep their names.
- Names follow fluent-emoji's: `BrandMark`, `BrandMarkStyleProvider`, `setBrandMarkBase`, `setBrandMarkStyle`, `brandMarkUrl`, `useBrandMarkStyle`.
- Commit messages follow Conventional Commits, written to a `mktemp` file and passed with `-F`, and end with the `Co-Authored-By` trailer; paths are named on every commit; no `--no-verify`. The pre-commit hook formats staged files; after it, run `git restore --staged <paths>` if `git status` shows `MM`.
- All authored text is plain ASCII.

## Review Focus

1. **A recycled instance**: the same `<BrandMark>` re-rendered with a different `name` after its first file failed must try the new mark's files from the top of its chain, not stay on the letter. Pinned in Task 4.
2. **A non-square mark at a CSS-length size**: `size="1.25rem"` on a mark whose ratio is 3.2 must be `1.25rem` tall and `calc(1.25rem * 3.2)` wide, not square. Pinned in Task 4.
3. **A base with a trailing slash**: `setBrandMarkBase('/brand-marks/')` must not produce `//color/...`. Pinned in Task 3.
4. **A failure before hydration, and a success that looks like one**: an `<img>` already `complete` with `naturalWidth` 0 at mount must fall back (pinned in Task 4), and a file that loaded must not look like that, which an svg without `width`/`height` does in Firefox (every file carries its size, pinned in Task 2 Step 4).
5. **The registry page before the CDN serves files**: the e2e suite must not depend on `icons.zeroxsolutions.com`; it serves the files from the package itself. Pinned in Task 7.

---

## File Structure

| Path (under `packages/icons/` unless noted)                       | Responsibility                                                               |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `tools/export-brand-svgs.mts`                                     | One-time: renders `dist/brands/*.js` to `assets/brands/`. Deleted in Task 6. |
| `assets/brands/{color,mono,avatar,combine}/<name>.svg`            | The artwork, the source of truth after Task 6.                               |
| `tools/build-brand-manifest.mts`                                  | Writes `src/lib/brand-manifest.ts` from `assets/brands/`.                    |
| `src/lib/brand-manifest.ts`                                       | Generated: per name, the variants it has and each one's width/height ratio.  |
| `src/lib/brand-manifest.spec.ts`                                  | The manifest and the files agree.                                            |
| `src/lib/brand-mark-url.ts`                                       | Variant type, base and style defaults, fallback chain, `brandMarkUrl`.       |
| `src/lib/brand-mark-url.spec.ts`                                  | URL and chain resolution.                                                    |
| `src/lib/brand-mark-style-provider.tsx`                           | `BrandMarkStyleProvider`, `useBrandMarkStyle`, `useAmbientBrandMarkStyle`.   |
| `src/brand-mark.tsx`                                              | `<BrandMark>`; re-exports the public names of the two `lib` modules.         |
| `src/brand-mark.spec.tsx`                                         | Drawing, fallback, naming, ambient style and base.                           |
| `src/ai-provider-mappings.ts`                                     | Provider keys to `BrandMarkName`.                                            |
| `src/ai-provider-icon.tsx` (+ `.spec.tsx`)                        | Same props, renders `<BrandMark>`.                                           |
| `vite.config.mts`                                                 | Ignore `src/lib/**` as entries; copy `assets/` to `dist/assets/`.            |
| `tools/rclone-sync.sh`                                            | Upload `assets/` to `ICONS_BUCKET`.                                          |
| `package.json`                                                    | `nx.targets`: `brand-manifest`, `rclone:sync`.                               |
| `README.md`                                                       | Brand section rewritten for `<BrandMark>`.                                   |
| `packages/fluent-emoji/tools/rclone-sync.sh`                      | Reads `FLUENT_EMOJI_BUCKET`.                                                 |
| `.github/workflows/cd.yml`                                        | `rclone-sync` step passes both bucket variables.                             |
| `apps/registry-ui/registry/bases/base-ui/examples/icons-demo.tsx` | Demo on `<BrandMark>`.                                                       |
| `apps/registry-ui/content/docs/packages/icons.mdx`                | Docs on `<BrandMark>`.                                                       |
| `apps/registry-ui-e2e/src/icons.spec.ts`                          | A `mono` mark draws as a mask in a real browser.                             |

---

### Task 1: Name each bucket for its package

**Files:**

- Modify: `packages/fluent-emoji/tools/rclone-sync.sh`
- Modify: `.github/workflows/cd.yml` (the `Sync to R2` step)

**Interfaces:**

- Produces: the convention Task 6's `packages/icons/tools/rclone-sync.sh` follows (`<CONCERN>_BUCKET`).

No target runs a shell script or a workflow file, so this task has no test of its own; its check is the first `rclone-sync` run in Task 8.

- [ ] **Step 1: Rename the variable in fluent-emoji's script**

In `packages/fluent-emoji/tools/rclone-sync.sh`, replace every `S3_BUCKET` with `FLUENT_EMOJI_BUCKET` (the `missing` loop, the comment above it that says "S3_BUCKET keeps a house name", and the `rclone copy assets ":s3:${S3_BUCKET}"` line). Rewrite that comment to:

```bash
# FLUENT_EMOJI_BUCKET is this package's own name for its bucket, `<CONCERN>_BUCKET` as a worker's
# bucket binding is named; rclone reads no variable for it, since the bucket is the destination path.
```

- [ ] **Step 2: Pass both variables from the workflow**

In `.github/workflows/cd.yml`, in the `Sync to R2` step's `env`, replace `S3_BUCKET: ${{ vars.S3_BUCKET }}` with:

```yaml
FLUENT_EMOJI_BUCKET: ${{ vars.FLUENT_EMOJI_BUCKET }}
ICONS_BUCKET: ${{ vars.ICONS_BUCKET }}
```

and change the comment above it that reads "The bucket name is a `var`" to "Each bucket name is a `var`".

- [ ] **Step 3: Check nothing else reads the old name**

Run: `grep -rn "S3_BUCKET" --include='*.sh' --include='*.yml' --include='*.md' . | grep -v node_modules | grep -v RCLONE_S3 | grep -v docs/superpowers/`
Expected: no output.

- [ ] **Step 4: Commit**

```bash
MSG=$(mktemp)
cat > "$MSG" <<'EOF'
ci: name each R2 bucket variable for the package it holds

Why: S3_BUCKET named neither its package nor anything but the vendor's
protocol, and a second package is about to upload to its own bucket.

Refs: #24

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
git add -- packages/fluent-emoji/tools/rclone-sync.sh .github/workflows/cd.yml
git commit -F "$MSG" -- packages/fluent-emoji/tools/rclone-sync.sh .github/workflows/cd.yml
```

---

### Task 2: Render today's marks to files

**Files:**

- Create: `packages/icons/tools/export-brand-svgs.mts`
- Create: `packages/icons/assets/brands/{color,mono,avatar,combine}/*.svg` (generated)

**Interfaces:**

- Consumes: `packages/icons/dist/brands/*.js` from `nx build @zeroxsolutions/icons`.
- Produces: the files Task 3's manifest reads. One file per name per variant, names in kebab-case equal to today's `src/brands/<name>.tsx` basenames.

- [ ] **Step 1: Build the package so the components exist as plain JS**

Run: `pnpm nx build @zeroxsolutions/icons --skip-nx-cache`
Expected: `Successfully ran target build for project @zeroxsolutions/icons`; `ls packages/icons/dist/brands/*.js | wc -l` prints `201`.

- [ ] **Step 2: Write the export script**

`packages/icons/tools/export-brand-svgs.mts`:

```ts
/**
 * One-time: renders every brand component in dist/brands/ to assets/brands/<variant>/<name>.svg.
 * Deleted by the commit that deletes the components; the files are the source from then on.
 */
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createElement, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const ROOT = resolve(import.meta.dirname, '..');
const DIST = resolve(ROOT, 'dist/brands');
const OUT = resolve(ROOT, 'assets/brands');
const VARIANTS = ['color', 'mono', 'avatar', 'combine'] as const;
for (const v of VARIANTS) mkdirSync(resolve(OUT, v), { recursive: true });

type Mark = ComponentType<Record<string, unknown>> & {
  Color?: ComponentType<Record<string, unknown>>;
  Mono?: ComponentType<Record<string, unknown>>;
  Text?: ComponentType<Record<string, unknown>>;
  Avatar?: ComponentType<Record<string, unknown>>;
  Combine?: ComponentType<Record<string, unknown>>;
};

const render = (C: ComponentType<Record<string, unknown>>, props: Record<string, unknown> = {}) =>
  renderToStaticMarkup(createElement(C, props));

const viewBoxOf = (svg: string): [number, number, number, number] => {
  const m = svg.match(/viewBox="([^"]+)"/);
  if (!m) throw new Error('svg without a viewBox');
  return m[1]
    .trim()
    .split(/[\s,]+/)
    .map(Number) as [number, number, number, number];
};

/**
 * Makes a component's markup a standalone image file: no title, no root inline style, the root's
 * size set to its viewBox (an <img> of an svg with no width/height reports naturalWidth 0 in
 * Firefox, which BrandMark reads as a failed load), an xmlns, and React's ids made fixed.
 */
function clean(svg: string, name: string): string {
  const [, , w, h] = viewBoxOf(svg);
  let out = svg
    .replace(/<title>[^<]*<\/title>/g, '')
    .replace(/^<svg([^>]*?)\sstyle="[^"]*"/, '<svg$1')
    .replace(/^<svg([^>]*?)\s(?:width|height)="[^"]*"/, '<svg$1')
    .replace(/^<svg([^>]*?)\s(?:width|height)="[^"]*"/, '<svg$1')
    .replace(/^<svg/, `<svg width="${w}" height="${h}"`);
  if (!/^<svg[^>]*\sxmlns=/.test(out)) out = out.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  const ids = [...out.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  ids.forEach((id, i) => {
    const fixed = `${name}-${i}`;
    out = out.split(`id="${id}"`).join(`id="${fixed}"`).split(`#${id}`).join(`#${fixed}`);
  });
  return out;
}

/** Places an <svg> at x,y,w,h inside another, with `color` set so its currentColor resolves. */
const place = (svg: string, x: number, y: number, w: number, h: number, color: string) =>
  svg
    .replace(/^<svg([^>]*?)\s(?:width|height|color)="[^"]*"/, '<svg$1')
    .replace(/^<svg([^>]*?)\s(?:width|height|color)="[^"]*"/, '<svg$1')
    .replace(/^<svg([^>]*?)\s(?:width|height|color)="[^"]*"/, '<svg$1')
    .replace(/^<svg/, `<svg x="${x}" y="${y}" width="${w}" height="${h}" color="${color}"`);

/** A CSS linear-gradient as an SVG <linearGradient> over the object's box. */
function gradient(css: string, id: string): string {
  const inner = css.slice(css.indexOf('(') + 1, css.lastIndexOf(')'));
  const parts = inner.split(/,(?![^(]*\))/).map((p) => p.trim());
  let deg = 180;
  if (/deg$/.test(parts[0])) deg = parseFloat(parts.shift()!);
  else if (parts[0].startsWith('to ')) {
    deg = { 'to top': 0, 'to right': 90, 'to bottom': 180, 'to left': 270 }[parts.shift()!] ?? 180;
  }
  const rad = (deg * Math.PI) / 180;
  const [sx, sy] = [Math.sin(rad) / 2, Math.cos(rad) / 2];
  const stops = parts.map((p, i) => {
    const [color, pos] = p.split(/\s+/);
    const offset = pos ?? `${(i / (parts.length - 1)) * 100}%`;
    return `<stop offset="${offset}" stop-color="${color}"/>`;
  });
  return `<linearGradient id="${id}" x1="${0.5 - sx}" y1="${0.5 + sy}" x2="${0.5 + sx}" y2="${0.5 - sy}">${stops.join('')}</linearGradient>`;
}

const counts = { color: 0, mono: 0, avatar: 0, combine: 0 };
const write = (variant: (typeof VARIANTS)[number], name: string, svg: string) => {
  writeFileSync(resolve(OUT, variant, `${name}.svg`), `${svg}\n`);
  counts[variant] += 1;
};

for (const file of readdirSync(DIST)
  .filter((f) => f.endsWith('.js'))
  .sort()) {
  const name = file.slice(0, -3);
  const mod = (await import(resolve(DIST, file))) as Record<string, unknown>;
  const Mark = Object.values(mod).find((v) => typeof v === 'function') as Mark;
  const base = clean(render(Mark), name);
  const baseIsMono = base.includes('currentColor');

  const Mono = Mark.Mono ?? (baseIsMono ? Mark : undefined);
  const Color = Mark.Color ?? (baseIsMono ? undefined : Mark);
  const mono = Mono ? clean(render(Mono), name).replace(/^<svg/, '<svg color="#000"') : undefined;

  if (Color) write('color', name, clean(render(Color), name));
  if (mono) write('mono', name, mono);

  if (Mark.Avatar) {
    // The avatar's own glyph, which is the colour base for the full-colour marks.
    const html = render(Mark.Avatar, { size: 100 });
    const background = html.match(/background:(.*?);border-radius/)![1];
    const color = html.match(/;color:([^;"]+)/)?.[1] ?? '#fff';
    const icon = Number(html.match(/<svg[^>]*?width="(\d+)"/)![1]);
    const glyph = clean(html.slice(html.indexOf('<svg'), html.lastIndexOf('</svg>') + 6), `${name}-a`);
    const fill = background.startsWith('linear-gradient') ? `url(#${name}-bg)` : background;
    const defs = background.startsWith('linear-gradient') ? `<defs>${gradient(background, `${name}-bg`)}</defs>` : '';
    const o = (100 - icon) / 2;
    write(
      'avatar',
      name,
      `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">${defs}<rect width="100" height="100" fill="${fill}"/>${place(glyph, o, o, icon, icon, color)}</svg>`,
    );
  }

  if (Mark.Combine && Mark.Text && mono) {
    const html = render(Mark.Combine, { size: 100 });
    const gap = Number(html.match(/gap:(\d+)px/)![1]);
    const textHeight = Number(html.match(/font-size:(\d+)px/)![1]);
    const text = clean(render(Mark.Text), `${name}-t`);
    const [, , mw, mh] = viewBoxOf(mono);
    const [, , tw, th] = viewBoxOf(text);
    const iconWidth = (100 * mw) / mh;
    const textWidth = (textHeight * tw) / th;
    const width = iconWidth + gap + textWidth;
    write(
      'combine',
      name,
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="100" viewBox="0 0 ${width} 100">${place(mono, 0, 0, iconWidth, 100, '#000')}${place(text, iconWidth + gap, (100 - textHeight) / 2, textWidth, textHeight, '#000')}</svg>`,
    );
  }
}

console.log(`exported: ${JSON.stringify(counts)}`);
```

- [ ] **Step 3: Run it**

Run: `cd packages/icons && node tools/export-brand-svgs.mts`
Expected: one line `exported: {"color":N,"mono":N,"avatar":191,"combine":91}`, with `color` at least 167 and `mono` at least 184 (today's `.Color` and `.Mono` counts). If `avatar` is not 191 or `combine` not 91, a regex above missed a shape: print the `html` of the first name it skipped and fix the regex before going on.

- [ ] **Step 4: Look at every file**

Write a throwaway contact sheet outside the repo and screenshot it:

```bash
SHEET=$(mktemp).html
node -e "
const fs=require('fs');const d='packages/icons/assets/brands';
const rows=['color','mono','avatar','combine'].map(v=>'<h2>'+v+'</h2><div>'+fs.readdirSync(d+'/'+v).map(f=>'<img title=\"'+f+'\" style=\"height:32px;margin:4px;background:#eee\" src=\"'+process.cwd()+'/'+d+'/'+v+'/'+f+'\">').join('')+'</div>');
fs.writeFileSync(process.argv[1],'<body>'+rows.join('')+'</body>');" "$SHEET"
```

Then check every file parses as XML and carries a size (a duplicate attribute or a missing xmlns renders as a broken image):

```bash
node -e "
const fs=require('fs');const {JSDOM}=require('jsdom');const d='packages/icons/assets/brands';let bad=0;
for(const v of fs.readdirSync(d))for(const f of fs.readdirSync(d+'/'+v)){
  const doc=new JSDOM(fs.readFileSync(d+'/'+v+'/'+f,'utf8'),{contentType:'image/svg+xml'}).window.document;
  const r=doc.documentElement;
  if(r.nodeName!=='svg'||!r.getAttribute('width')||!r.getAttribute('height')){bad++;console.log(v+'/'+f)}}
console.log('bad:',bad)"
```

Expected: `bad: 0` (a file that fails to parse has a `parsererror` root and is listed). Run it from `packages/icons` with `NODE_PATH=node_modules` if `jsdom` does not resolve from the root.

Open `$SHEET` in a browser (or screenshot it with Playwright) and check: no blank tile, `mono` tiles are black silhouettes, `avatar` tiles are filled squares with the mark centred (the six gradient avatars `lmstudio`, `minimax`, `meta`, `sora`, `stability-ai`, `stable-diffusion` show a gradient), `combine` tiles show the mark then the brand's wordmark at roughly two thirds of its height. Fix the script and re-run Step 3 for anything off.

- [ ] **Step 5: Commit the script and the files**

```bash
MSG=$(mktemp)
cat > "$MSG" <<'EOF'
feat(icons): render every brand mark to an svg file per variant

Why: brand marks move from inline components to files a CDN serves;
this renders today's components so the artwork stays the same.

Refs: #24

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
git add -- packages/icons/tools/export-brand-svgs.mts packages/icons/assets/brands
git commit -F "$MSG" -- packages/icons/tools/export-brand-svgs.mts packages/icons/assets/brands
```

---

### Task 3: The manifest and the URL resolver

**Files:**

- Create: `packages/icons/tools/build-brand-manifest.mts`
- Create: `packages/icons/src/lib/brand-manifest.ts` (generated)
- Create: `packages/icons/src/lib/brand-manifest.spec.ts`
- Create: `packages/icons/src/lib/brand-mark-url.ts`
- Create: `packages/icons/src/lib/brand-mark-url.spec.ts`
- Modify: `packages/icons/package.json` (`nx.targets.brand-manifest`)
- Modify: `packages/icons/vite.config.mts` (entry ignores, asset copy)

**Interfaces:**

- Consumes: `assets/brands/<variant>/<name>.svg` from Task 2.
- Produces:
  - `BRAND_MARKS: Readonly<Record<string, Readonly<Partial<Record<BrandMarkVariant, number>>>>>` (variant to width/height ratio) and `type BrandMarkName` in `src/lib/brand-manifest.ts`.
  - In `src/lib/brand-mark-url.ts`: `type BrandMarkVariant = 'color' | 'mono' | 'avatar' | 'combine'`, `DEFAULT_BRAND_MARK_BASE: string`, `setBrandMarkBase(base: string | undefined): void`, `setBrandMarkStyle(variant: BrandMarkVariant | undefined): void`, `getBrandMarkStyle(): BrandMarkVariant`, `brandMarkChain(name: BrandMarkName, variant: BrandMarkVariant): BrandMarkVariant[]`, `brandMarkUrl(name: BrandMarkName, options?: { variant?: BrandMarkVariant; base?: string }): string | undefined`, `brandMarkRatio(name: BrandMarkName, variant: BrandMarkVariant): number`.

- [ ] **Step 1: Write the generator**

`packages/icons/tools/build-brand-manifest.mts`:

```ts
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
execFileSync('pnpm', ['exec', 'prettier', '--write', OUT], { cwd: ROOT, stdio: 'inherit' });
console.log(`brand manifest: ${marks.size} marks`);
```

- [ ] **Step 2: Add the target and run it**

In `packages/icons/package.json`, add under `nx.targets` (create `nx` / `targets` if absent):

```json
"brand-manifest": {
  "executor": "nx:run-commands",
  "outputs": ["{projectRoot}/src/lib/brand-manifest.ts"],
  "options": { "cwd": "{projectRoot}", "command": "node tools/build-brand-manifest.mts" }
}
```

Run: `pnpm nx brand-manifest @zeroxsolutions/icons`
Expected: `brand manifest: 201 marks`, and `src/lib/brand-manifest.ts` exists.

- [ ] **Step 3: Write the manifest spec**

`packages/icons/src/lib/brand-manifest.spec.ts`:

```ts
// @vitest-environment node
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { BRAND_MARKS } from './brand-manifest';

const ROOT = resolve(import.meta.dirname, '../..');
const VARIANTS = ['color', 'mono', 'avatar', 'combine'] as const;

const files = VARIANTS.flatMap((variant) =>
  readdirSync(resolve(ROOT, 'assets/brands', variant))
    .filter((f) => f.endsWith('.svg'))
    .map((f) => `${variant}/${f.slice(0, -4)}`),
).sort();

const listed = Object.entries(BRAND_MARKS)
  .flatMap(([name, variants]) => Object.keys(variants).map((variant) => `${variant}/${name}`))
  .sort();

describe('brand-manifest (generated from assets/brands/)', () => {
  it('lists every file under assets/brands/, and nothing without a file', () => {
    expect(listed).toEqual(files);
  });

  it('gives every mark at least one of color or mono, the end of every fallback chain', () => {
    const bare = Object.entries(BRAND_MARKS).filter(([, v]) => !('color' in v) && !('mono' in v));
    expect(bare).toEqual([]);
  });
});
```

Run: `pnpm nx test @zeroxsolutions/icons -- src/lib/brand-manifest.spec.ts`
Expected: PASS (2 tests). Then delete one file, e.g. `mv assets/brands/mono/facebook.svg "$(mktemp -d)"/`, re-run, see the first case FAIL, and move it back.

- [ ] **Step 4: Write the failing resolver spec**

`packages/icons/src/lib/brand-mark-url.spec.ts`:

```ts
// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest';

import {
  brandMarkChain,
  brandMarkUrl,
  DEFAULT_BRAND_MARK_BASE,
  setBrandMarkBase,
  setBrandMarkStyle,
} from './brand-mark-url';

afterEach(() => {
  setBrandMarkBase(undefined);
  setBrandMarkStyle(undefined);
});

describe('brandMarkUrl', () => {
  it('resolves the colour file on the default base', () => {
    expect(brandMarkUrl('facebook')).toBe(`${DEFAULT_BRAND_MARK_BASE}/color/facebook.svg`);
  });

  it('takes a per-call variant and base over the module defaults', () => {
    setBrandMarkBase('https://elsewhere.example');
    setBrandMarkStyle('avatar');
    expect(brandMarkUrl('openai', { variant: 'mono', base: '/marks' })).toBe('/marks/mono/openai.svg');
  });

  it('drops a trailing slash on the base', () => {
    setBrandMarkBase('/brand-marks/');
    expect(brandMarkUrl('facebook')).toBe('/brand-marks/color/facebook.svg');
  });

  it('answers undefined for a variant the mark has no file for', () => {
    // google-play ships no combine file; <BrandMark> falls back, brandMarkUrl reports.
    expect(brandMarkUrl('google-play', { variant: 'combine' })).toBeUndefined();
  });
});

describe('brandMarkChain', () => {
  it('walks combine to color, then color to mono, for a mark with every variant', () => {
    expect(brandMarkChain('claude', 'combine')).toEqual(['combine', 'color', 'mono']);
  });

  it('skips a variant the mark has no file for', () => {
    // openai ships no colour file: its mark is one colour.
    expect(brandMarkChain('openai', 'combine')).toEqual(['combine', 'mono']);
  });

  it('ends at mono', () => {
    expect(brandMarkChain('openai', 'mono')).toEqual(['mono']);
  });
});
```

Run: `pnpm nx test @zeroxsolutions/icons -- src/lib/brand-mark-url.spec.ts`
Expected: FAIL, `Cannot find module './brand-mark-url'`.

- [ ] **Step 5: Write the resolver**

`packages/icons/src/lib/brand-mark-url.ts`:

```ts
import { BRAND_MARKS, type BrandMarkName } from './brand-manifest';

/** How a brand mark draws: its own colours, one colour, on a filled tile, or beside its wordmark. */
export type BrandMarkVariant = 'color' | 'mono' | 'avatar' | 'combine';

/** Where the artwork is served unless a caller says otherwise: `<base>/<variant>/<name>.svg`. */
export const DEFAULT_BRAND_MARK_BASE = 'https://icons.zeroxsolutions.com/brands';

const NEXT: Record<BrandMarkVariant, BrandMarkVariant | undefined> = {
  combine: 'color',
  avatar: 'color',
  color: 'mono',
  mono: undefined,
};

let configuredBase: string | undefined;
let configuredStyle: BrandMarkVariant | undefined;

/** Serve every mark from `base`; `undefined` returns to {@link DEFAULT_BRAND_MARK_BASE}. A per-call `base` wins. */
export function setBrandMarkBase(base: string | undefined): void {
  configuredBase = base;
}

/** The variant a call without its own resolves to; `undefined` returns to `'color'`. */
export function setBrandMarkStyle(variant: BrandMarkVariant | undefined): void {
  configuredStyle = variant;
}

/** The module's current default variant. */
export function getBrandMarkStyle(): BrandMarkVariant {
  return configuredStyle ?? 'color';
}

/** `variant` and the variants after it, in fallback order, keeping only those `name` has a file for. */
export function brandMarkChain(name: BrandMarkName, variant: BrandMarkVariant): BrandMarkVariant[] {
  const has = BRAND_MARKS[name] as Partial<Record<BrandMarkVariant, number>>;
  const chain: BrandMarkVariant[] = [];
  for (let v: BrandMarkVariant | undefined = variant; v; v = NEXT[v]) if (v in has) chain.push(v);
  return chain;
}

/** Width over height of `name`'s `variant` file; 1 where it has none. */
export function brandMarkRatio(name: BrandMarkName, variant: BrandMarkVariant): number {
  return (BRAND_MARKS[name] as Partial<Record<BrandMarkVariant, number>>)[variant] ?? 1;
}

/** The URL of `name`'s `variant` file on `base`, the module base, or the default, in that order. */
export function brandMarkUrlFor(name: BrandMarkName, variant: BrandMarkVariant, base?: string): string {
  const root = (base ?? configuredBase ?? DEFAULT_BRAND_MARK_BASE).replace(/\/+$/, '');
  return `${root}/${variant}/${name}.svg`;
}

/** The URL of `name`'s file for `variant`, or `undefined` where it has none, for callers outside React. */
export function brandMarkUrl(
  name: BrandMarkName,
  options: { variant?: BrandMarkVariant; base?: string } = {},
): string | undefined {
  const variant = options.variant ?? getBrandMarkStyle();
  return variant in BRAND_MARKS[name] ? brandMarkUrlFor(name, variant, options.base) : undefined;
}
```

- [ ] **Step 6: Run the resolver spec**

Run: `pnpm nx test @zeroxsolutions/icons -- src/lib/brand-mark-url.spec.ts`
Expected: PASS (7 tests).

- [ ] **Step 7: Keep `src/lib/` out of the public entries and ship the files**

In `packages/icons/vite.config.mts`:

- add `'src/lib/**'` to the glob's `ignore` array, with the line above the array's first entry reading `// src/lib/ holds what the public entries bundle; a file there is not a subpath.`;
- add `import { cpSync } from 'node:fs';` beside the existing `readFileSync` import (merge into one import);
- add this plugin after `dts(...)` in `plugins`:

```ts
    {
      // The artwork ships as raw files: library mode would inline an imported .svg as a data URL.
      name: 'copy-brand-assets',
      closeBundle() {
        cpSync(resolve(import.meta.dirname, 'assets'), resolve(import.meta.dirname, 'dist/assets'), {
          recursive: true,
          force: true,
        });
      },
    },
```

Run: `pnpm nx build @zeroxsolutions/icons --skip-nx-cache && ls packages/icons/dist/lib 2>&1; ls packages/icons/dist/assets/brands`
Expected: `ls: .../dist/lib: No such file or directory`, then `avatar  color  combine  mono`.

- [ ] **Step 8: Commit**

```bash
MSG=$(mktemp)
cat > "$MSG" <<'EOF'
feat(icons): generate a brand manifest and resolve a mark to its url

Why: <BrandMark> needs to know which variants a mark has before it
requests one, and where its files are served.

Refs: #24

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
P=(packages/icons/tools/build-brand-manifest.mts packages/icons/src/lib/brand-manifest.ts packages/icons/src/lib/brand-manifest.spec.ts packages/icons/src/lib/brand-mark-url.ts packages/icons/src/lib/brand-mark-url.spec.ts packages/icons/package.json packages/icons/vite.config.mts)
git add -- "${P[@]}" && git commit -F "$MSG" -- "${P[@]}"
```

---

### Task 4: `<BrandMark>` and its style provider

**Files:**

- Create: `packages/icons/src/lib/brand-mark-style-provider.tsx`
- Create: `packages/icons/src/brand-mark.tsx`
- Test: `packages/icons/src/brand-mark.spec.tsx`

**Interfaces:**

- Consumes: everything Task 3 produces.
- Produces, exported from `@zeroxsolutions/icons/brand-mark`:
  - `BrandMark(props: BrandMarkProps)` with `BrandMarkProps = { name: BrandMarkName; variant?: BrandMarkVariant; size?: number | string; label?: string; base?: string; shape?: 'circle' | 'square'; className?: string; style?: CSSProperties }`.
  - `BrandMarkStyleProvider({ defaultStyle?, style?, onStyleChange?, children })`, `useBrandMarkStyle(): { style: BrandMarkVariant; setStyle(v: BrandMarkVariant): void }`.
  - Re-exports: `BrandMarkName`, `BrandMarkVariant`, `brandMarkUrl`, `setBrandMarkBase`, `setBrandMarkStyle`, `DEFAULT_BRAND_MARK_BASE`.
  - The root element of every drawing carries `data-slot="brand-mark"` and `data-variant="<the variant drawn>"` (`letter` for the last resort); the mask's hidden probe carries `data-testid="brand-mark-probe"`.

- [ ] **Step 1: Write the failing spec**

`packages/icons/src/brand-mark.spec.tsx` (a mark is found by its role and label; the hidden probe, which has no accessible identity, by its test id):

```tsx
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  BrandMark,
  BrandMarkStyleProvider,
  DEFAULT_BRAND_MARK_BASE,
  setBrandMarkBase,
  setBrandMarkStyle,
} from './brand-mark';

afterEach(() => {
  cleanup();
  setBrandMarkBase(undefined);
  // The provider writes the module default, as FluentEmojiStyleProvider does.
  setBrandMarkStyle(undefined);
  vi.restoreAllMocks();
});

const B = DEFAULT_BRAND_MARK_BASE;
const mark = (name = 'Mark') => screen.getByRole('img', { name });
const failProbe = () => fireEvent.error(screen.getByTestId('brand-mark-probe'));

describe('BrandMark', () => {
  it('draws color as an image of the colour file', () => {
    render(<BrandMark name="facebook" label="Mark" />);
    expect(mark().tagName).toBe('IMG');
    expect(mark().getAttribute('src')).toBe(`${B}/color/facebook.svg`);
    expect(mark().dataset.variant).toBe('color');
  });

  it('draws mono as a currentColor mask of the mono file', () => {
    render(<BrandMark name="openai" variant="mono" label="Mark" />);
    expect(mark().tagName).toBe('SPAN');
    expect(mark().style.maskImage).toBe(`url("${B}/mono/openai.svg")`);
    expect(mark().style.backgroundColor).toBe('currentColor');
  });

  it('draws combine as a mask of the combine file', () => {
    render(<BrandMark name="openai" variant="combine" label="Mark" />);
    expect(mark().style.maskImage).toBe(`url("${B}/combine/openai.svg")`);
  });

  it('draws avatar as an image, round by default and a rounded square on request', () => {
    render(<BrandMark name="claude" variant="avatar" label="Mark" />);
    expect(mark().getAttribute('src')).toBe(`${B}/avatar/claude.svg`);
    expect(mark().style.borderRadius).toBe('50%');
    cleanup();
    render(<BrandMark name="claude" variant="avatar" shape="square" label="Mark" />);
    expect(mark().style.borderRadius).toBe('25%');
  });

  it('sizes the height and keeps the ratio on the width, for a number and for a CSS length', () => {
    render(<BrandMark name="openai" variant="combine" size={20} label="Mark" />);
    expect(mark().style.height).toBe('20px');
    expect(parseFloat(mark().style.width)).toBeGreaterThan(20);
    cleanup();
    render(<BrandMark name="openai" variant="combine" size="1.25rem" label="Mark" />);
    expect(mark().style.height).toBe('1.25rem');
    expect(mark().style.width).toMatch(/^calc\(1\.25rem \* [\d.]+\)$/);
  });

  it('starts at the first variant the mark has, with no request for one it lacks', () => {
    // openai ships no colour file, so a colour request draws its mono file straight away.
    render(<BrandMark name="openai" label="Mark" />);
    expect(mark().dataset.variant).toBe('mono');
  });

  it('falls to the next variant after a failed load', () => {
    render(<BrandMark name="claude" label="Mark" />);
    fireEvent.error(mark());
    expect(mark().dataset.variant).toBe('mono');
  });

  it('falls from a failed mono file to the first letter of the name', () => {
    render(<BrandMark name="openai" variant="mono" label="Mark" />);
    failProbe();
    expect(mark().textContent).toBe('O');
    expect(mark().dataset.variant).toBe('letter');
  });

  it('starts again from the top of the chain when the name changes after a failure', () => {
    const { rerender } = render(<BrandMark name="openai" variant="mono" label="Mark" />);
    failProbe();
    rerender(<BrandMark name="claude" variant="mono" label="Mark" />);
    expect(mark().dataset.variant).toBe('mono');
  });

  it('treats an image already broken when it mounts as failed', () => {
    vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true);
    vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(0);
    render(<BrandMark name="facebook" label="Mark" />);
    expect(mark().dataset.variant).not.toBe('color');
  });

  it('is named by label, and left out of the accessibility tree without it', () => {
    render(<BrandMark name="google" label="Google" />);
    expect(mark('Google')).toBeTruthy();
    cleanup();
    render(<BrandMark name="google" />);
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('takes the ambient style from the provider, and a call of its own over it', () => {
    render(
      <BrandMarkStyleProvider defaultStyle="mono">
        <BrandMark name="claude" label="Ambient" />
        <BrandMark name="claude" variant="color" label="Own" />
      </BrandMarkStyleProvider>,
    );
    expect(mark('Ambient').dataset.variant).toBe('mono');
    expect(mark('Own').dataset.variant).toBe('color');
  });

  it('serves from the module base, and from a per-call base over it', () => {
    setBrandMarkBase('/marks');
    render(<BrandMark name="facebook" base="/other" label="Mark" />);
    expect(mark().getAttribute('src')).toBe('/other/color/facebook.svg');
  });
});
```

Before running, confirm jsdom reports a fresh image as not complete, so the mount check cannot fire in the other cases: `node -e "const {JSDOM}=require('jsdom');const i=new JSDOM('<img src=x.svg>').window.document.querySelector('img');console.log(i.complete)"` prints `false`.

Run: `pnpm nx test @zeroxsolutions/icons -- src/brand-mark.spec.tsx`
Expected: FAIL, `Cannot find module './brand-mark'`.

- [ ] **Step 2: Write the provider**

`packages/icons/src/lib/brand-mark-style-provider.tsx`:

```tsx
import * as React from 'react';

import { setBrandMarkStyle, type BrandMarkVariant } from './brand-mark-url';

interface BrandMarkStyleContextValue {
  /** The variant every `<BrandMark>` without its own resolves to. */
  style: BrandMarkVariant;
  /** Switch the ambient variant; every subscribed `<BrandMark>` re-renders. */
  setStyle: (style: BrandMarkVariant) => void;
}

const BrandMarkStyleContext = React.createContext<BrandMarkStyleContextValue | null>(null);

export interface BrandMarkStyleProviderProps {
  /** Uncontrolled initial variant, `'color'` when omitted. */
  defaultStyle?: BrandMarkVariant;
  /** Controlled variant. */
  style?: BrandMarkVariant;
  /** Told the newly chosen variant; the caller persists it. */
  onStyleChange?: (style: BrandMarkVariant) => void;
  children?: React.ReactNode;
}

/** Makes the brand-mark variant ambient for every `<BrandMark>` below that passes none. */
export function BrandMarkStyleProvider({
  defaultStyle = 'color',
  style: controlled,
  onStyleChange,
  children,
}: BrandMarkStyleProviderProps) {
  const [uncontrolled, setUncontrolled] = React.useState<BrandMarkVariant>(defaultStyle);
  const isControlled = controlled !== undefined;
  const style = isControlled ? controlled : uncontrolled;
  const setStyle = React.useCallback(
    (next: BrandMarkVariant) => {
      if (!isControlled) setUncontrolled(next);
      onStyleChange?.(next);
    },
    [isControlled, onStyleChange],
  );
  // Keeps brandMarkUrl() calls outside React resolving the same variant.
  React.useEffect(() => setBrandMarkStyle(style), [style]);
  const value = React.useMemo(() => ({ style, setStyle }), [style, setStyle]);
  return <BrandMarkStyleContext.Provider value={value}>{children}</BrandMarkStyleContext.Provider>;
}

/** Read and set the ambient variant. Throws outside a {@link BrandMarkStyleProvider}. */
export function useBrandMarkStyle(): BrandMarkStyleContextValue {
  const ctx = React.useContext(BrandMarkStyleContext);
  if (!ctx) throw new Error('useBrandMarkStyle must be used within <BrandMarkStyleProvider>');
  return ctx;
}

/** The ambient variant, or `undefined` with no provider mounted. */
export function useAmbientBrandMarkStyle(): BrandMarkVariant | undefined {
  return React.useContext(BrandMarkStyleContext)?.style;
}
```

- [ ] **Step 3: Write the component**

`packages/icons/src/brand-mark.tsx` (it holds state and effects, so a Next.js server component that renders it needs the client directive):

```tsx
'use client';

import * as React from 'react';
import type { CSSProperties } from 'react';

import type { BrandMarkName } from './lib/brand-manifest';
import {
  brandMarkChain,
  brandMarkRatio,
  brandMarkUrlFor,
  getBrandMarkStyle,
  type BrandMarkVariant,
} from './lib/brand-mark-url';
import { useAmbientBrandMarkStyle } from './lib/brand-mark-style-provider';

export type { BrandMarkName } from './lib/brand-manifest';
export {
  brandMarkUrl,
  DEFAULT_BRAND_MARK_BASE,
  setBrandMarkBase,
  setBrandMarkStyle,
  type BrandMarkVariant,
} from './lib/brand-mark-url';
export {
  BrandMarkStyleProvider,
  useBrandMarkStyle,
  type BrandMarkStyleProviderProps,
} from './lib/brand-mark-style-provider';

export interface BrandMarkProps {
  /** The brand to draw. */
  name: BrandMarkName;
  /** How to draw it; the ambient style from a provider, or `'color'`, when omitted. */
  variant?: BrandMarkVariant;
  /** Height, as pixels or a CSS length; `'1em'` when omitted. The width follows the file's ratio. */
  size?: number | string;
  /** Accessible name. Omit it where text beside the mark already names it. */
  label?: string;
  /** Serve from this base instead of the module's. */
  base?: string;
  /** The avatar's outline; ignored by every other variant. */
  shape?: 'circle' | 'square';
  className?: string;
  style?: CSSProperties;
}

const MASKED: ReadonlySet<BrandMarkVariant> = new Set(['mono', 'combine']);

const length = (size: number | string) => (typeof size === 'number' ? `${size}px` : size);
const widthOf = (size: number | string, ratio: number) =>
  typeof size === 'number' ? `${size * ratio}px` : ratio === 1 ? size : `calc(${size} * ${ratio})`;

/**
 * A brand's mark, drawn from a file on the brand-mark CDN. A variant the mark has no file for, or one
 * whose file fails to load, falls to the next one along `combine`/`avatar` -> `color` -> `mono`, and
 * past `mono` to the first letter of the name, so the mark is never blank.
 */
export function BrandMark({
  name,
  variant,
  size = '1em',
  label,
  base,
  shape = 'circle',
  className,
  style,
}: BrandMarkProps) {
  const ambient = useAmbientBrandMarkStyle();
  const chain = brandMarkChain(name, variant ?? ambient ?? getBrandMarkStyle());
  const key = `${name}|${chain.join(',')}|${base ?? ''}`;
  const [failed, setFailed] = React.useState<{ key: string; count: number }>({ key, count: 0 });
  const count = failed.key === key ? failed.count : 0;
  const drawn = chain[count];
  const fail = React.useCallback(() => setFailed({ key, count: count + 1 }), [key, count]);

  const probe = React.useRef<HTMLImageElement>(null);
  React.useEffect(() => {
    const img = probe.current;
    // An image that failed before hydration fired its error before this handler existed.
    if (img && img.complete && img.naturalWidth === 0) fail();
  }, [drawn, fail]);

  const named = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true };

  if (!drawn) {
    return (
      <span
        data-slot="brand-mark"
        data-variant="letter"
        className={className}
        style={{
          alignItems: 'center',
          borderRadius: '50%',
          display: 'inline-flex',
          flex: 'none',
          fontSize: `calc(${length(size)} * 0.6)`,
          fontWeight: 600,
          height: length(size),
          justifyContent: 'center',
          width: length(size),
          ...style,
        }}
        {...named}
      >
        {name.charAt(0).toUpperCase()}
      </span>
    );
  }

  const src = brandMarkUrlFor(name, drawn, base);
  const box = { flex: 'none', height: length(size), width: widthOf(size, brandMarkRatio(name, drawn)) };

  if (MASKED.has(drawn)) {
    return (
      <span
        data-slot="brand-mark"
        data-variant={drawn}
        className={className}
        style={{
          ...box,
          backgroundColor: 'currentColor',
          display: 'inline-block',
          maskImage: `url("${src}")`,
          maskPosition: 'center',
          maskRepeat: 'no-repeat',
          maskSize: 'contain',
          ...style,
        }}
        {...named}
      >
        {/* A mask has no load or error event; this probe of the same URL reports a failure. */}
        <img ref={probe} data-testid="brand-mark-probe" src={src} alt="" hidden onError={fail} />
      </span>
    );
  }

  return (
    <img
      ref={probe}
      data-slot="brand-mark"
      data-variant={drawn}
      src={src}
      alt={label ?? ''}
      aria-hidden={label ? undefined : true}
      decoding="async"
      draggable={false}
      className={className}
      style={{ ...box, borderRadius: drawn === 'avatar' ? (shape === 'circle' ? '50%' : '25%') : undefined, ...style }}
      onError={fail}
    />
  );
}
```

- [ ] **Step 4: Run the spec, and check the directive survives the build**

Run: `pnpm nx build @zeroxsolutions/icons --skip-nx-cache && head -1 packages/icons/dist/brand-mark.js`
Expected: `'use client';` (or `"use client";`). If the bundler dropped it, add to `rolldownOptions.output` a `banner: (chunk) => (chunk.name === 'brand-mark' ? "'use client';" : '')` and rebuild.

Run: `pnpm nx test @zeroxsolutions/icons -- src/brand-mark.spec.tsx`
Expected: PASS (13 tests). jsdom keeps `mask-image` and `currentColor` as set (checked against the installed jsdom); the browser check is Task 7's.

- [ ] **Step 5: Commit**

```bash
MSG=$(mktemp)
cat > "$MSG" <<'EOF'
feat(icons): draw a brand mark by name with one BrandMark component

Why: callers name a brand by a value and set its style once, and the
artwork loads as a file instead of shipping in their bundle.

Refs: #24

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
P=(packages/icons/src/lib/brand-mark-style-provider.tsx packages/icons/src/brand-mark.tsx packages/icons/src/brand-mark.spec.tsx)
git add -- "${P[@]}" && git commit -F "$MSG" -- "${P[@]}"
```

---

### Task 5: `AiProviderIcon` on `<BrandMark>`

**Files:**

- Modify: `packages/icons/src/ai-provider-mappings.ts`
- Modify: `packages/icons/src/ai-provider-icon.tsx`
- Test: `packages/icons/src/ai-provider-icon.spec.tsx`

**Interfaces:**

- Consumes: `BrandMark`, `BrandMarkName` from Task 4.
- Produces: `AiProviderMapping = { keywords: string[]; mark: BrandMarkName }` (was `Icon`), `aiProviderMappings`, `resolveAiProviderMark(provider: string, extra?: AiProviderMapping[]): BrandMarkName | undefined`. `AiProviderIconProps` gains `label?: string`; every other prop is unchanged.

- [ ] **Step 1: Rewrite the spec against the new drawing**

In `packages/icons/src/ai-provider-icon.spec.tsx`, render each resolved case with `label="Provider"`, and replace `titleOf` and every case that reads a `<title>` or an `<svg>` of a resolved mark:

```tsx
const markOf = () => screen.getByRole('img', { name: 'Provider' });
const urlOf = () => markOf().getAttribute('src') ?? markOf().style.maskImage;
```

- `resolves a known provider key to its brand mark`: `expect(urlOf()).toContain('/mono/openai.svg')` (openai ships no colour file).
- `matches the provider key case-insensitively`: both `urlOf` values contain `/anthropic.svg` and are equal.
- `resolves an aliased key (claude-code -> Claude)`: `urlOf` contains `/claude.svg`.
- `renders the color variant for a mark that ships one`: `markOf().dataset.variant` is `'color'` for `gemini`.
- `renders the mono variant following currentColor`: `markOf().style.backgroundColor` is `'currentColor'`.
- `wraps the mark in a rounded container for the avatar variant`: rename to `draws the avatar file, round`; `dataset.variant` is `'avatar'` and `style.borderRadius` is `'50%'`.
- `applies a numeric size to an icon variant`: `style.height` is `'32px'`.
- The two unknown-key cases keep asserting the fallback `<svg>` with `<title>AI provider</title>`; that placeholder stays an inline SVG.
- The `extra` mapping case passes `{ keywords: ['my-llm'], mark: 'openai' }` and asserts `urlOf` contains `/openai.svg`.

Run: `pnpm nx test @zeroxsolutions/icons -- src/ai-provider-icon.spec.tsx`
Expected: FAIL on every rewritten case (the component still draws inline SVG).

- [ ] **Step 2: Map keys to names**

In `packages/icons/src/ai-provider-mappings.ts`: delete every `import { XMark } from './brands/x'` line and the three `internal/*` type imports; delete the `BrandMark` type; change the mapping type and table:

```ts
import type { BrandMarkName } from './lib/brand-manifest';

/** One entry in the AI provider registry: the keys that resolve to a mark. */
export interface AiProviderMapping {
  /** Provider keys (matched case-insensitively, exact) that resolve to `mark`. */
  keywords: string[];
  /** The brand drawn for any of `keywords`. */
  mark: BrandMarkName;
}
```

and rewrite each table row from `{ keywords: [...], Icon: XMark }` to `{ keywords: [...], mark: '<the file basename XMark was imported from>' }`, e.g. `{ keywords: ['claude', 'claude-code'], mark: 'claude' }`, `{ keywords: ['xai', 'grok'], mark: 'grok' }`, `{ keywords: ['newapi'], mark: 'new-api' }`, `{ keywords: ['stability'], mark: 'stability-ai' }`, `{ keywords: ['workersai'], mark: 'workers-ai' }`, `{ keywords: ['xiaomi'], mark: 'xiaomi-mimo' }`. `resolveAiProviderMark` returns `match?.mark` instead of `match?.Icon`; its return type becomes `BrandMarkName | undefined`. A misspelt name now fails typecheck.

- [ ] **Step 3: Draw through `<BrandMark>`**

In `packages/icons/src/ai-provider-icon.tsx`: remove the `makeAvatar` and `IconProps` imports and the whole avatar/combine/Icon branch; keep `DefaultMark` (type its props as `{ size?: number; className?: string; style?: CSSProperties }`); render:

```tsx
const mark = resolveAiProviderMark(provider, extra);
if (!mark) return <DefaultMark size={size} className={className} style={style} />;
return (
  <BrandMark name={mark} variant={type} size={size} shape={shape} label={label} className={className} style={style} />
);
```

with `import { BrandMark } from './brand-mark';`, and add to `AiProviderIconProps`:

```tsx
  /** Accessible name, passed to `<BrandMark>`; omit it where text beside the icon names the provider. */
  label?: string;
```

Update the docblock: it "renders the provider's mark through `<BrandMark>`, which falls back along its own chain; an unknown key draws a neutral placeholder".

- [ ] **Step 4: Run the package's tests**

Run: `pnpm nx test @zeroxsolutions/icons`
Expected: PASS for `ai-provider-icon.spec.tsx`, `brand-mark.spec.tsx` and the two `lib` specs; `brands/brand-marks.spec.tsx` still passes too, since the components are not deleted until Task 6.

- [ ] **Step 5: Commit**

```bash
MSG=$(mktemp)
cat > "$MSG" <<'EOF'
refactor(icons): draw AiProviderIcon through BrandMark

Why: the provider icon resolved and degraded marks itself; BrandMark
now owns both, so the icon maps a key to a name and nothing else.

Refs: #24

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
P=(packages/icons/src/ai-provider-mappings.ts packages/icons/src/ai-provider-icon.tsx packages/icons/src/ai-provider-icon.spec.tsx)
git add -- "${P[@]}" && git commit -F "$MSG" -- "${P[@]}"
```

---

### Task 6: Remove the components, upload the files

**Files:**

- Delete: `packages/icons/src/brands/` (201 marks, `internal/`, `brand-marks.spec.tsx`)
- Delete: `packages/icons/tools/export-brand-svgs.mts`
- Create: `packages/icons/tools/rclone-sync.sh`
- Modify: `packages/icons/package.json` (`nx.targets.rclone:sync`)
- Modify: `packages/icons/README.md`
- Modify: `packages/icons/vite.config.mts` (comment)

**Interfaces:**

- Consumes: nothing new.
- Produces: the package's final public surface: `brand-mark`, `ai-provider-icon`, `ai-provider-mappings`, `material/*`.

- [ ] **Step 1: Find every importer of `brands/` before deleting**

Run: `grep -rln "brands/" packages apps --include='*.ts' --include='*.tsx' --include='*.mdx' | grep -v node_modules | grep -v "packages/icons/src/brands/"`
Expected: only `apps/registry-ui/registry/bases/base-ui/examples/icons-demo.tsx` and `apps/registry-ui/content/docs/packages/icons.mdx`, which Task 7 rewrites. Any other file is a consumer this plan missed: stop and add it to Task 7.

- [ ] **Step 2: Delete**

```bash
git rm -rq packages/icons/src/brands packages/icons/tools/export-brand-svgs.mts
```

- [ ] **Step 3: Add the upload script**

`packages/icons/tools/rclone-sync.sh`: copy `packages/fluent-emoji/tools/rclone-sync.sh` as Task 1 left it, then change `FLUENT_EMOJI_BUCKET` to `ICONS_BUCKET` throughout, and the comment's "keys are `<style>/<codepoint>.<ext>`" sentence to "Keys are `brands/<variant>/<name>.svg` at the bucket root". `chmod +x` it. Add the target in `package.json`:

```json
"rclone:sync": {
  "executor": "nx:run-commands",
  "options": { "cwd": "{projectRoot}", "command": "./tools/rclone-sync.sh" }
}
```

Run: `cd packages/icons && env -i PATH="$PATH" ./tools/rclone-sync.sh; echo $?`
Expected: `rclone.config.missing: RCLONE_S3_ENDPOINT RCLONE_S3_ACCESS_KEY_ID RCLONE_S3_SECRET_ACCESS_KEY ICONS_BUCKET` and `1` (the guard fires before rclone runs).

- [ ] **Step 4: Bring the entry-glob comment in `vite.config.mts` up to date**

Its comment still names `brands/deepgram` and `brands/react`. Replace the example paths with `material/react` and `brand-mark`, and the sentence about `brands/react` and `material/react` coexisting with: "Path keys are inherently unique, so a category folder is a real subpath, not a discarded label." Add `packages/icons/vite.config.mts` to this task's `git add`.

- [ ] **Step 5: Rewrite the README's brand section**

In `packages/icons/README.md`, replace the opening example's brand lines, the "Component pattern" section and the `### brands/` section with: the `<BrandMark>` example from the spec's "What changes for a caller"; a variants table (`color`, `mono`, `avatar`, `combine`, and how each draws); the fallback chain; "Serving the artwork" (the CDN default, `setBrandMarkBase` for self-hosting from `dist/assets/brands`, the `v2/` rule for re-sourced artwork); "Adding a brand" (add its files under `assets/brands/<variant>/`, run `nx brand-manifest @zeroxsolutions/icons`, commit both). Keep the sources table and the attribution section; keep `material/` as it is. Every example in it must use only names exported by `src/brand-mark.tsx`.

- [ ] **Step 6: Run the whole package gate**

Run: `pnpm nx run-many -t lint typecheck build test -p @zeroxsolutions/icons --skip-nx-cache 2>&1 | tail -3`
Expected: `Successfully ran targets lint, typecheck, build, test for project @zeroxsolutions/icons`. `ls packages/icons/dist` shows `ai-provider-icon.js ai-provider-mappings.js assets brand-mark.js material` and no `brands`.

- [ ] **Step 7: Commit (breaking)**

```bash
MSG=$(mktemp)
cat > "$MSG" <<'EOF'
refactor(icons)!: serve brand marks as files behind one BrandMark

Why: the files under assets/brands/ are now the artwork's only source;
the components they were rendered from, and the script that rendered
them, go.

BREAKING CHANGE: every @zeroxsolutions/icons/brands/<name> subpath and
its <Name>Mark component are removed; draw a brand with
<BrandMark name="<name>" /> from @zeroxsolutions/icons/brand-mark.
AiProviderMapping takes `mark: BrandMarkName` in place of `Icon`.

Refs: #24

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
git add -- packages/icons/tools/rclone-sync.sh packages/icons/package.json packages/icons/README.md packages/icons/vite.config.mts
git diff --cached --name-status   # only the deletions under src/brands/ and tools/, and these four files
git commit -F "$MSG"
```

---

### Task 7: The registry on `<BrandMark>`

**Files:**

- Modify: `apps/registry-ui/registry/bases/base-ui/examples/icons-demo.tsx`
- Modify: `apps/registry-ui/content/docs/packages/icons.mdx`
- Create: `apps/registry-ui-e2e/src/icons.spec.ts`

**Interfaces:**

- Consumes: `BrandMark` from `@zeroxsolutions/icons/brand-mark`; a `label` makes it `role="img"` with that name.

- [ ] **Step 1: Write the failing e2e case**

`apps/registry-ui-e2e/src/icons.spec.ts`:

```ts
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';

import { expect, test } from '@playwright/test';

// The artwork the page asks the CDN for is served from the package itself, so this suite neither
// reaches a server it does not control nor waits on the CDN having been uploaded.
const assets = resolve(
  dirname(createRequire(import.meta.url).resolve('@zeroxsolutions/icons/package.json')),
  'dist/assets/brands',
);

test.beforeEach(async ({ page }) => {
  await page.route('https://icons.zeroxsolutions.com/brands/**', (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/brands\//, '');
    route.fulfill({ contentType: 'image/svg+xml', body: readFileSync(resolve(assets, path)) });
  });
});

test('the icons page draws a mono brand mark as a mask in the text colour', async ({ page }) => {
  await page.goto('/docs/packages/icons');

  const mono = page.getByRole('img', { name: 'OpenAI' }).first();
  await expect(mono).toBeVisible();
  await expect(mono).toHaveCSS('mask-image', /\/brands\/mono\/openai\.svg/);
  const box = await mono.boundingBox();
  expect(box?.width).toBeGreaterThan(0);
  expect(box?.height).toBeGreaterThan(0);
});
```

If `@zeroxsolutions/icons` is not a dependency of `registry-ui-e2e`, add it as `"@zeroxsolutions/icons": "workspace:*"` under `devDependencies` and run `pnpm install`.

Run: `pnpm nx e2e @zeroxsolutions/registry-ui-e2e -- src/icons.spec.ts`
Expected: FAIL, no `img` named `OpenAI` (today's demo draws it decorative, as an inline `<svg>`).

- [ ] **Step 2: Rewrite the demo**

`apps/registry-ui/registry/bases/base-ui/examples/icons-demo.tsx`: replace the three brand imports with `import { BrandMark } from '@zeroxsolutions/icons/brand-mark';` and the three brand items with:

| `ItemMedia`                                                           | `ItemTitle`                  | `ItemDescription`                                                       |
| --------------------------------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------- |
| `<BrandMark name="openai" variant="mono" size={24} label="OpenAI" />` | `OpenAI, in the text colour` | `'<BrandMark name="openai" variant="mono" size={24} label="OpenAI" />'` |
| `<BrandMark name="gemini" size={24} />`                               | `Gemini, in its own colours` | `'<BrandMark name="gemini" size={24} />'`                               |
| `<BrandMark name="claude" variant="avatar" size={24} />`              | `Claude, as an avatar`       | `'<BrandMark name="claude" variant="avatar" size={24} />'`              |

Keep the TypeScript item. The docblock becomes "A brand mark in three of its variants and a file-type icon, each beside the element that draws it."

- [ ] **Step 3: Rewrite the docs page**

In `apps/registry-ui/content/docs/packages/icons.mdx`, replace the import lines and examples that use `OpenaiMark` / `GeminiMark` and the `### brands` section with the same content as the README's brand section from Task 6 Step 4, in this page's own register; keep `<ComponentPreview name="icons-demo" />` and the `material` section.

- [ ] **Step 4: Run the e2e case and the registry's gate**

Run: `pnpm nx e2e @zeroxsolutions/registry-ui-e2e -- src/icons.spec.ts`
Expected: PASS.

Run: `pnpm nx run-many -t lint typecheck build test -p @zeroxsolutions/registry-ui --skip-nx-cache 2>&1 | tail -3`
Expected: `Successfully ran targets lint, typecheck, build, test for project @zeroxsolutions/registry-ui`.

Run: `pnpm nx e2e @zeroxsolutions/registry-ui-e2e --skip-nx-cache 2>&1 | tail -3`
Expected: every spec passes; the spec asks the rest of the suite to stay green.

- [ ] **Step 5: Commit**

```bash
MSG=$(mktemp)
cat > "$MSG" <<'EOF'
docs(registry-ui): show brand marks through BrandMark

Why: the per-brand components the icons demo and docs page used are
gone; the page now draws BrandMark, and a browser case checks the mask.

Refs: #24

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
P=(apps/registry-ui/registry/bases/base-ui/examples/icons-demo.tsx apps/registry-ui/content/docs/packages/icons.mdx apps/registry-ui-e2e/src/icons.spec.ts)
git add -- "${P[@]}" && git commit -F "$MSG" -- "${P[@]}"
```

(Add `apps/registry-ui-e2e/package.json` and `pnpm-lock.yaml` to `P` if Step 1 changed them.)

---

### Task 8: Ship, in order

No code. Each step waits for the one before it.

- [ ] **Step 1: The human provisions the bucket and grants the key** (spec, "What a human does", steps 1 and 2). Confirm with: `curl -sI https://icons.zeroxsolutions.com/ | head -1` answering any HTTP status (the domain resolves).
- [ ] **Step 2: Push the branch; the pre-push hook runs the workspace sweep.** Open the PR with title `refactor(icons)!: serve brand marks as files behind one BrandMark` and `Closes #24` in its description. Read the CI run for the branch; it must name `@zeroxsolutions/icons`, `fluent-emoji` and `@zeroxsolutions/registry-ui` and be green.
- [ ] **Step 3: Merge, then promote:** `git push origin master:production`. Read the `cd` run's `rclone-sync` job log for both packages' `copy` lines.
- [ ] **Step 4: Check both hosts:**

```bash
curl -sI https://icons.zeroxsolutions.com/brands/color/facebook.svg | head -1    # HTTP/2 200
curl -sI https://fluent-emoji.zeroxsolutions.com/3d/1f92f.webp | head -1        # HTTP/2 200
```

- [ ] **Step 5: The human removes `S3_BUCKET`** (spec, step 3).
- [ ] **Step 6: Release:** `pnpm nx release version --projects=@zeroxsolutions/icons --git-commit=false --git-tag=false`, then `pnpm nx release changelog <the version it printed> --projects=@zeroxsolutions/icons`, then `pnpm nx release publish --projects=@zeroxsolutions/icons`; push `master` and the new tag. Report the version the run printed (expected 0.2.0).
