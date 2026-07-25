# Verification - redesign-composed-layer

## Automated gate (green)

- `nx run-many -t lint build test` -> 6 projects green; 243/243 editor tests pass
  (editor consumes `ui` end-to-end; no regression).
- `nx e2e @zeroxsolutions/registry-e2e` -> 12/12 pass (5 original + 4 radius-seam + 3
  renames).

## Migration completeness (grep, authored code)

- `.filter(Boolean).join` -> zero hits.
- `data-(bubble|slash|trigger|block)-menu` / `data-editor-toolbar` -> zero hits.
- bespoke `*Shell` component -> zero hits.
- authored `*Row` component symbol -> zero hits.
- the floating surface comes from the `Popover` primitive; `floating-shell.tsx` is gone.

## Real-browser verification (jsdom cannot see these)

- **SplitButton / MenuButton radius seam** - PASS. Per-corner `getComputedStyle` on the
  action and caret buttons: action `tl=8 tr=0 br=0 bl=8`, caret `tl=0 tr=8 br=8 bl=0`
  (inner corners square, outer `--radius-md`); Root carries `data-slot="button-group"`.
  Confirms fix `968572f` (the cluster-2 override that broke the seam is reverted).
- **ChatMessage / TreeItem / FieldGroup renames** - PASS. Each renders with its
  `data-slot` (`chat-message` + `data-role`, `tree-item`, `field-group` + nested
  `field-grid`); no console errors.
- **TreeItem slot override** - FIXED. `tree-item` rides the content region; `TreeIndent`
  retains `tree-indent` (`b57bf92`).

## Deferred (honest)

- **Editor Popover non-focus** - NOT YET browser-verified. The `registry` app does not
  depend on `@zeroxsolutions/editor`, so the bubble/slash caret-menu focus assertion needs
  an editor-app e2e (none exists yet). `initialFocus={false}` is Base UI's documented
  non-focus mechanism and the editor's `onMouseDown preventDefault` selection-keeping is
  unchanged; editor unit tests cover the jsdom-expressible behavior. Carry this assertion
  into an editor-app e2e when one is added.
- **Composable-into-block sample regions** - NOT built here; the registry preview pages
  added (`/preview/split-button`, `/menu-button`, `/chat-message`, `/tree`, `/field-group`)
  are minimal seeds, to be upgraded to full doc pages by `build-registry-foundation`.

## Breaking changes (pending release)

Four public subpath renames - a **major** bump per package on the next release (decided in
cluster 5: single major per package, via `nx release`):
- `@zeroxsolutions/ui`: `components/chat/chat-message-shell` -> `chat-message`;
  `components/tree-row` -> `tree-indent`; `components/layouts/field-row` -> `field-group`.
- `@zeroxsolutions/icons`: `ai-provider-config` -> `ai-provider-mappings`.

In-repo consumers are updated; external consumers must update import paths.
