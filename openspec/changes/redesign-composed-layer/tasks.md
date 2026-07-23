## 1. Foundation cluster (editor surface + cn-everywhere)

- [x] 1.1 Write the foundation mini-proposal: confirm `FloatingShell` folds into the `Popover` primitive (Base UI `Popover.Positioner` accepts a virtual-element `anchor` + `side` + collision handling - exactly what `FloatingShell` hand-rolls), and list the editor chrome menus that consume it. -> `clusters/01-foundation.md`
- [x] 1.2 Replace `FloatingShell` with the `ui/popover` primitive across `bubble-menu`, `slash-menu`, `trigger-menu`, `editor-toolbar`; verify the caret menus' non-focus requirement against Popover options (or document the gap); update the `editor-ui-composition` reference. This deletes both the bespoke surface and the `shadow-sm`/`shadow-md` drift in one move. -> Popover fold via `rectAnchor(rect)` virtual anchor + `initialFocus={false}`; non-focus mechanism set (Base UI documented), real-browser focus check deferred to validation 6.x; `floating-shell.tsx` deleted; surface drift deleted.
- [x] 1.3 Replace the 9 editor hand-join holdouts with `cn()` (`document/react/viewer.tsx`, `document/react/editor.tsx`, `document/ui/editor-toolbar.tsx`, `document/ui/slash-menu.tsx`, `composer/chat-message-view.tsx`, `composer/chat-input.tsx`, `composer/triggers/trigger-menu.tsx`, `composer/triggers/inline-token.tsx`). -> all swapped.
- [x] 1.4 Rename the 5 bespoke editor attributes to `data-slot="<kebab>"`, splitting identity from state where fused (`bubble-menu`, `slash-menu`, `block-menu`, `editor-toolbar`; `trigger-menu` -> `data-slot="trigger-menu"` + `data-token-kind={kind}`); migrate every selector (CSS, `.spec.tsx`, engine) in the same cluster. -> all renamed; `chrome.spec.tsx` + `trigger-menu.spec.tsx` selectors migrated, queries read `document.body` (Popover portal).
- [x] 1.5 Confirm the `cn()`-everywhere requirement is in the `ui-composition-defaults` delta and validates `--strict`; prove green: `nx run-many -t lint build test`; grep `.filter(Boolean).join` and the 5 `data-*-menu`/`data-editor-toolbar` attributes in authored code returns zero. -> green (6 projects, 243/243 editor tests); both greps zero; no `*Shell` file in editor.

## 2. ui composed cluster - data-slot + naming + variants

- [ ] 2.1 mini-proposal; add the missing `data-slot="<kebab>"` across the audited roots/parts: `tree-row`, `tree-item`, `icon-label`, `resize-handle`, `menu-button` (+ `-content`/`-menu`/`-radio-group`/`-radio-item`), `split-button` (+ `-content`/`-menu`/`-item`), `emoji-appearance`, `emoji-picker` parts, `avatar-editor` parts, `container`, `field-grid`, `field-row`, `floating-toolbar`, `panel-header` (+ `-row`/`-title`/`-actions`), `section`.
- [ ] 2.2 Naming: rename `ChatMessageShell` -> `ChatMessage` (wrapper, not a shell; file `chat-message.tsx`); rename `TreeRow` (indent+chevron, not an Item twin) and review `FieldRow` - drop the `*Row` token; stamp `data-slot="chat-message"` and keep `data-role` as state.
- [ ] 2.3 Convert the inline-export files to plain declarations + one trailing `export { ... }` (house style): `avatar-editor.tsx`, `file-tree.tsx`, `emoji-picker.tsx`.
- [ ] 2.4 Variants: export `emojiPickerContentVariants` and `containerVariants` alongside their components; replace the `toggle.tsx` template-literal ternaries with `cn()`; confirm every authored component with variants uses `cva` + exports `<Component>Variants`.
- [ ] 2.5 Open the closed `ResizeHandleProps`: extend `React.ComponentProps<'div'>`, forward `className` through `cn()`; fix `ai-provider-icon.tsx` hardcoded `#000` -> a token.
- [ ] 2.6 Prove composable-into-block per cluster (sample region in the `registry` app, no component edit, real-browser check); green gate.

## 3. icons + fluent-emoji cluster

- [ ] 3.1 mini-proposal; rename utility modules to match their primary export (kebab): `ai-provider-config.ts` -> `ai-provider-mappings.ts`, `codepoint.ts` -> `emoji-to-unicode.ts`, `style-context.tsx` -> `fluent-emoji-style-provider.tsx`, `resolve.ts` -> `fluent-emoji-url.ts`, `emoji-data.ts` -> `emoji-categories.ts`.
- [ ] 3.2 Walk resolvers/Provider/setters against the philosophy checklist; confirm the icon-source rule holds; green gate.

## 4. Compound-spec deltas (per-cluster trigger)

- [ ] 4.1 Track the six candidate compound specs (`ui-menu-button`, `ui-split-button`, `ui-permission`, `model-list`, `model-info-card`, `ai-provider-card`); add a delta only where a cluster changes a requirement (e.g. a `data-slot` obligation or a part rename). Note: `model-list`'s three files are independent compositions, NOT a compound split - no merge required.
- [ ] 4.2 Validate every added compound delta `--strict` before its cluster merges.

## 5. Breaking-rename + release bookkeeping

- [ ] 5.1 For each cluster that renames a public subpath (`chat-message-shell` -> `chat-message`, `tree-row`, the icon/fluent-emoji module renames), update in-repo consumers in the same commit and record the rename in the cluster's mini-proposal.
- [ ] 5.2 Decide the versioning cadence (per-cluster major vs a final surface-freeze cluster) once the first breaking rename lands; carry the major bump via `nx release` with a migration note.

## 6. Validation

- [ ] 6.1 Migration completeness: `grep -rn "\.filter(Boolean)\.join" packages/*/src` returns zero; `grep -rn "data-(bubble|slash|trigger|block)-menu\|data-editor-toolbar" packages/*/src` returns zero; no bespoke `*Shell` component remains; no `*Row` token remains (except any justified, documented case); the floating surface comes from the `Popover` primitive.
- [ ] 6.2 `nx run-many -t lint build test` green across `ui`, `editor`, `icons`, `fluent-emoji`, `registry`, `registry-e2e`.
- [ ] 6.3 `nx e2e @zeroxsolutions/registry-e2e` passes (extended to the composable-into-block sample regions).
- [ ] 6.4 `editor` no-regression: its existing `.spec.tsx` suites pass (updated only where behavior intentionally changed).
- [ ] 6.5 Rule-audit each cluster's staged diff against `.agents/rules/*` before commit; never bypass the husky gate.
