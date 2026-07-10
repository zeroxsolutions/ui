## Readiness Decision

ready with conditions

Conditions:
1. The build refactor (path-keyed entries + nested `.d.ts`) must be proven green
   with **only the relocated brand marks present**, before any Material icon is
   added — the build change is validated in isolation.
2. A retained smoke test must assert every `material/*` module exports a
   renderable component (guards conversion correctness at scale).

## Execution Mode

tdd-preferred

The build/structure refactor and the smoke/render tests lead; the bulk icon
generation is mechanical and validated by the retained smoke test rather than
per-icon TDD.

## Verification Mode

retained-recommended

Retain a smoke test over the `material/*` and `brands/*` modules (renderability +
category subpath resolution) and keep the Storybook catalog as the visual check.

## Debug Mode

standard

## Review Request

Pre-implementation self-review of a build-config refactor plus a large one-time
third-party asset import. No external reviewer blocking; findings self-recorded.

## Review Scope

- `packages/icons/vite.config.mts` — entry keying (D1) and dts nesting (D2).
- `packages/icons/package.json` `exports` — confirm `"./*"` matches nested
  subpaths (D3).
- `packages/icons/src/brands/*` relocation + `apps/storybook` import updates (D7).
- The compound-component template and id-namespacing applied to `material/*` (D4/D5).

## Review Focus

- Does nested `dist/` output actually resolve through `@zeroxsolutions/icons/<cat>/<name>`?
- Are the 14 id-bearing icons namespaced so they don't cross-collide on one page?
- Do the 46 `.Light` sub-components attach only where a light pair exists?

## Review Status

not-requested

## Delegation Mode

subagent-required

The one-time conversion is delegated to sonnet subagents (user-requested).
Subagents own the judgment layer — naming/collision resolution, render
spot-checks, catalog story, attribution — over a deterministic transform; the
composition root (build config, template, smoke test) stays in the main line.

## Parallelization Mode

parallel-eligible

Per-icon conversion and per-icon spot-checks fan out; the build-config refactor
and the smoke test are serial and precede the fan-out.

## Worktree Mode

worktree-eligible

Touches `packages/icons` build config and adds many files, but runs **no**
generator and installs **no** dependency, so it does not edit shared root config
(`nx.json`, lockfile). Current branch is `master`; branch onto
`feat/material-icons` before committing (see `worktree-per-task`,
`commit-conventions`).

## Branch Finish Mode

standard

## Blocked By

none

## Observed Failure

n/a — this is an additive/architecture change, not a bugfix.

## Validation Focus

- `nx lint build test @zeroxsolutions/icons` green.
- `dist/` is nested (`dist/material/*.js`, `dist/brands/*.js`); a smoke import of
  one icon per category resolves (D3).
- Every `material/*` module default-exports a renderable component; the 46
  `.Light`-bearing icons expose a working `.Light`.
- Multiple gradient-bearing icons render correctly together (id isolation, D5).
- Storybook builds; brand-mark story updated to `brands/*`; Material catalog story
  renders.

## Key Risks

- **Conversion correctness at 587-file scale** — a wrong hand/agent conversion.
  Mitigation: deterministic transform + retained smoke test + subagent spot-checks.
- **Build-config regression** (D1/D2 touch the shared library build). Mitigation:
  prove green with brands only first.
- **Breaking brand subpaths** (D7). Mitigation: v0.0.1, Storybook-only; imports
  updated in-change.
- **id cross-collision** for the 14 id-bearing icons. Mitigation: per-icon
  `prefixIds` baked into the committed `.tsx`.

## Findings Summary

No prior review findings to disposition (first pass).

## Manual Adjustments

none
