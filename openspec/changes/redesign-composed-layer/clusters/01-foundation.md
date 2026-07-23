# Cluster 1 - Foundation (mini-proposal)

Scope: the shared floating surface + `cn()`-everywhere + the editor chrome-menu
`data-slot` renames. This cluster unblocks every later cluster.

## Decisions

### FloatingShell folds into the Popover primitive

`FloatingShell` is a bespoke re-implementation of Base UI `Popover.Positioner` (caret-rect
`anchor` + `side` + viewport clamp/flip). Verified against Base UI:

- **Non-focus is the default.** Base UI `Popover` is non-modal by default; focus trapping
  is enabled only when `modal={true}` AND a `Popover.Close` is rendered
  (https://base-ui.com/react/components/popover). So a `Popover` with the default
  `modal` does NOT trap focus - the editor keeps the caret, and the existing
  `onMouseDown preventDefault` pattern on the menu toggles still works.
- **Virtual anchor works.** `Popover.Positioner` accepts a `VirtualElement` `anchor`, so
  the caret `rect` (`FloatingAnchor`) maps directly; `side` + collision handling come from
  Floating UI (battle-tested, better than the hand-rolled clamp/flip).
- **Implementation check (task 1.2):** confirm the popup does not auto-focus on open in a
  real browser; if it does, pass the option that prevents it (or keep focus via the
  existing `preventDefault` on toggle mousedown).

Action: replace `FloatingShell` with `ui/popover` in `bubble-menu`, `slash-menu`,
`trigger-menu`, `editor-toolbar`; delete `floating-shell.tsx`; update the
`editor-ui-composition` reference. This deletes the bespoke surface AND the
`shadow-sm`/`shadow-md` drift in one move.

### cn()-everywhere (9 editor holdouts)

Swap each `[...].filter(Boolean).join(' ')` for `cn()` from `@zeroxsolutions/ui/lib/utils`:
`document/react/viewer.tsx`, `document/react/editor.tsx`, `document/ui/floating-shell.tsx`
(pre-delete), `document/ui/editor-toolbar.tsx`, `document/ui/slash-menu.tsx`,
`composer/chat-message-view.tsx`, `composer/chat-input.tsx`,
`composer/triggers/trigger-menu.tsx`, `composer/triggers/inline-token.tsx`.

### data-slot on the chrome menus (5 attributes)

Rename bespoke attributes to `data-slot="<kebab>"`, splitting identity from state where
fused: `data-bubble-menu` -> `data-slot="bubble-menu"`; `data-slash-menu` ->
`data-slot="slash-menu"`; `data-block-menu` -> `data-slot="block-menu"`; `data-editor-toolbar`
-> `data-slot="editor-toolbar"`; `data-trigger-menu={kind}` -> `data-slot="trigger-menu"` +
`data-token-kind={kind}`. Migrate every selector (CSS, `.spec.tsx`, engine) in the same
cluster.

## Verification

- `nx run-many -t lint build test` green; `editor` `.spec.tsx` suites pass.
- grep `.filter(Boolean).join` in authored code returns zero.
- grep `data-(bubble|slash|trigger|block)-menu` / `data-editor-toolbar` returns zero.
- no `*Shell` component remains in the editor; the floating surface is `Popover`.

## Out of scope

The `ui` composed cluster (data-slot on ~25 components, naming, variants), the icons /
fluent-emoji cluster, and the compound-spec deltas - those are later clusters.
