## Readiness Decision

ready with conditions - the scope is locked and the design is complete, but two
Open Questions need a human decision before apply: **Q1** (theme seam:
fumadocs-ui DocsLayout themed to monochrome vs `fumadocs-core` + our Sidebar
primitive) and **Q4** (which item seeds the template page). Q2 (registry route)
and Q3 (Props API) resolve at apply against the installed fumadocs.

## Execution Mode

standard - a docs-framework migration; the real-browser verification is the
retained e2e, not unit TDD.

## Verification Mode

retained-recommended - `apps/registry-e2e` is rewritten and retained as the
real-browser gate (jsdom cannot measure layout or live preview).

## Debug Mode

standard

## Delegation Mode

single-agent - the fumadocs setup is one cohesive sequence (install -> sources
-> components -> remove old shell -> e2e).

## Parallelization Mode

serial-only - each step rewrites the same app shell; nothing is independent.

## Worktree Mode

same-tree - per the repo's work-on-master convention.

## Branch Finish Mode

standard - commit when asked; the pre-commit gate (lint typecheck build test)
runs.

## Blocked By

- **Q1** (theme seam) - decide fumadocs-ui DocsLayout-themed vs
  `fumadocs-core` + our Sidebar before apply.
- **Q4** (seed item) - name one registry item to seed the template page.

## Validation Focus

The plan must carry forward:

- static export still builds with no server binding (Workers Static Assets).
- `pnpm nx run-many -t lint typecheck build test` green.
- `pnpm nx e2e @zeroxsolutions/registry-e2e` green on the `/docs` + `/registry`
  IA.
- no `components/ui` primitive has a doc page.
- the seeded registry page renders Preview + Install + Props.
- the docs-authoring rule exists in `.agents/rules/` and the submodule bump is
  committed.

## Key Risks

- **Theme seam (Q1)** - fumadocs-ui DocsLayout vs our Sidebar; the wrong call
  means rework of the shell.
- **Static export + dynamic catch-all** - must SSG every MDX route with no
  server binding.
- **fumadocs version vs Next 16 / React 19** - verify against the installed
  artifact at apply.
- **Deleting `app/(main)/*` + `components/docs/*`** without breaking the kept
  `app/preview/*` routes or the `@zeroxsolutions/ui:shadcn-build` step.

## Findings Summary

None - pre-implementation review.
