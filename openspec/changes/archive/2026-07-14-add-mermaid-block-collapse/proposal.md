## Why

The in-document Mermaid block composes the same `Disclosure` chrome as the sibling read-only code block, but unlike the code block it cannot be collapsed: a tall diagram (or a long source in edit mode) stays fully expanded and pushes the surrounding document down with no way to fold it to just its header. The code block already offers this affordance, so the two blocks read inconsistently.

Collapse was originally left off deliberately: folding the body would unmount the diagram preview's `dangerouslySetInnerHTML` SVG mid-render and crash React with a `removeChild` error. That constraint is now solvable (Base UI `Collapsible` supports `keepMounted`), so the affordance can be added safely and the block brought to parity with the code block.

## What Changes

- The block header gains a collapse toggle (a chevron) in its actions, next to the copy control, and the block body becomes collapsible — folding to header-only.
- The collapsed state keeps the rendered diagram SVG mounted (hidden, not unmounted), so folding and unfolding never tears down an in-flight render.
- The header controls group like the code block: the View/Edit segmented tabs stay the 36px segmented control; the copy and collapse controls pair as 32px icon actions.
- The `mermaid-document-block` spec gains a requirement describing the collapsible-and-crash-safe behavior.

## Success Criteria

- The block header shows a collapse chevron; activating it folds the body to header-only and activating it again restores the body.
- Collapsing or expanding the block while the diagram is showing never unmounts the SVG and never throws (no `removeChild`), across repeated toggles and tab switches.
- The header controls read consistently with the code block (segmented tabs beside a paired copy + collapse icon-action group).
- The read-only viewer is unchanged (no header, no collapse).
- The block's node schema, `source` attribute, and the fenced ` ```mermaid ` codec round-trip are unchanged.

## Non-Goals

- No collapse on the standalone `MermaidEditor` authoring surface (`mermaid-editor-surface`) — it is a full editing surface, not a document block.
- The collapsed/expanded state is local view state; it is NOT persisted to the document.
- No change to the diagram rendering, pan/zoom, error handling, or the view/edit toggle behavior itself.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `mermaid-document-block`: adds a requirement that the block is collapsible from its header and that collapsing keeps the diagram render mounted (crash-safe).

## Impact

- `packages/editor/src/document/features/mermaid/mermaid.tsx` — the block node view (implementation already present; this change governs it).
- `openspec/specs/mermaid-document-block/spec.md` — a new requirement (delta under this change).
- No API, dependency, schema, or codec changes.
