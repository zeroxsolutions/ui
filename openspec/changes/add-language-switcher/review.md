## Readiness Decision

ready

## Execution Mode

tdd-preferred

<!-- Behaviour is spec'd; co-located Vitest spec drives the component. Prefer writing the
     spec's assertions alongside the component, but strict red-green is not mandated. -->

## Verification Mode

retained-recommended

<!-- Keep a short verification companion note (as with the prior icon change) recording the
     green gate + the code-block round-trip check. -->

## Debug Mode

standard

## Delegation Mode

subagent-eligible

## Parallelization Mode

serial-only

<!-- The steps are dependency-ordered: add the icons dep → build the icon map + option
     builders → component + forms → editor wiring → story. They touch overlapping
     modules and shared config; do not parallelize. -->

## Worktree Mode

same-tree

<!-- User directive: stay on master, no new branch/worktree this time. -->

## Branch Finish Mode

standard

## Blocked By

none

## Validation Focus

- `nx typecheck @zeroxsolutions/ui`, `nx build @zeroxsolutions/ui`, `nx test @zeroxsolutions/ui`.
- `nx typecheck @zeroxsolutions/editor`, `nx build @zeroxsolutions/editor`, `nx test @zeroxsolutions/editor`.
- `nx build-storybook @zeroxsolutions/storybook` (or the repo's storybook build target).
- The shiki-id → Material-icon map resolves an icon (or a defined fallback) for **every** id
  in `src/lib/shiki.ts` — no unmapped language renders a broken/blank icon.
- Code-block round-trip: selecting a language sets `attrs.language`; the fenced-Markdown
  codec and HTML export produce the same output they did with the `<input>`.
- `searchable` is present on the `dropdown`/`icon` forms and absent from `segmented` at the type level.

## Key Risks

- **Shared-config edit.** Adding `@zeroxsolutions/icons` to `@zeroxsolutions/ui` touches
  `package.json` + `pnpm-lock.yaml` (a shared surface) — run `pnpm install` and confirm the
  lockfile resolves cleanly.
- **Icon coverage / bundle.** ~30 Material icons statically imported; a shiki id lacking a
  clean Material match must fall back rather than break. Bounded bundle cost accepted (design D5).
- **`searchable` toggle within one primitive.** The `dropdown` form shows/hides its `CommandInput`
  on `searchable` inside one `Popover` + `Command`; keyboard/focus behaviour must stay consistent — exercise both in the story/spec.
- **`Intl.DisplayNames` fallback.** Missing native name → raw code; consumers needing exact
  wording pass `options`.
