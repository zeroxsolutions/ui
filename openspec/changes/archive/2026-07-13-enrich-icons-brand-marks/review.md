## Readiness Decision

ready with conditions

The contract is fixed (specs: brands coverage, source-driven color model,
attribution) and the approach is proven — this mirrors the shipped
`add-material-icons` conversion. The open items are enumeration-level, resolved
during vendoring, not blockers: the exact per-domain roster, each mark's color
tier, and the smoke-test floor count.

## Execution Mode

standard

Bulk vendoring of presentational components, not behavioral logic. The
glob-driven smoke test (non-empty svg, `size` prop, no shared internal id) is the
safety net and is authored alongside the marks; a full red→green TDD loop per mark
adds no value over the sweep.

## Verification Mode

retained-recommended

A wrong color-tier classification renders a visually wrong mark that the smoke test
(structure-only) will not catch. Retain a visual spot-check: render a representative
sample in Storybook (or storybook-static driven in a real browser) and compare
against the source artwork. jsdom cannot judge appearance — see the "verify visual
bugs in a real browser" standing note.

## Debug Mode

standard

## Review Request

Pre-implementation judgment captured inline here; no external review requested yet.
A focused review is warranted after the first vendoring batch to confirm the
color-tier rule and attribution are being applied consistently before scaling to
the full set.

## Review Scope

`packages/icons/src/brands/*` (new compound marks + shared `makeAvatar`/`makeCombine`
module), `brand-marks.spec.tsx` (glob rewrite), `README.md` brands table,
`apps/storybook/src/icons/brand-marks.stories.tsx`.

## Review Focus

- Variant surface matches lobehub (base + `.Color`/`.Mono`/`.Avatar`/`.Text`/
  `.Combine`), present **only where each exists** (absent ⇒ type error, not a stub).
- Color model per D2 (`.Mono`/base→`currentColor`; `.Color`→intrinsic).
- `.Avatar`/`.Combine` are the shared composition components (raw layout, no external
  UI dep), parametrized by brand icon/color/name — not per-brand SVG.
- Internal SVG ids namespaced per mark (no cross-instance bleed).
- Source attribution recorded per variant; trademark disclaimer retained.
- No new runtime dependency in `packages/icons/package.json`.

## Review Status

not-requested

## Delegation Mode

subagent-eligible

Vendoring judgment (source verification, color-tier classification, name/collision
resolution, render spot-checks, README rows, catalog) parallelizes across marks
per design D7.

## Parallelization Mode

parallel-eligible

## Worktree Mode

same-tree

User explicitly chose to work on `master` this time ("lần này làm trên master"),
overriding `worktree-per-task`. Honor it: same tree. Commits, if requested, stay
atomic and Conventional (`commit-conventions`); do not commit unless asked.

## Branch Finish Mode

standard

## Blocked By

none

## Observed Failure

Not applicable — this is an additive capability enrichment, not a bugfix.

## Validation Focus

- `nx run-many -t lint build test` (or targeted `nx {lint,build,test} @zeroxsolutions/icons`) green.
- Glob smoke test: base renders a non-empty `<svg>` with a `viewBox`; `size` maps to
  width/height on an icon-form variant; each **present** variant renders (`.Color`
  non-empty, `.Mono` currentColor, `.Avatar` background wrapper, `.Text`/`.Combine`
  wordmark); absent variants are `undefined`; `GithubMark` asserted separately; no two
  marks share an internal id; count floor met.
- Visual spot-check of a sample across variants and both color tiers against source artwork.
- `packages/icons/package.json` gains no runtime dependency; existing 5 marks still
  render at their subpaths (base unchanged, variants added); build emits `dist/brands/*`.
- README brands table (with per-brand variant matrix) + Storybook catalog list the full set with sources.

- **Scope / effort** — full lobehub × ~200 brands ≈ re-vendoring lobehub's AI subset
  plus generating variants for dev/infra (~3–5× the single-mark plan). Mitigation:
  variants-where-they-exist, parallel vendoring, generic Avatar/Combine built once.
- **Uneven variant coverage** — AI brands get the full five; dev/infra typically get
  base/`.Color`/`.Mono`/`.Avatar` (no wordmark). Faithful to lobehub; encoded as
  "absent variant not exposed" — callers must not assume `.Text` exists.
- **Wrong variant/tier classification** — a color logo as mono, or a stubbed variant
  that shouldn't exist. Mitigation: D2 rule + visual spot-check.
- **Composition machinery** — `.Avatar`/`.Combine` are real shared components (bg
  fill, `iconMultiple`, text layout) using raw layout elements; keep them small and
  dependency-free (`ui-primitive-fidelity`).
- **Trademark / brand-guideline exposure** — retained identification-only disclaimer;
  vendor from MIT/CC0/vendor artwork.
- **Name collisions across brands** (D6 watch-list: `x`/`grok`, `meta`/`llama`,
  `gemini`/`google`, `claude`/`anthropic`) — resolve to the searched product name.
- **Internal-id bleed** in `.Color` variants — per-mark id prefix, enforced by the
  no-shared-id test.
- **Scope creep** past AI + dev/cloud/infra into an unbounded Simple Icons mirror —
  hold the boundary set in the proposal.

## Findings Summary

No prior review findings to disposition.

## Manual Adjustments

None.
