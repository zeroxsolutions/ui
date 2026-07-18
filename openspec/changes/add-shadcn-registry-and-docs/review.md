## Readiness Decision

ready with conditions

Proposal, specs, and design are complete and the approach is grounded (repo already
`@/`-aliased + `components.json`; `next`/`@nx/next` installed; OpenStatus proves the
dual-distribution pattern). The conditions are the design Open Questions that must be
resolved **during** apply (not before start): the exact `shadcn build` output flag +
monorepo file-path base, and confirming preview import resolves from workspace source.

## Execution Mode

tdd-preferred

The testable core (the `registry-e2e` interaction specs, the `shadcn add`-into-scratch
check) is written test-first. The scaffolding/config steps (remove Storybook, generate the
Next.js app, add Playwright) are generator-driven and verified by their `nx` targets
going green rather than by unit tests.

## Verification Mode

retained-recommended

Real-browser verification is central (`registry-e2e`, the registry preview, static-build
+ `/r` fetch, `shadcn add` smoke). Retain a verification note recording those runs, per
the repo's "verify visual behavior in a real browser" discipline.

## Debug Mode

standard

## Delegation Mode

single-agent

## Parallelization Mode

serial-only

The scaffolding (remove Storybook, generate the Next.js app + e2e, add Playwright,
re-scaffold `packages/ui`) edits shared root config (`nx.json`, `tsconfig.base`,
lockfile). Per `worktree-per-task`, scaffolding is serialized to one session across the
whole repo - no concurrent generator/install.

## Worktree Mode

same-tree

Work proceeds on `master` directly (this repo's working preference), and the scaffolding
must be serialized to one session regardless.

## Branch Finish Mode

standard

## Review Status

not-requested

## Blocked By

none

Can start immediately. The only gating conditions are the two design Open Questions,
resolved inside apply (verify against the installed `shadcn` CLI) - they shape a task,
they do not block the start.

## Validation Focus

plan.md MUST carry these validation paths forward:

- `shadcn add <host>/r/<name>.json` into a scratch project resolves `@/` to that
  project's aliases and compiles (the copy channel works end to end).
- The npm package channel is unchanged - `pnpm add @zeroxsolutions/ui` + subpath import
  resolves exactly as before, no `exports` change.
- `nx run-many -t lint build test` green across the workspace; `packages/ui` stays
  jsdom-only (no browser project).
- The registry app static-builds; `/r/<name>.json` serves a schema-valid item; an
  isolated live preview renders a component.
- `nx e2e @zeroxsolutions/registry-e2e` runs (Playwright), covering interaction/visual.

## Key Risks

- `shadcn build` in a monorepo - output flag + item file-path base need verification
  against the installed CLI before wiring (design Open Question).
- Preview-from-source is fast but not a byte-for-byte check of the shipped artifact -
  offset by the build + `shadcn add` smoke check.
- Playwright in CI - browser download + flake; pin and cache.
- Serialized scaffolding window - a concurrent generator/install elsewhere would
  conflict on root config; keep this the only scaffolding session.
- Registry churn if items outrun final names - mitigated by shipping plumbing + 1-2
  samples only.
