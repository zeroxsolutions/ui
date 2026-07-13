## Context

`@zeroxsolutions/icons` exposes category-scoped subpaths (`./*` → `dist/*`), with
Vite keying one build entry per `src/**/*.tsx` file — so **new mark files are
picked up with no build-config change**, and `brands/react` / `material/react`
coexist. The compound-component pattern already ships (`material/` uses `.Light`).

The `brands/` category holds 5 single-variant marks today (`DeepgramMark` mono,
`LeonardoMark` full-color, `GithubMark` `className`/`currentColor`, etc.).
`@lobehub/icons` is referenced in JSDoc as "the standard set" but is **not
installed**; nothing consumes it. The brand smoke test hand-lists the 5 marks.

This change grows `brands/` to a self-sufficient AI + dev/cloud/infra set and
adopts the **full `@lobehub/icons` variant surface** per brand. The lobehub API,
verified against `/lobehub/lobe-icons`, is a compound component per brand:

| Variant | Form | Key props (beyond `size`) |
| --- | --- | --- |
| base | default icon (mono, inherits color) | — |
| `.Color` | full brand-color icon | — |
| `.Mono` | monochrome, `currentColor` | — |
| `.Avatar` | icon on a filled background | `background`, `color`, `iconMultiple` (0.6) |
| `.Text` | brand wordmark | `text` (brand name), `textColor` |
| `.Combine` | icon + wordmark | `text`, `textColor` |

lobehub is **uneven** — a brand exposes only the variants whose artwork/composition
exist (e.g. `Dbrx` has base+color; `Automatic` has base+color+text+combine+avatar).

## Goals / Non-Goals

**Goals:**

- A broad, self-sufficient `brands/` set (AI ecosystem + dev/cloud/infra).
- The full lobehub variant surface per brand, present **where each variant exists**.
- Zero new runtime dependency; icon artwork ships as committed `.tsx`.
- `.Avatar` / `.Combine` as generic composition components reused across brands.
- A glob-driven brand smoke test needing no edit per added mark.
- Existing marks and subpaths keep rendering (additive base component).

**Non-Goals:**

- Touching the `material/` set, the Vite config, or the `exports` map.
- lobehub's brand-specific `.Brand` / `.BrandColor` extras — standardize on the
  five canonical variants (`.Color`/`.Mono`/`.Avatar`/`.Text`/`.Combine`).
- A provider→mark registry or dynamic `<Icon name>` component.
- Committed codegen (the vendoring transform is throwaway).

## Decisions

### D1 — Self-sufficient vendoring; no runtime icon-library dependency

Every mark is a committed `.tsx` with **inline** SVG — no import from
`@lobehub/icons`, `simple-icons`, or any icon package at runtime (per
`lib-public-exports-and-semver`; deliberate, tree-shakeable surface). Source tiers,
in priority order:

1. **`@lobehub/icons` source artwork** (MIT) — the canonical AI-brand icons and any
   available `Color`/`Text` variants; the richest source for the AI subset.
2. **Simple Icons** (CC0) — monochrome glyphs; the `.Mono` form and most dev/infra
   marks that lobehub doesn't cover.
3. **Vendor-supplied / seeklogo SVGs** — gaps neither of the above covers.

Each mark's JSDoc + the README record the source tier per mark.

### D2 — Variant color model

- **base / `.Mono`** → `<svg fill="currentColor" aria-hidden>`, inherits text color.
- **`.Color`** → `<svg fill="none">` with per-path fills; intrinsic colors, not
  recolored by surrounding `color`. Internal ids namespaced per D4.
- **base default** renders the `.Mono` artwork where a mono exists, else `.Color` —
  matching lobehub (the base export is the color-inheriting default). This keeps the
  existing 5 marks' bare-component usage working (additive).

### D3 — Per-brand compound template; variants where they exist

Each brand is one file `src/brands/<name>.tsx` exporting `<Name>Mark` as a base
component with variants attached as static sub-components — **only those that apply**
(absent ⇒ type error, per the existing compound-API spec requirement):

```tsx
type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;
type MarkVariants = {
  Color?: FC<IconProps>; Mono?: FC<IconProps>;
  Avatar?: FC<AvatarProps>; Text?: FC<TextProps>; Combine?: FC<CombineProps>;
};
const OpenaiMark: FC<IconProps> & MarkVariants = (p) => (/* default svg */);
OpenaiMark.Color = (p) => (/* full-color svg */);
OpenaiMark.Mono  = (p) => (/* currentColor svg */);
OpenaiMark.Avatar = makeAvatar(OpenaiMark.Mono ?? OpenaiMark, OPENAI_COLOR);
OpenaiMark.Text   = makeText('OpenAI');            // only if a wordmark exists
OpenaiMark.Combine = makeCombine(OpenaiMark, 'OpenAI');
```

- **Icon-form defaults** `size='1em'` (package convention). **`.Avatar`/`.Text`/
  `.Combine`** follow lobehub defaults: numeric `size` (24), `text` = brand name,
  `textColor` defaults to `currentColor` (theme-friendly, not lobehub's `#000`).
- **`GithubMark` stays as-is** (its `className`/`currentColor` API) — the one
  documented exception; normalizing it would be breaking.

### D4 — Generic Avatar/Combine composition + per-mark brand color

`.Avatar` and `.Combine` are **not** vendored artwork — they are shared composition
helpers (`makeAvatar`, `makeCombine`) in one internal module under `src/brands/`,
composing raw layout elements (a `div`/flex wrapper — a sanctioned raw-element use
per `ui-primitive-fidelity`) around the brand's icon and wordmark. `makeAvatar`
fills the background with the brand's **primary color**, so each mark file declares
a `<NAME>_COLOR` constant (from the source artwork). Trade-off to confirm at
implementation: the shared module becomes its own build entry/subpath
(`brands/<helper>`) since Vite globs `src/**/*.tsx` — acceptable as an undocumented
internal, and it keeps 200 files from inlining the same wrapper.

### D5 — Per-mark internal-id isolation

Any `.Color` (or base) with internal ids (gradients, clips, masks) namespaces every
id and `#id`/`xlink:href` with a mark-unique prefix (`<name>-…`), baked into the
committed `.tsx` — the technique `LeonardoMark` uses (`leo-*`). The "no two marks
share an internal svg id" smoke test enforces it.

### D6 — Flat `brands/` namespace; naming normalization

`brands/` stays **flat** (like `material/`). Naming per `naming-files-and-symbols`:
kebab file (`_`/`.`/space → `-`); symbol `PascalCase(name) + Mark`; leading digit
spelled out. Collision watch-list resolved at vendoring to the searched product
name: `x`/`grok` (xAI), `meta`/`llama`, `gemini`/`google`, `claude`/`anthropic`.

### D7 — Glob-driven brand smoke test (replaces the hand array)

`brand-marks.spec.tsx` switches to `import.meta.glob('./*.tsx', { eager: true })`
(mirroring `material.spec.tsx`), excluding the internal composition helper module:

- Every mark base renders a **non-empty** `<svg>` with a `viewBox`; `size` maps to
  width/height on an icon-form variant.
- For each present variant: `.Color` renders a non-empty svg; `.Mono` paints
  `currentColor`; `.Avatar` renders its background wrapper; `.Text`/`.Combine`
  render the wordmark text.
- **No two marks share an internal svg id.**
- `GithubMark` keeps its dedicated `className`/`currentColor` assertion.
- **Count floor** (`toBeGreaterThanOrEqual`), not a hard total — the set grows.

### D8 — Throwaway vendoring transform; parallelized judgment

Vendoring runs as a **throwaway** scratchpad pipeline (only `.tsx` committed,
consistent with the material conversion): resolve the roster → pull each variant's
SVG from its source tier → svgo + `prefixIds` → classify variants present → apply
the D3 template + brand color → write into `src/brands/`. Subagents parallelize the
**judgment** (source/variant verification, color-tier + wordmark availability,
name/collision resolution, render spot-checks, README rows, catalog). Runs through
`nx` (`run-through-nx`, `green-before-commit`).

### D9 — Docs + catalog

README `brands/` table grows (grouped by domain), noting per-mark source and which
variants exist; the Storybook `brand-marks.stories.tsx` catalog renders the full
set via glob, showing each brand's variant row. Trademark disclaimer retained.

## Risks / Trade-offs

- **Scope / effort.** Full lobehub × ~200 brands ≈ re-vendoring lobehub's AI subset
  plus generating variants for dev/infra — ~3–5× the single-mark plan. Mitigation:
  variants-where-they-exist (no forced wordmarks), parallel vendoring, generic
  Avatar/Combine (built once).
- **Uneven variant coverage.** AI brands get the full five; dev/infra brands
  typically get base/`.Color`/`.Mono`/`.Avatar` only (no wordmark). This is faithful
  to lobehub and encoded as the "absent variant not exposed" rule — a feature, not a
  gap, but callers must not assume `.Text` exists.
- **Composition machinery.** `.Avatar`/`.Combine` are real components (background
  fill, `iconMultiple`, text layout, `textColor`) built with raw layout elements —
  no external UI dep; small and shared.
- **Wrong variant classification.** A color logo shipped as mono (or vice-versa)
  renders wrong; the structural smoke test won't catch appearance. Mitigation: D2
  rule + retained visual spot-check.
- **Trademark exposure.** Third-party marks; identification-only disclaimer kept;
  vendored from MIT/CC0/vendor artwork.
- **Internal-id bleed** in `.Color` variants — per-mark id prefix, enforced by the
  no-shared-id test.

## State Model

Not applicable — brand marks are stateless presentational components with no
runtime workflow or states.

## Migration Plan

Purely **additive**. Existing marks and their `@zeroxsolutions/icons/brands/*`
subpaths keep rendering (the base component is unchanged; variants are added). New
subpaths are added. Release as a **minor** SemVer bump via Nx Release
(`lib-public-exports-and-semver`) — nothing existing breaks. Each new mark/variant
is opt-in per import. Rollback is deleting the added files.

## Open Questions

- **Shared-helper subpath (D4).** Confirm the generic `makeAvatar`/`makeCombine`
  module as an internal build entry vs inlining — decide at implementation against
  the Vite output.
- **The exact roster + per-brand variant matrix.** Which brands, and which of the
  five variants each ships, is finalized during vendoring and recorded in
  `tasks.md`; the spec fixes the contract (variant surface + color model +
  attribution), not the literal per-brand matrix.
- **Floor count for the smoke test.** Set once the roster/variant matrix is fixed.
- **`textColor` default.** `currentColor` (theme-friendly) vs lobehub's `#000` —
  leaning `currentColor`; confirm against catalog rendering.
