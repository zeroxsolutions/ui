## Readiness Decision

ready with conditions — the classification, the verified inventory, and the vendored
boundary are settled; conditions are (a) resolve the CONFIRM-AT-APPLY sites by reading
each trigger, (b) decide `code-block:259`'s treatment before touching that line, and
(c) real-browser visual verification of every changed/adjacent surface.

## Execution Mode

standard — a composition refactor; existing co-located specs stay green, but the
decisive check is visual, not a red-test-first loop.

## Verification Mode

retained-required — visual verification cannot run in jsdom; a real-browser check
(storybook-static + playwright) must be performed and its result recorded, and any
regression test added for an override removal must be proven to discriminate.

## Debug Mode

standard

## Review Status

not-requested

## Delegation Mode

subagent-eligible — the per-file audit + edits and the CONFIRM-AT-APPLY trigger reads
can be delegated, but scope is small enough for a single agent.

## Parallelization Mode

serial-only — single package, overlapping composite files and one storybook build;
parallel edits would race with no real wall-clock win.

## Worktree Mode

same-tree — the user works on `master` for this task (no new branch/worktree by
explicit instruction); scaffolding is serialized already.

## Branch Finish Mode

standard

## Blocked By

none

## Observed Failure

N/A — refactor, not a bugfix. Baseline symptom is the drift itself: `className` on a
design-system component whose only effect duplicates or fights a primitive default
(flagship: `LanguageSwitcher` trigger, already corrected).

## Validation Focus

- **Real-browser visual parity** on every USE-VARIANT site and every surface adjacent to
  a removal — rebuild `@zeroxsolutions/ui` dist + `storybook-static`, drive with
  playwright, read `getBoundingClientRect`/computed size. jsdom reports 0 and cannot gate
  this (`verify-visual-bugs-in-real-browser`).
- `nx build @zeroxsolutions/ui` + `nx test @zeroxsolutions/ui` + `nx build-storybook` green.
- No dangling references after the deletions (already verified) and `./*` exports resolve.
- Any regression test guarding an override removal fails without the fix (prove it).

## Key Risks

- **Visual regression** on variant-swapped and kept surfaces — the primary risk; mitigated
  only by the real-browser pass, not by the unit gate.
- **Misjudging a CONFIRM-AT-APPLY site** (icon in a Button vs bare) — mitigated by reading
  each trigger, never guessing from the grep line.
- **`code-block:259` open decision** — accept `LanguageSwitcher`'s default trigger vs add a
  `variant`/`size` prop; a wrong call re-introduces override-piling or a look change.
- **Breaking public surface** from the deletions — accepted; version bump deferred by the user.

## Findings Summary

No prior review findings — this gate is authored pre-implementation.

## Manual Adjustments

None.
