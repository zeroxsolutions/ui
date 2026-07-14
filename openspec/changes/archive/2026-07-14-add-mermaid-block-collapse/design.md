## Context

The in-document Mermaid block (`packages/editor/src/document/features/mermaid/mermaid.tsx`) is a node view composed from the house `Disclosure` compound in its `muted` variant — the same chrome the read-only `CodeBlock` (`packages/ui`) composes. The code block already collapses via `DisclosureTrigger` + `DisclosureContent`; the Mermaid block did not, because its View panel renders the diagram through `dangerouslySetInnerHTML` (the Mermaid engine returns an SVG string). Wrapping that node in a collapsible panel that unmounts on close made React and the raw-injected SVG fight over the DOM, throwing `removeChild` mid-render.

Base UI `Collapsible.Panel` (which `DisclosureContent` wraps) supports `keepMounted`, which keeps children mounted and toggles a `hidden` attribute instead of unmounting them. That removes the crash condition, so the block can adopt the same collapse affordance as the code block.

## Goals / Non-Goals

**Goals:**

- Add a collapse toggle to the block header, at parity with the code block.
- Guarantee the collapse never unmounts the diagram render (no `removeChild`).
- Keep the header controls visually consistent with the code block.

**Non-Goals:**

- Collapsing the standalone `MermaidEditor` authoring surface.
- Persisting the collapsed state to the document.
- Any change to rendering, pan/zoom, error handling, the view/edit toggle, the node schema, or the codec.

## Decisions

- **Reuse the `Disclosure` collapse parts, not a bespoke fold.** Add `DisclosureTrigger` (the chevron) to `DisclosureActions` after the copy control, and wrap the body (the `Separator` + both `TabsContent` panels) in `DisclosureContent`. This is exactly how the code block collapses, so the two blocks share one collapse mechanism.
- **`DisclosureContent keepMounted` is mandatory here.** Without it, folding a block that is showing the diagram unmounts the `dangerouslySetInnerHTML` node and crashes on `removeChild`. `keepMounted` keeps the node in the DOM and toggles `hidden`, so React never tears down the raw-injected SVG. The code block does not need this (its body is a React-owned `<pre>`); the Mermaid block does — this is the one intentional divergence.
- **Separator lives inside `DisclosureContent`.** So the header/body divider folds away with the body; a collapsed block is a clean header with no dangling divider.
- **Header height grouping follows the code block.** The View/Edit `TabsList` stays the 36px segmented control (its fixed height, no size variant); the copy control drops to `icon-sm` (32px) so copy + the 32px collapse chevron read as one paired icon-action group beside the taller tabs — the same copy+chevron pairing the code block uses.

## Risks / Trade-offs

- **Risk: a future refactor drops `keepMounted`, re-introducing the crash.** Mitigated by an inline comment at the call site explaining why it is load-bearing, and by a stress scenario in the spec (collapse/expand repeatedly while the diagram shows, across tab switches, with no error).
- **Trade-off: `keepMounted` keeps the diagram in the DOM while collapsed** (a hidden node), a small memory cost versus unmounting. Acceptable and necessary — unmounting is precisely what crashes.
- **Trade-off: three header controls cannot all share one height** (tabs are fixed 36px, icon buttons fixed 32px, neither has a size variant). Resolved by adopting the code block's grouping (tabs 36 / copy+chevron 32) rather than forcing a match.

## State Model

The block's node view carries two independent, non-persisted local view states:

- View/edit tab: `view` | `edit` (owned by Base UI `Tabs`; only the active panel mounts).
- Collapsed: `open` | `collapsed` (owned by Base UI `Collapsible` via `Disclosure`; defaults open).

Neither is written to the document. The diagram node stays mounted across every collapsed/expanded transition (`keepMounted`); it is unmounted only by a view/edit tab switch away from View, which is unchanged pre-existing behavior.

## Migration Plan

No data or API migration. The change is additive to a single node view; the code implementation is already present and verified in a browser (repeated collapse/expand + tab switches, zero page errors; header heights measured 36 / 32 / 32). Archiving this change syncs the new requirement into `openspec/specs/mermaid-document-block/spec.md`.

## Open Questions

None.
