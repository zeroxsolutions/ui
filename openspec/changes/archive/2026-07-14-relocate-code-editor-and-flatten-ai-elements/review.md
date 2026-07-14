## Readiness Decision

ready

The relocation (D1–D10) and the Mermaid rule-conformance refactor (D11–D15) are fully scoped
and can start. The prior Open Questions are now **resolved** (see design `Resolved Decisions`):

- Read-only `CodeBlock` header → label + copy + collapse (the `Disclosure` header slots).
- Settings-menu option set → Tab size / Use tabs / Show line numbers / **Soft wrap**.
- Shared-chrome name → **`Disclosure`** (a general compound), not `CodeBlockShell`;
  moved pane → `CodeMirrorPane`; `FloatingToolbarShell` → `FloatingToolbar`.
- `reasoning` / `tool` → keep their names, relocate to `components/chat/`, compose `Disclosure`.

Two sub-decisions remain deferred and do **not** block (design `Open Questions`): whether the
editor wraps `DisclosureHeader` as a domain-named `DocumentBlockHeader`, and whether the
sibling `ChatMessageShell` / `FloatingShell` also drop `-shell` in this change.

## Execution Mode

tdd-preferred

This is a behavior-preserving relocation/refactor: the moved components and the code-block
feature already carry co-located specs. Keep them green across the move and add interaction
coverage for the rebuilt editable code-block (`green-before-commit`).

## Verification Mode

retained-recommended

Behavior parity is visual/interactive (editable ⇄ read-only header, code editing, scroll).
Drive Storybook / `test-storybook` to confirm — jsdom cannot measure layout, so a real
render is the honest check.

## Debug Mode

standard

## Review Status

not-requested

## Delegation Mode

subagent-eligible

Large but mechanical; a single implementer subagent can carry the ordered migration, self-
loading the applicable `.agents/rules/*.md` per file.

## Parallelization Mode

serial-only

The cross-package move has a hard ordering (D6 before D4): `@editor` must own the pane and
stop importing `@ui`'s editable `CodeBlock` before `@ui` drops it. Do not parallelize the
phases.

## Worktree Mode

same-tree

Maintainer instruction: work on `master`, no worktree — a deliberate, recorded deviation
from `worktree-per-task`. Serialize with any other work on this repo since the move edits
package `package.json` files and per-file export maps.

## Branch Finish Mode

standard

## Blocked By

none

## Validation Focus

- After **each** migration phase: `nx run-many -t lint build test` green; Storybook builds
  and `test-storybook` passes.
- `grep` of `packages/ui/src` finds **no** `@codemirror` import and no `@zeroxsolutions/editor`
  import (no back-dependency edge).
- Exactly one Shiki highlighter: `@editor`'s moved `code-syntax` imports `@zeroxsolutions/ui/lib/shiki`.
- Rebuilt editable code-block preserves behavior: typing writes `code`, language switch writes
  `language`, copy works; read-only viewer/export path renders the `@ui` read-only `CodeBlock`.
- Read-only and editable headers render from the **same** `Disclosure` compound (visual parity).
- Markdown/font preview panes scroll via `ScrollArea`; no dangling `Conversation` or
  `use-stick-to-bottom` references after deletion.
- The Mermaid surface composes the design system (F1–F5): shared `Disclosure` header, a
  `Combobox` type switcher, the `FloatingToolbar` zoom, a `Card` container, and the read-only
  `CodeBlock` fallback — only `DiagramCanvas` bespoke; diagram behavior unchanged.
- `components/ui/*` (vendored) is untouched.

## Key Risks

- **Move ordering / dependency direction** — reversing D4/D6 breaks `@editor`'s build.
- **Shiki double-load** — a copied (not forward-imported) Shiki foundation loads two
  highlighters.
- **Breaking subpaths** — genuine major bumps for both packages; low consumer count mitigates.
- **Header drift** — mitigated only if every surface (read-only block, editable block,
  `reasoning`/`tool`, Mermaid header) truly composes the shared `Disclosure`.
- **Vendored layer** — the ScrollArea/Dropdown primitives must be composed, never edited
  (`ui-primitive-fidelity`).
- **Storybook host coverage** — `test-storybook` is this host's e2e-equivalent; keep it green
  through the story moves.

## Findings Summary

No prior OpenSpec review findings. A UI rule-audit of the pre-existing `@editor` Mermaid
surface (built by a separate session) produced five conformance findings, now folded in as
decisions D11–D15 and capability `editor-mermaid-composition`:

- **F1** — three hand-rolled header strips → compose the shared `Disclosure` (D11).
- **F2** — hand-rolled zoom toolbar → the `@ui` `FloatingToolbar` (D12).
- **F3** — `rounded-lg border bg-card` look-alike → design-system `Card` (D14).
- **F4** — raw `<pre>` SSR fallback → read-only `CodeBlock` (D15).
- **F5** — `DropdownMenu` template switcher → stateful `Combobox` (D13).
