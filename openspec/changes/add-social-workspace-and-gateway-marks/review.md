## Readiness Decision

ready with conditions

The contract is fixed (specs: broadened `brands` coverage incl. social/workspace +
Cloudflare AI Gateway, the Type-M/Type-C variant surface, source attribution) and
the approach is proven — it reuses the two authoring shapes and the `makeAvatar` /
`useFillIds` helpers already shipped by the prior `enrich-icons-brand-marks` change.
Every one of the 48 marks has a verified source (Simple Icons / gilbarbara / svgl /
lobehub). The remaining open items are enumeration-level, resolved during vendoring,
not blockers: the Instagram flat-vs-gradient call, and the exact source line for
`cartesia` / `parallel` / `xai`.

## Execution Mode

standard

Bulk vendoring of presentational components, not behavioral logic. The existing
glob-driven smoke test (non-empty svg, `size` prop applied, no shared internal SVG
id) is the safety net and needs no edit; a per-mark red→green TDD loop adds no value
over the sweep.

## Verification Mode

retained-recommended

The structure-only smoke test cannot catch a wrong mark type: a full-color mark
mistakenly authored as monochrome (or a broken gradient) renders visually wrong yet
still passes. Retain a visual spot-check — render a representative sample per cluster
(and every Type-C mark: `microsoft-teams`, `outlook`, `onedrive`) in Storybook, or
drive `storybook-static` in a real browser, and compare against the source artwork.
jsdom cannot judge appearance (standing notes: "verify visual bugs in a real
browser", "don't claim UI done without a browser check").

## Debug Mode

standard

## Review Request

Pre-implementation judgment captured inline. A focused review is warranted after the
first vendoring batch (one full cluster) to confirm the Type-M/Type-C rule,
gradient-id isolation, and attribution are applied consistently before scaling to
all 48.

## Review Scope

`packages/icons/src/brands/*` (48 new mark files), `packages/icons/README.md` (brands
table + attribution), `apps/storybook/src/icons/brand-marks.stories.tsx` (catalog).
No change expected to `brand-marks.spec.tsx` (glob-driven) or `package.json` (no new
runtime dep).

## Review Focus

- Each mark's variant surface matches its **type** (D2): Type M → base(mono) +
  `.Color` + `.Mono` + `.Avatar`; Type C → base(color) + `.Color` only. An absent
  variant is a type error, not a stub; never `.Text` / `.Combine` (no wordmarks).
- Color model: base/`.Mono` → `currentColor`; `.Color` → intrinsic (incl. gradients).
- Gradient marks (`microsoft-teams`, `outlook`, `onedrive`) isolate ids via
  `useFillIds` — no cross-instance bleed.
- Type C marks correctly ship **no** `.Avatar` (no currentColor silhouette to feed
  `makeAvatar`).
- Source recorded per mark (Simple Icons CC0 / gilbarbara / svgl / lobehub); the
  README retains the trademark disclaimer and it covers the new
  trademark-restrictive brands (LinkedIn, Meta, Microsoft families).
- `packages/icons/package.json` gains no runtime dependency.
- `brands/` resolves a mark for all 24 native AI Gateway providers.

## Review Status

not-requested

## Delegation Mode

subagent-eligible

The 48 marks partition cleanly by cluster (social / workspace / mail / AI-gateway),
each an independent batch of the same mechanical pattern — suitable for parallel
subagent vendoring once the first cluster validates the rule.

## Parallelization Mode

parallel-eligible

Marks are independent files under one flat `brands/` dir with no shared-state edits
(the smoke test and exports map are glob/pattern-driven). README-table and Storybook
edits touch shared files and should be serialized as a final consolidation step.

## Worktree Mode

same-tree

Per the standing "work on master directly" note for this repo; no isolated worktree.

## Branch Finish Mode

standard

## Blocked By

none

## Validation Focus

- `nx run-many -t lint build test @zeroxsolutions/icons` green (plan.md must carry
  this as the gate).
- Every new `brands/<name>` resolves and renders a non-empty svg (smoke test).
- No two marks share an internal SVG id on one page (smoke test, incl. gradients).
- Visual spot-check of each cluster + all Type-C marks in a real browser.

## Key Risks

- **Mark-type misclassification** — a full-color source authored as mono renders
  wrong and passes the smoke test. Mitigated by the visual spot-check.
- **Trademark posture** — LinkedIn/Meta/Microsoft are restrictive; keep the
  disclaimer and brand-guideline note, source from non-Simple-Icons where removed.
- **Gradient id collisions** — mitigated by `useFillIds`; explicitly asserted by the
  no-shared-id smoke test.

## Findings Summary

No review findings yet (pre-implementation).

## Manual Adjustments

<!-- none -->
