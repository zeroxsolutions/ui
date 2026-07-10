## Context

`@zeroxsolutions/icons` is a publishable React icon library (see
`lib-public-exports-and-semver`). Today it ships a few hand-authored brand marks
under `src/github-mark.tsx` + `src/brand-marks/*`, built by a **flat** Vite
library config: `vite.config.mts` globs `src/**/*.{ts,tsx}`, keys each entry by
**basename**, throws on any basename collision, and a `dts` `beforeWriteFile`
hook flattens declarations to `dist/<basename>.d.ts` while `flattenSpecifiers`
rewrites relative imports to `./<basename>`. The public surface is the `"./*"`
subpath map in `package.json`, so each module is imported as
`@zeroxsolutions/icons/<basename>`.

We are adding the Material Icon Theme file-icon set — a large, multi-color,
third-party set — which the flat model cannot host coherently (folder is
discarded; real names like `react`/`vue`/`docker` would claim the global flat
namespace they'd want as brand marks). Source facts, measured from a sparse clone
of the repo's `icons/` folder: 903 SVGs total → **633 file icons** (270
`folder-*` excluded); **632/633 are multi-color**; viewBoxes are mixed
(16×16 / 24×24 / 32×32 / larger); **46** file icons have a `*_light` pair; exactly
**one** name starts with a digit (`3d`); **14** icons carry internal SVG ids
(gradients/clips) that can cross-collide when rendered together.

## Goals / Non-Goals

**Goals:**

- Turn category into a **real import subpath** (`material/*`, `brands/*`), not a
  cosmetic folder, so cross-category names coexist.
- One **compound component** API across the package (base + attached
  PascalCase sub-components for variants), replacing a per-icon `variant` prop.
- Add the Material file icons as committed `.tsx`, full-color, `.Light`-aware,
  with per-icon id isolation and MIT attribution.

**Non-Goals:**

- No committed codegen (no SVGR/svgo dependency, no `icons:codegen` target).
- No folder icons; no brand style sub-components yet; no Material re-sync tooling.

## Decisions

### D1 — Path-keyed Vite entries (category in the subpath)

Change the entry map key from `basename(file)` to the **`src`-relative path minus
extension**: `entries['material/typescript'] = …`, `entries['brands/deepgram'] = …`.
With `rolldownOptions.output.entryFileNames: '[name].js'`, Rollup/Rolldown
preserves the `/` in `[name]`, emitting `dist/material/typescript.js` and
`dist/brands/deepgram.js` (grounded against Vite library-mode docs: object-keyed
`lib.entry` → `[name]`). Drop the basename-collision guard; path keys are
inherently unique. This is the single change that makes categories real and lets
`brands/react` and `material/react` coexist.

### D2 — Declaration output mirrors `src/`; remove flattening

Delete the `dts` `beforeWriteFile` flattening and the `flattenSpecifiers`
rewriter. With `entryRoot: 'src'`, `vite-plugin-dts` emits
`dist/material/typescript.d.ts` mirroring the source tree. Icon modules are
self-contained (no cross-icon relative imports), so specifier rewriting is
unnecessary once output is nested.

### D3 — `exports` map unchanged (verify)

`"./*": { "types": "./dist/*.d.ts", "import": "./dist/*.js" }` — Node subpath
patterns match a single `*` across `/`, so `@zeroxsolutions/icons/material/typescript`
resolves to `./dist/material/typescript.js` with no `package.json` change.
**Verify empirically at implementation** (a smoke import per category).

### D4 — Compound component pattern (base + sub-components)

Each icon is a function component with variant renderings attached as static
PascalCase properties, typed as an intersection:

```ts
type IconProps = { size?: string | number } & ComponentProps<'svg'>;
const BunIcon: FC<IconProps> & { Light: FC<IconProps> } = (p) => (/* default svg */);
BunIcon.Light = (p) => (/* light svg */);   // present ONLY for the 46 *_light icons
```

- Material variant = **theme** (`.Light`); brands variant = **style**
  (`.Color`/`.Mono`, reserved). Same mechanism, different semantics — documented.
- Full-color: `<svg width={size} height={size} viewBox="<intrinsic>">`, colors
  intrinsic, `size` default `'1em'` (matches the existing lobehub-style marks).
  No `currentColor`. Each component keeps its **own** viewBox (D-context: mixed).

### D5 — Per-icon id isolation

The 14 icons with internal ids get every id (and every `#id` / `xlink:href`
reference) namespaced with an icon-unique prefix (e.g. `mi-<name>-…`) so multiple
icons/instances on one page never cross-reference (the same hazard the existing
`LeonardoMark` solved with `leo-*`). Applied by the one-time conversion, baked
into the committed `.tsx`.

### D6 — Naming & filename normalization

- **Symbol**: PascalCase(sourceName) + `Icon` (file icons) / `Mark` (brands);
  leading digit spelled out → `3d` → `ThreeDIcon`. Suffix avoids shadowing real
  libraries (`react` → `ReactIcon`). (See `naming-files-and-symbols`.)
- **Filename/subpath**: kebab-case, underscores normalized to `-`
  (`json_schema` → `material/json-schema`); the `*_light` suffix is **not** a
  file — it is merged into the base icon's `.Light`.

### D7 — Brands relocation

Move `src/github-mark.tsx` + `src/brand-marks/*` → `src/brands/*` (keep each
mark's current API). Update the 5 Storybook imports. Subpaths change
(`/deepgram` → `/brands/deepgram`) — a breaking change, acceptable at v0.0.1
where only Storybook consumes the package.

### D8 — One-time generation, nothing committed but `.tsx`

The conversion is a **throwaway** pipeline (lives in scratchpad, not the repo):
sparse-clone `icons/` → svgo optimize + `prefixIds` → apply a single compound
`.tsx` template (base, plus `.Light` where a `*_light` sibling exists) → write
into `src/material/`. Sonnet subagents parallelize the **judgment** layer —
name/collision resolution, spot-checking rendered output, the catalog story and
attribution — not per-file pixel conversion. The repo gains only committed
`.tsx`, consistent with the package today (see `lib-public-exports-and-semver`).

## Risks / Trade-offs

- **Breaking brand subpaths** (D7): mitigated by v0.0.1 + Storybook-only usage;
  the import updates ship in the same change.
- **Conversion correctness** at 587-file scale: a deterministic transform +
  subagent spot-checks + a smoke test asserting every `material/*` module
  default-exports a renderable component. A wrong hand-conversion is the main
  failure mode; the automated transform is the guard.
- **`.Light` ride-along**: attaching `.Light` bundles the light SVG with its base
  even when unused — 46 small icons, negligible.
- **Public-surface size**: hundreds of new subpaths. The per-file entry model
  keeps consumer bundles tree-shaken (a consumer pulls only what it imports);
  repo/build-time weight grows but is bounded.
- **Maintenance**: no codegen → future Material updates are manual (accepted:
  "yêu cầu sau").
- **Build-config regression risk**: D1/D2 touch the shared build. Guard by
  keeping brand marks building green through the refactor before adding material.

## State Model

An icon has variant states surfaced as sub-components, not runtime flags:

```
BunIcon        ──renders──▶ default (dark-safe) artwork
BunIcon.Light  ──renders──▶ light-background artwork      (only for the 46 pairs)
TypescriptIcon ──renders──▶ default only (no .Light)
```

Brands reserve `.Color` / `.Mono` sub-components in the same shape (future).

## Migration Plan

1. Refactor `vite.config.mts` (D1/D2), move brands to `src/brands/` (D7), update
   Storybook imports — keep `nx lint build test @zeroxsolutions/icons` + Storybook
   green with only brand marks present (proves the build change in isolation).
2. Run the throwaway conversion (D8) into `src/material/`; add the catalog story
   and README attribution.
3. Re-run green + smoke import per category (D3) + a render spot-check.

## Open Questions

- Exact digit-spelling for `3d` — `ThreeDIcon` (proposed) vs `ThreeDimensionIcon`;
  cosmetic, one icon.
- Whether any non-`_light` underscore one-offs (`go_gopher`, `nodejs_alt`,
  `json_schema`, …) should be renamed further or kept as kebab of the Material
  name (default: keep kebab-of-source).
