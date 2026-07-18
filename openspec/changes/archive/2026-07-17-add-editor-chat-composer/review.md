## Readiness Decision

ready with conditions

The change is well-scoped and composes proven pieces (the `mention` node, `slash-menu.tsx`,
`FloatingShell`, the `triggerQuery`/`caretRect`/`setSlashDecoration` seams). Implementation
MAY start, on one condition: **task 1 (the engine spike) runs first** and confirms the
builder can host a single-textblock schema plus an `Enter`-keymap override — or the
`composerKit`-owns-its-node-spec fallback is taken. Nothing else blocks.

## Execution Mode

tdd-preferred

The seam-testable logic (menu select → insert/clear, command state transitions, payload
extraction, view↔input pill identity) is written test-first per `green-before-commit`. The
visual surfaces (caret-anchored menu, inline highlight, pill, badge) resist pure unit TDD and
are validated in a browser instead — so TDD is preferred, not required across the board.

## Verification Mode

retained-recommended

The change's value is visual and cross-surface. A retained verification note (storybook-static
driven in a real browser) is worth keeping so the four visible behaviors and the pill-identity
guarantee stay proven, not re-derived each time.

## Debug Mode

standard

## Review Scope

The pre-implementation risk surface, not a code diff (no code exists yet): the engine-seam
assumption, the `/`-command-as-surface-state coordination with a focus-owning editor, and the
one-shared-render-path guarantee between `ChatInput` and `ChatMessageView`.

## Review Focus

- Whether the engine can express the minimal composer schema + submit keymap without a fork
  (the gating unknown).
- Whether the mention pill and command badge have exactly **one** render path each across edit
  and view (drift is the main correctness trap).

## Review Status

not-requested

Pre-implementation judgment recorded here directly; no separate reviewer requested.

## Delegation Mode

single-agent

## Parallelization Mode

parallel-eligible

After task 2 (`composer-kit` + types) lands, the `@` mention menu (task 3) and the `/` command
menu (task 4) are independent and MAY proceed in parallel; `chat-input` (5) then `chat-message-view`
(6) are serial after them. The spike (1) is strictly first.

## Worktree Mode

same-tree

Standing maintainer instruction for this repo: work on `master`, no worktree/branch (recorded
in `proposal.md`).

## Blocked By

none

Task 1 is a de-risking condition run inside this change's own task list, not an external
blocker — a documented fallback (`composerKit` supplies its own document node spec) exists if
the builder cannot express a constrained schema, so implementation is never dead-ended.

## Validation Focus

Paths `plan.md` must carry forward:

- **Engine seam (task 1)** — record the exact builder/TipTap seam used for the single-textblock
  schema and the `Enter`/`Shift+Enter` keymap; if unavailable, record the `composerKit` node-spec
  fallback taken.
- **One render path** — a test asserting `ChatMessageView` renders the **same** `MentionPill`
  (and the same command `Badge`) as `ChatInput`, from the shared codec — no second look-alike.
- **Payload round-trip** — `ChatInput.getJSON()` → `{ command, mentions, segments }` →
  `ChatMessageView` renders identically; positional segments preserve inline pill placement.
- **Menu mutual exclusivity** — `@` (inline) and `/` (start-only) never both intercept keys;
  reuse the slash-menu `dismissedFrom`/capture-phase pattern.
- **Browser verification** — caret-anchored menu position, `@query` highlight, pill atomicity,
  leading command `Badge` proven against `storybook-static` (jsdom cannot measure layout), each
  test shown to discriminate.
- **Boundary** — no `@ui → @editor` import edge; `@ui` gains no TipTap/ProseMirror dependency.

## Key Risks

1. **Engine can't express a constrained single-block schema or an Enter-keymap override**
   (the one real unknown). Mitigation: task 1 spike first; fallback is a self-contained
   `composerKit` node spec — never an engine fork.
2. **`/`-command-as-state coordination** with a focus-owning editor: pinning/clearing an
   external `Badge` and intercepting `Backspace` at document position 0. Mitigation: reuse the
   slash-menu capture-phase keydown pattern; command is plain React state, not a doc node.
3. **Render drift** between edit and view (two `MentionPill`/`Badge` paths). Mitigation:
   enforce one shared component + codec with an explicit identity test (task 6.2).
4. **Visual behavior unverifiable in jsdom** — regressions could pass unit tests. Mitigation:
   retained browser verification against `storybook-static`; prove each visual test
   discriminates.
5. **`setSlashDecoration` is "slash"-named but reused for the `@` highlight** — minor clarity
   debt, not a correctness risk; note it, do not rename the seam in this change.

## Findings Summary

- *Engine-schema unknown* — **accepted**, gated by task 1 with a documented fallback.
- *Command-as-state coordination* — **accepted**, mitigated by reusing the proven slash-menu
  keyboard/focus pattern.
- *Render-path drift* — **accepted**, mitigated by the one-shared-component rule + identity test.
- *jsdom visual gap* — **accepted**, mitigated by retained browser verification.
- *`setSlashDecoration` naming* — **deferred**, out of scope for this change.
