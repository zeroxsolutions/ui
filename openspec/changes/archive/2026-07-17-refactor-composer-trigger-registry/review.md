## Readiness Decision

ready with conditions

Scope, specs, and design are settled. Two design questions are decidable during
implementation, not blockers: whether the typed payload uses inference or a
`CustomTypes`-style augmentation (resolve by spike), and whether `#channel` ships
in this change as the generalisation proof.

## Execution Mode

tdd-preferred

The change's core success criterion is behaviour preservation for `@mention` /
`/command`. Carry the existing composer specs over first (they define the
contract), then drive the registry red-to-green so the migration cannot silently
regress a behaviour.

## Verification Mode

retained-recommended

The pills are a visual surface; build + unit-test green is necessary but not
sufficient. Render the composer in a real browser (Storybook via Playwright) and
confirm the migrated `@`/`/` behaviour and pill styling before claiming done -
the repo norm for UI work.

## Debug Mode

standard

## Review Request

The maintainer explicitly requested a post-implementation review of the code
structure and the payload-derivation logic before archive. Expected after the
implementation is green and browser-verified, before `/opsx:archive`.

## Review Scope

- `composer/triggers/*` - the descriptor + presets + validation, the generic
  menu, the inline-token factory, the trigger layer.
- `composer/message-payload.ts` and `composer/composer-types.ts` - the
  registry-derived typed payload.
- `chat-input.tsx` / `chat-message-view.tsx` - the `triggers` API surface.

## Review Focus

- Code structure: one responsibility per file; the generic menu is a clean
  parameterisation, not a flag-soup god-component; the coupled invocation pair
  (one-leading + backspace-restore) reads as one capability.
- Payload logic: `docToPayload` correctly buckets by registered `kind`; the
  derived types are sound (a renamed attribute fails the build) and not weakened
  by an `as`/`any` escape hatch.
- Behaviour preservation vs the carried-over specs; public-surface hygiene for
  the SemVer major (deliberate exports only).

## Review Status

resolved

## Delegation Mode

subagent-eligible

Implementation MAY be delegated to an implementer subagent (self-loads the
repo's rules and framework skills). The requested review runs via the
`code-reviewer` subagent against the repo's own rules.

## Parallelization Mode

serial-only

The pieces are tightly coupled (menu reads the descriptor; payload reads the
registry; presets feed both), and they edit the same composer files. Serialise
to avoid churn and merge friction.

## Worktree Mode

same-tree

Per this repo's established practice, work proceeds on the main line rather than
a dedicated worktree. No project scaffolding (no new nx project) is involved.

## Branch Finish Mode

standard

Commit only when the maintainer asks; do not auto-commit or push.

## Blocked By

none

## Validation Focus

- The invocation contract: `/` opens only at input start, at most one leading
  command, Tab / Enter / exact-slug-plus-space commit, Backspace restores the
  committed pill to editable `/slug`.
- Cross-token isolation: mounting several token menus does not let one clear
  another's inline highlight.
- The type gate: a renamed token attribute fails the build at each read site
  (compile-time proof the payload is derived, not cast).
- A real-browser render of the migrated pills in light and dark.

## Key Risks

- Payload type-inference weight (heavy/cryptic types); fallback is
  `CustomTypes`-style augmentation - decide from a spike, do not over-build.
- Generic-menu flag-soup; keep divergence as typed capabilities, validated.
- Emoji (`insertion`) scope creep - it is scaffolded but deferred; do not let its
  `:name:` grammar / virtualised grid distort the reference/invocation core.
- SemVer major on `@zeroxsolutions/editor`; ship a deliberate public surface.

## Findings Summary

The `code-reviewer` subagent ran over the trigger-registry files + payload logic.
One substantive finding, now fixed; structure, payload typing, and public surface
otherwise clean.

- **[accepted, fixed] Backspace-restore reconstructed `/{id}` not `/{slug}` for a
  shipped command where `name != id`.** `leadingTokenNode` read `.slug` off
  `token.readRef(attrs)` through an `as` cast, but `commandTrigger.readRef`
  renames slug -> `name` (no `slug` field), so it fell back to `id`. Fix: read the
  restore text from the raw node attrs via the token's `queryField` (as
  `docToPayload` and the pill render already do), and added a regression test
  using the shipped `commandTrigger` with `name != id`. The earlier browser check
  false-passed here because the reopened menu's ghost-completion decoration
  rendered the missing `-gen` after the caret, so `textContent` read `/image-gen`
  while the document held `/image`; the new unit test asserts the exact
  `insertContent` args instead. Editor suite now 242 tests green.
- **[accepted, no change] `buckets as Partial<ComposerTokens>`** (message-payload)
  confirmed justified: runtime-erased generic widening; consumer type-safety comes
  from the typed `readRef` write-site + the registry augmentation, and the
  "renamed attribute fails the build" guarantee holds. Not weakened.
- Structure (no god-component; the generic menu is a clean descriptor
  parameterisation), public surface (deliberate named exports, no `export *`), and
  naming/ASCII: no findings.
