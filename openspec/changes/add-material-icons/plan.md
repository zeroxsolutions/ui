## Scope

Execution plan for the whole `add-material-icons` change: refactor
`@zeroxsolutions/icons` to category subpaths + the compound component API, then
import the Material Icon Theme file-icon set. Split into two execution blocks —
**A: build refactor + brands relocation** (proven green in isolation) and
**B: Material set generation + docs** — with a shared validation block.

## Covers

- Block A: tasks `1.1`–`1.7`; VF: nested-`dist` resolution, brands green after relocation.
- Block B: tasks `2.1`–`2.4`, `3.1`–`3.3`, `4.1`–`4.2`; VF: conversion correctness, id isolation, `.Light` presence.
- Validation: tasks `5.1`–`5.6`; VF: full green, category resolution, render spot-checks.

## Plan Type

full

## Execution Strategy

tdd-preferred

## Ordered Steps

1. Branch `feat/material-icons`; add/adjust a smoke test asserting a brand mark resolves via `@zeroxsolutions/icons/brands/deepgram` — **expected to fail** (module still flat). (A: 1.1)
2. Relocate marks to `src/brands/*`; rewrite `vite.config.mts` entry keying to `src`-relative path and remove the basename guard (D1); drop the dts flattening (D2). (A: 1.2–1.4)
3. Update the 5 Storybook brand imports to `brands/*`; build and prove nested output + `nx lint build test @zeroxsolutions/icons` green **with brands only** (D3 verified). (A: 1.5–1.7)
4. Stand up the throwaway conversion pipeline in scratchpad (svgo `prefixIds` + compound `.tsx` template + naming rule D5/D6); dry-run on ~10 representative icons. (B: 2.1–2.4)
5. Generate `src/material/*.tsx` (587 base + 46 `.Light`); fan out sonnet subagents for render spot-checks / collision + malformed-SVG flags; reconcile findings. (B: 3.1–3.3)
6. Add the `Icons/Material` catalog story and the README category + MIT attribution. (B: 4.1–4.2)
7. Add the retained smoke test over `material/*` + `brands/*`; run full validation. (5.1–5.6)

## Validation Per Step

1. New smoke test fails against the pre-refactor flat build (red confirms the seam).
2. `dist/brands/deepgram.js` + `.d.ts` emitted nested; type-check passes.
3. `nx lint build test @zeroxsolutions/icons` green; Storybook brand story renders; category import resolves (D3).
4. Emitted sample `.tsx` compile and render; ids are prefixed; `.Light` attaches only for the pair; `3d` → `ThreeDIcon`.
5. Every `material/*` module default-exports a component; subagent spot-checks return no unresolved malformed icon.
6. Storybook `Icons/Material` renders a labelled grid incl. a `.Light` toggle; README shows attribution.
7. `nx lint build test` green; smoke + render-together + per-category import checks pass (5.1–5.4).

## Files / Owners

- `packages/icons/vite.config.mts` — build refactor (D1/D2).
- `packages/icons/src/brands/*` — relocated marks.
- `packages/icons/src/material/*` — generated Material icons.
- `packages/icons/src/*.spec.tsx` — retained smoke test.
- `packages/icons/README.md` — categories + MIT attribution.
- `apps/storybook/src/icons/brand-marks.stories.tsx` — updated imports.
- `apps/storybook/src/icons/material.stories.tsx` — new catalog story.
- `packages/icons/package.json` — `exports` only if `"./*"` fails (D3).

## Completion Checkpoint

Both categories resolve as nested subpaths; the Material set (587 base + 46
`.Light`) renders full-color at intrinsic viewBox; brands relocated with Storybook
updated; `nx lint build test @zeroxsolutions/icons` green; README carries the MIT
attribution.

## Completion Verification

Verification Mode is retained-recommended → retain the smoke test
(`packages/icons/src/*.spec.tsx`) covering: (a) one import per category resolves,
(b) every `material/*` module exports a renderable component, (c) a `.Light`
sub-component renders for a known pair, (d) several gradient/id-bearing icons
render together without cross-collision. Record the green `nx` run and a Storybook
screenshot of each story as retained evidence (a `verification.md` companion note
if the harness produces one).

## Review Follow-Up

Honors the two review conditions: build refactor proven green with brands only
before Material is added (step 3 gates step 5); retained smoke test is step 7.

## Delegation Units

- **Build refactor (main line)** — owns `vite.config.mts`, brands relocation,
  Storybook brand imports, the smoke test. Not delegated. Result: steps 1–3, 7.
- **Material conversion (subagent-required)** — owns `src/material/*` generation
  and per-icon spot-checks over the deterministic transform output. Writeback:
  reconciled `.tsx` under `src/material/` + a findings list folded into task 3.3.
  Boundary: subagents never edit build config, brands, or the smoke test.

## Parallel Units

- Per-icon conversion and per-icon render spot-checks (step 5) run concurrently.
- Aggregator: the main line reconciles subagent findings (task 3.3) before step 7.

## Isolation Boundaries

- Subagents write only under `packages/icons/src/material/`; one icon (or a
  disjoint batch) per unit, no shared file.
- Build config, brands, Storybook, and the smoke test are owned solely by the
  main line — off-limits to conversion units.
- Validation boundary: a unit's icons must individually render before reconcile;
  full-suite validation is the main line's (step 7).

## Worktree Units

Optional — single-tree is sufficient (no generator, no dependency install, no
shared root-config edit). If run concurrently with other work, isolate the whole
change in one `feat/material-icons` worktree.

## Integration Owner

Main line (this plan's owner) integrates subagent-produced `material/*` icons,
runs the shared validation block, and prepares the branch.

## Execution Notes

- Scratchpad holds the sparse clone (`…/scratchpad/material-icon-theme/icons`, 633 file icons) and the
  throwaway transform (`…/scratchpad/convert.mjs`) — neither committed.
- openspec CLI env fixed mid-flight: repo `.tool-versions` set to `nodejs 24.14.1`, so the `openspec` shim
  now resolves directly.
- **Completed** all blocks. Block A: brands relocated to `src/brands/`, `vite.config.mts` rewritten to
  path-keyed entries + nested dts; green with brands only, then full set. Block B: 587 material components
  (+46 `.Light`) generated, 4 sonnet auditors CLEAN, story + README added. Validation: 643 tests, build,
  typecheck, build-storybook all green. Retained evidence + rule audit in `verification.md`.
- Out of scope: pre-existing `@zeroxsolutions/ui:typecheck` failure (unmodified `select-field.tsx`).

## Manual Adjustments

none
