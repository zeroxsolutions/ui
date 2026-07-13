## Scope

Enrich `@zeroxsolutions/icons` `brands/` from 5 single-variant marks to a
self-sufficient AI + dev/cloud/infra set (~200 brands) exposing the full
`@lobehub/icons` variant surface per brand (base + `.Color`/`.Mono`/`.Avatar`/
`.Text`/`.Combine`, present where each exists). Follows the shipped
`add-material-icons` pattern: throwaway vendoring transform, committed `.tsx` only,
glob-driven smoke test, README + Storybook catalog. Adds one shared
Avatar/Combine composition module. Covers the whole change end-to-end.

## Covers

`1.1`–`1.4`, `2.1`–`2.6`, `3.1`–`3.4`, `4.1`–`4.5`, `5.1`–`5.2`, `6.1`–`6.5`;
Validation Focus: green lint/build/test, glob smoke test (base + per-present-variant
+ no-shared-id + count floor), no new runtime dependency, visual spot-check across
variants and color tiers.

## Plan Type

full

## Execution Strategy

standard

## Ordered Steps

1. **Manifest + variant matrix + composition module** — build the scratchpad
   manifest (per brand: variants present, source tier per variant, brand color,
   symbol), resolve collisions, and build the shared `makeAvatar`/`makeCombine`
   helpers with the Vite-output decision confirmed (tasks 1.1–1.4).
2. **Glob smoke test first** — rewrite `brand-marks.spec.tsx` glob-driven with the
   per-present-variant checks, no-shared-id sweep, and count floor; it stays green as
   marks land (tasks 4.1–4.5).
3. **Vendor marks in parallel by domain** — each domain group emits disjoint
   `src/brands/<name>.tsx` compound components (base + present variants wired to the
   shared composition helpers), color-tier per D2, ids namespaced per D5 (tasks
   2.1–2.6, 3.1–3.4).
4. **Integrate docs + catalog** — one owner updates the README brands table (with
   variant matrix) and the glob-driven Storybook catalog after vendoring converges
   (tasks 5.1–5.2).
5. **Validate** — lint/build/test green, exports-map + variant-typing smoke import,
   visual spot-check, no-new-dependency + existing-marks-still-render check, rule
   audit (tasks 6.1–6.5).

## Validation Per Step

1. Manifest lists every target with a resolved unique symbol, a variant matrix, and
   a brand color; `makeAvatar`/`makeCombine` render correctly for one sample brand.
2. `nx test @zeroxsolutions/icons` passes with the new glob test against the current
   set; the per-variant + floor assertions are present.
3. After each domain batch: `nx build` emits `dist/brands/<name>.js` + `.d.ts`; the
   smoke sweep stays green (base + each present variant); no id collisions.
4. README table + Storybook catalog render the full set and each brand's variants;
   both glob/data-driven (no per-mark hand edit drifts).
5. `nx run-many -t lint build test` green; sample subpaths + variants import and type;
   visual spot-check evidence retained; `package.json` shows no runtime dep; existing
   5 marks still render at their subpaths.

## Files / Owners

- `packages/icons/src/brands/<name>.tsx` — new compound mark components (parallel, by domain)
- `packages/icons/src/brands/<composition>.tsx` — shared `makeAvatar`/`makeCombine` (step 1 owner)
- `packages/icons/src/brands/brand-marks.spec.tsx` — glob smoke test (integration owner)
- `packages/icons/README.md` — brands table + variant API (integration owner)
- `apps/storybook/src/icons/brand-marks.stories.tsx` — catalog (integration owner)
- scratchpad only — the throwaway vendoring pipeline (never committed)

## Completion Checkpoint

Every enumerated brand exists as a committed `.tsx` under `src/brands/` — a base
component plus the variants that apply (`.Color`/`.Mono`/`.Avatar`/`.Text`/
`.Combine`), each rendering correctly, with isolated internal ids, reachable at
`@zeroxsolutions/icons/brands/<name>`. Lint/build/test green; README + catalog list
the full set with per-brand variants; no runtime dependency added; the 5 existing
marks still render at their subpaths.

## Completion Verification

Verification Mode is retained-recommended. Before presenting complete, record in
`openspec/changes/enrich-icons-brand-marks/verification.md`: the green
`nx lint/build/test @zeroxsolutions/icons` output; a smoke-import proving `.Color`/
`.Mono`/`.Avatar`/`.Text` resolve and type for a sample brand; and a Storybook
(real-browser) spot-check of a representative sample across variants and both color
tiers against source artwork — jsdom cannot judge appearance.

## Review Follow-Up

Pre-implementation review flagged wrong variant/tier classification as the top risk
→ step 5 adds the retained visual spot-check; uneven variant coverage + Text
availability → encoded as "variants where they exist" (step 3, absent ⇒ not
exposed); attribution + no-runtime-dep → steps 4–5. Request a focused review after
the first vendoring batch before scaling to the full set.

## Delegation Units

- **Model labs** (2.1) · **Inference/host** (2.2) · **Voice/speech** (2.3) ·
  **Gen-media** (2.4) · **Agent/tooling** (2.5) · **Vector/data** (2.6) ·
  **Dev/infra** (3.1–3.4) — each owns its disjoint `src/brands/<name>.tsx` list and
  returns vendored compound files + manifest rows (variant matrix + brand color).
- **Foundation unit** (step 1) — owns the shared composition module + manifest;
  must land before parallel vendoring so marks can wire `.Avatar`/`.Combine`.
- **Integration owner** — rewrites the glob test, README table, and catalog from the
  merged manifest; runs validation. Glob-picked, so writeback is data-driven.

## Parallel Units

Domain units 2.1–2.6 and 3.1–3.4 run concurrently **after** the foundation unit
(shared composition module + manifest) lands — each writes only its own
`src/brands/<name>.tsx` files. The integration owner runs serially after convergence.

## Isolation Boundaries

- File boundary: each domain unit owns a disjoint set of `src/brands/<name>.tsx`; the
  shared composition module is owned solely by the foundation unit and only imported
  (never rewritten) by domain units. Collision watch-list resolved up front.
- Shared files (`brand-marks.spec.tsx`, `README.md`, `brand-marks.stories.tsx`) are
  owned solely by the integration owner — never touched by parallel units.
- Dependency boundary: parallel units may import the composition helpers but must not
  modify them; a needed change routes back through the foundation unit.
- Validation boundary: each unit self-checks its files build + render; the integration
  owner runs the full-package `lint build test`.

## Execution Notes

<!-- apply-time observations appended here -->

## Manual Adjustments

User chose to work on `master` this time (overrides `worktree-per-task`): same-tree
execution. Do not commit unless explicitly asked; if asked, keep atomic +
Conventional and Nx-Release as a minor bump.
