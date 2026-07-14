## 1. Add the collapse affordance to the block

- [x] 1.1 Import `DisclosureContent` and `DisclosureTrigger` from the design system's `disclosure` module into the Mermaid block node view.
- [x] 1.2 Add `DisclosureTrigger` (the chevron) to `DisclosureActions`, after the copy control, so copy + chevron form a paired icon-action group beside the View/Edit tabs.
- [x] 1.3 Drop the copy control to `size="icon-sm"` (32px) so it pairs with the 32px chevron; leave the `TabsList` at its 36px segmented-control height.
- [x] 1.4 Wrap the body (the `Separator` + both `TabsContent` panels) in `DisclosureContent` so the divider folds with the body.

## 2. Make collapse crash-safe over the SVG

- [x] 2.1 Set `keepMounted` on the `DisclosureContent` so the collapsed panel is hidden, not unmounted, keeping the diagram's `dangerouslySetInnerHTML` node mounted.
- [x] 2.2 Replace the stale "never collapses" comment with a load-bearing comment explaining why `keepMounted` is required (avoids the `removeChild` crash).

## 3. Validation

- [x] 3.1 `pnpm nx run-many -t build test -p @zeroxsolutions/editor` is green.
- [x] 3.2 Rebuild storybook after clearing `apps/storybook/node_modules/.cache/storybook`, then in a real headless browser: collapse/expand the block repeatedly while the diagram shows, switch View/Edit and collapse/expand again — assert zero page errors (no `removeChild`) and that the diagram remains rendered.
- [x] 3.3 Measure the header controls in-browser: View/Edit tabs 36px, copy 32px, collapse chevron 32px.
- [x] 3.4 Confirm the read-only viewer path renders no header and no collapse control, and that the ` ```mermaid ` codec round-trip is unchanged.
