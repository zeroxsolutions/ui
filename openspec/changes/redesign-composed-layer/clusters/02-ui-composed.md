# Cluster 2 - ui composed (mini-proposal)

Scope: the authored composed components in `packages/ui/src/components/{*,chat,layouts}`
(excluding the vendored `components/ui/`). data-slot discipline, the `*Row`/`-shell`
renames, export-style, variants, and the closed `ResizeHandle` API.

## Decisions

### Naming (absolute `*Row` / `-shell` ban, per `design-system-conventions`)

- `ChatMessageShell` -> `ChatMessage` (`chat-message.tsx`). It is a wrapper, not a
  positioning shell; the `-shell` reflex is rejected.
- `TreeRow` -> `TreeIndent` (`tree-indent.tsx`). It is the indent + disclosure skeleton
  for a tree node; `*Row` is banned. (Single in-repo consumer is `TreeItem`; keep it a
  separate reusable file - the doc declares it the shared skeleton for layer/scene/file
  trees.)
- `FieldRow` -> `FieldGroup` (`field-group.tsx`). It composes a `FieldGrid` plus a trailing
  action slot; `*Row` is banned. (Note the name sits beside `FieldGrid` - the group owns
  the grid + action, the grid is just the column layout.)

Each rename updates the file, the symbol, the export, and every in-repo importer
(`tree-item.tsx` for `TreeIndent`; `field-row` consumers for `FieldGroup`; the
`ui-permission` spec reference for `ChatMessage`). Add `data-slot="<kebab>"` on each root
where missing.

### data-slot discipline (audit section 1c - ~25 roots/parts)

Stamp `data-slot="<kebab>"` on every structural root/part that lacks it: `tree-indent`,
`tree-item`, `icon-label`, `resize-handle`, `menu-button` (+ `-content` / `-menu` /
`-radio-group` / `-radio-item`), `split-button` (+ `-content` / `-menu` / `-item`),
`emoji-appearance`, `emoji-picker` parts, `avatar-editor` parts, `container`, `field-grid`,
`field-group`, `floating-toolbar`, `panel-header` (+ `-row` / `-title` / `-actions`),
`section`. (Full per-file list in the audit.) For primitive-delegating parts that currently
surface only the wrapped primitive's slot, add a thin wrapper or a `data-slot` so each
authored part is targetable.

### Export style (audit section 2)

Convert inline `export function`/`export interface` to plain declarations + one trailing
`export { ... }` block (the `card.tsx` / `item.tsx` house style) in: `avatar-editor.tsx`,
`file-tree.tsx`, `emoji-picker.tsx`.

### Variants (audit section 3)

- Export `emojiPickerContentVariants` and `containerVariants` alongside their components
  (siblings like `disclosureVariants` / `buttonVariants` already export theirs).
- Replace the `toggle.tsx` template-literal ternaries with `cn(..., open && 'rotate-90')`
  and `cn('min-w-0 flex-1', open ? 'block' : 'hidden')`.

### Closed API + chrome color (audit section 4b)

- `resize-handle.tsx`: `ResizeHandleProps` extends `React.ComponentProps<'div'>`; forward
  `className` through `cn()`; add `data-slot="resize-handle"`.
- `ai-provider-icon.tsx`: `mark.colorPrimary ?? '#000'` -> a token fallback
  (`'var(--primary)'`).

## Out of scope

The `chat/` and `layouts/` sub-clusters beyond the named files, the icons + fluent-emoji
cluster (cluster 3), compound-spec deltas (cluster 4), and the block/page seed. The
`ChatMessage` rename touches `ui-permission` only via a spec text reference, not a code
dependency.

## Verification

- `nx run-many -t lint build test` green; `editor` (which consumes `ui`) unregressed.
- grep: no `*Shell` component, no `*Row` token, no `data-*-menu`; the renamed files
  (`tree-indent.tsx`, `field-group.tsx`, `chat-message.tsx`) exist and the old names are
  gone.
- Each renamed component still renders (spot-check in the registry app's sample region if
  one exists for it).
