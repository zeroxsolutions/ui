## Readiness Decision

ready with conditions - the design is settled; a few facts must be confirmed at the start of implementation (see Blocked By / Key Risks), none of which block starting the mark-vendoring work.

## Execution Mode

tdd-preferred - `@zeroxsolutions/icons` is a publishable library on vitest; write the `AiProviderIcon` resolution spec (variant, size, fallback, unknown-key) before the component, and a render smoke test per newly vendored mark.

## Verification Mode

retained-recommended - keep the vitest specs and the Storybook stories as the durable proof; vendored marks are additionally verified visually (compiled dist rendered in a real browser), consistent with how this package's marks are validated.

## Debug Mode

standard

## Review Status

not-requested

## Delegation Mode

subagent-eligible - vendoring the ~21 marks is mechanical and self-contained; the resolver (`ai-provider-config` + `AiProviderIcon`) is one focused unit. A brief can point an implementer at these artifacts.

## Parallelization Mode

parallel-eligible - each vendored mark is an independent file with no shared-config edits, so the ~21 marks can be produced concurrently; the resolver depends on them and lands after.

## Worktree Mode

same-tree - additive edits inside `packages/icons` plus stories in `apps/storybook`; no project generation and no shared root-config churn that would force isolation.

## Branch Finish Mode

standard

## Blocked By

none

## Validation Focus

- `AiProviderIcon` resolves every provider key the mapping declares, across `type` = color / mono / avatar / combine and a numeric `size`, and renders the neutral Default for an unknown key (the `ai-provider-icon` spec scenarios).
- Case-insensitive key match.
- Tree-shaking preserved: importing a single mark by its subpath does not pull in `ai-provider-config` or the other marks.
- No `@lobehub/icons` in the runtime graph of `AiProviderIcon`.
- Each newly vendored mark renders correctly, including gradient id-isolation (`internal/fill-ids`) when two colored marks share a page.

## Key Risks

- Dist subpath layout drift - README shows `brands/...` while chiselhub imports flat keys; confirm the built `dist/` layout before fixing the `AiProviderIcon` / `ai-provider-config` subpaths so exports resolve.
- Published-version lag - `lucide-mark` and `ai4bharat` exist on the release line chiselhub consumes but not in this working tree; reconcile before re-vendoring duplicates.
- Provider-config domain boundary - keep generic providers shared in the package; app-specific keys ride an optional `extra` mapping, not the shared config.
- Brand asset licensing - vendor only from MIT-licensed sources and carry the attribution comment, as existing marks do.

## Findings Summary

The design's Open Questions are the readiness conditions, each carried into tasks:

- Dist subpath layout (flat vs `brands/`) - accepted as a first task (verify against built `dist/`).
- Presence of `google` (plain), `microsoft` (plain), `lucide-mark` on the release line - accepted as a verify-before-vendor task.
- `ai-provider-config` home (shared + optional `extra`) - accepted; the leaning is recorded in design D3.
- `type="combine"` need - deferred; implement the variant path but no consumer drives it yet.
