# Composed components: kind folders, families and slots

## Goal

Every composed component under `apps/registry-ui/registry/bases/base-ui/` sits in the folder
its root's kind names, is one family per file, takes its content as children through slots
that follow upstream's own composition, and carries its classes in recipes. Nothing is
published and nothing consumes the registry yet, so no path, item name or export is kept for
compatibility.

Success is the gate green and every check under **Checks** printing nothing.

## Scope

In: `components/` (except `components/docs/`), the four `ui/data-table*.tsx` files,
`ui/form.tsx`, and the imports and `registry.json` paths that point at them.

Out, each with its own spec later: registry items, their names, categories, examples and
`cssVars` (b); `components/docs/` and the docs pages (c); `editor/` internals (d). This spec
touches `editor/` only where an import moves or a component it renders changes its props, in
the same commit as that change.

Primitives in `ui/` stay exactly as `shadcn add` wrote them.

## Target tree

Kind is decided by the root's own body, first match in this order: data-entry (holds a
control whose value the app takes), navigation (moving the user is its purpose), feedback
(reports a state the user cannot see), data-display (renders data the app holds), layout
(arranges other components, adds no content), general (an atom clicked or read).

```
registry/bases/base-ui/
|-- components/
|   |-- data-entry/
|   |   |-- chat-suggestion-item.tsx         picking a prompt hands it to the app
|   |   |-- emoji-appearance-toggle-group.tsx
|   |   |-- emoji-picker.tsx
|   |   |-- language-combobox.tsx            locales and code languages both
|   |   |-- language-toggle-group.tsx
|   |   |-- number-field.tsx
|   |   |-- password-input.tsx
|   |   |-- resize-handle.tsx                onDrag(dx) hands the new size to the app
|   |   |-- tag-input.tsx
|   |   `-- tree-item.tsx                    rename input
|   |-- navigation/
|   |   `-- command-menu.tsx                 jumps to a target
|   |-- feedback/
|   |   |-- copy-button.tsx                  the check icon reports the copy
|   |   |-- permission-card.tsx
|   |   |-- status-indicator.tsx
|   |   |-- tab-close-button.tsx             the unsaved dot
|   |   `-- unsaved-indicator.tsx
|   |-- data-display/
|   |   |-- ai-provider-card.tsx
|   |   |-- chat-message.tsx                 the streaming accent decorates text already visible
|   |   |-- code-block.tsx
|   |   |-- data-table.tsx                   four ui/data-table*.tsx files merged
|   |   |-- file-type-icon.tsx
|   |   |-- font-preview.tsx
|   |   |-- highlighted-code.tsx
|   |   |-- image-preview.tsx
|   |   |-- markdown-view.tsx
|   |   `-- model-info-card.tsx
|   |-- layout/
|   |   |-- avatar-picker.tsx                root is Popover{children}
|   |   |-- center.tsx
|   |   |-- collapsible-card.tsx
|   |   |-- file-tree.tsx                    ul role=tree{children}
|   |   |-- floating-toolbar.tsx
|   |   |-- frontmatter-form.tsx
|   |   |-- model-list.tsx                   model-list-item and model-list-skeleton merged
|   |   |-- page-container.tsx
|   |   |-- panel-field-group.tsx
|   |   |-- panel-header.tsx
|   |   |-- panel-row.tsx
|   |   |-- reasoning-collapsible.tsx
|   |   `-- tool-call-card.tsx
|   `-- general/
|       |-- icon-chip.tsx
|       |-- icon-label.tsx
|       `-- panel-field-label.tsx
|-- hooks/use-controllable-state.ts
|-- hooks/use-highlighted-lines.ts
|-- hooks/use-language-options.ts            both language roots read it
|-- lib/code-language.ts                     isPlainLanguage, languageLabel
|-- lib/file-type.ts                         extensionOf, the extension map, fileTypeIcon
|-- lib/font-format.ts                       formatOf
|-- lib/language-options.tsx                 the code-language table and aliases, the option builders
|-- types/language-option.ts                 LanguageKind, LanguageOption, LanguageIcon
`-- types/status-tone.ts                     StatusIndicator and AiProviderCard both read it
```

There is no `constants/`: each fixed table has one reader, and a value enters `constants/`
only at its second, so the code-language table stays in `lib/language-options.tsx` and the
avatar colours in `avatar-picker.tsx`. The chat prop types (`ChatRole`, the agent identity,
`ChatSuggestion`) go with the prop bags that declared them: once content arrives as children
nothing imports them.

````

`ui/` ends holding only files `shadcn add` wrote: `ui/data-table*.tsx` move out and
`ui/form.tsx` is deleted, since no upstream base-vega item publishes it and nothing imports
it.

`data-table` goes to `data-display/` although its root renders only `<div>{children}`, which
reads as layout: the house example of a kind folder places `data-table.tsx` in
`data-display/`, and a table's purpose is rendering rows.

## Removed components

Each only re-assembles upstream parts. The consumer composes the upstream parts directly;
spec (b) publishes that composition as an example.

| Removed                                             | Composed from                                                                                                                                   |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `ConfirmButton`                                     | `AlertDialog`, `AlertDialogTrigger render={<Button />}`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogAction`, `AlertDialogCancel` |
| `PopoverIconButton`                                 | `Popover`, `PopoverTrigger`, `PopoverContent`, `Tooltip`, `TooltipTrigger`, `TooltipContent`, `Button`                                          |
| `ToolbarButton`                                     | `Toggle` (`aria-pressed`), `Tooltip`, `Kbd`                                                                                                     |
| `SearchInput`                                       | `InputGroup`, `InputGroupAddon`, `InputGroupInput`                                                                                              |
| `BinaryFileCard`                                    | `Empty`, `EmptyHeader`, `EmptyMedia`, `EmptyTitle`                                                                                              |
| `MenuButton`, `SplitButton`                         | `ButtonGroup`, `Button`, `DropdownMenu*`; the one remaining class, `w-auto` on the content, is a `className`                                    |
| `SidebarGroupCollapsible`, `SidebarMenuCollapsible` | `Collapsible` with `SidebarGroupLabel` or `SidebarMenuButton`, as upstream's Sidebar docs compose it                                            |
| `Section`                                           | `CollapsibleCard variant="plain"` plus `Badge`                                                                                                  |

`ConfirmButton` never closed its dialog after `onConfirm` (`confirm-button.tsx:77-80`,
upstream's `AlertDialogAction` is a plain `Button`). The upstream composition closes through
`AlertDialogClose` or the caller's `open`, so the defect leaves with the component.

Their published items (`split-button`, `menu-button`) go, and their examples
(`split-button-hero`, `menu-button-hero`) are rewritten to compose upstream parts, in the
commit that removes them, so `shadcn build` keeps passing.

## Families

A family keeps a part only where the part adds behaviour or a recipe. A slot that would only
rename an upstream part is left to the upstream part. State that parts style off sits on a
`data-*` attribute of the root.

| Family (was)                                                                                                            | Parts kept                                                                     | Upstream slots the consumer composes                                    | New or reshaped                                                                                             | State                                      |
| ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `AiProviderCard`                                                                                                        | root, `Description` (line clamp), `Action` (stops the click reaching the card) | `CardHeader`, `CardTitle`, `CardFooter`                                 | selection through a covering trigger, as `AttachmentTrigger` does, so the card is reachable by keyboard     | `data-status` replaces `STATUS_TONE_CLASS` |
| `ModelInfoCard`                                                                                                         | root, `Section`                                                                | `Item`, `ItemMedia`, `ItemTitle`, `ItemDescription` for the header      | `Badge` (the accent pill)                                                                                   | -                                          |
| `ModelList` (+ `ModelListItem`, `ModelListSkeleton`)                                                                    | root, `Content`, `Skeleton`                                                    | `ItemGroup`, `Item*` (the item root goes)                               | `Header`, `Title`, `Action`, `ItemRemove`                                                                   | `data-unavailable` on `Item`               |
| `ChatSuggestionItem` (`ChatEmptyState`)                                                                                 | the suggestion button                                                          | `Empty`, `EmptyMedia`, `EmptyTitle`, `EmptyDescription`, `EmptyContent` | -                                                                                                           | -                                          |
| `ChatMessage`                                                                                                           | a thin root carrying the streaming accent                                      | `Message`, `MessageHeader`, `Bubble`, `BubbleContent`                   | -                                                                                                           | `data-streaming`                           |
| `ToolCallCard` (`Tool`)                                                                                                 | root, `Content`                                                                | -                                                                       | `Trigger`, `Title`, `Description`, `Status`, `Section`, `SectionTitle`; `ToolInput` and `ToolOutput` go     | `data-state`                               |
| `ReasoningCollapsible` (`Reasoning`)                                                                                    | root (stream timing), `Trigger`                                                | -                                                                       | `Content` takes a node, the consumer places `MarkdownView`; copy leaves the component                       | `data-streaming`                           |
| `CollapsibleCard` (`Disclosure`)                                                                                        | all six parts                                                                  | built on `ui/collapsible` rather than the Base UI primitive             | variant `plain`                                                                                             | -                                          |
| `CodeBlock`                                                                                                             | root (highlight, copy)                                                         | -                                                                       | header split into parts over `CollapsibleCard`; `HighlightedCode` its own file                              | -                                          |
| `PermissionCard` (`Permission`)                                                                                         | root, `Header`, `Title`, `Actions`, `Resolved`                                 | `CardDescription` replaces `Description`; `Preview` goes                | `Status` reads the root's `data-status`                                                                     | `data-status`                              |
| `CommandMenu` (`CommandSwitcher`)                                                                                       | root, `Item`                                                                   | -                                                                       | -                                                                                                           | -                                          |
| `FrontmatterForm` (`FrontmatterEditor`, `FrontmatterField*`)                                                            | root, `Field`, `FieldLabel`, `FieldControl`, `FieldError`                      | `FieldDescription`                                                      | -                                                                                                           | -                                          |
| `LanguageCombobox`, `LanguageToggleGroup` (`LanguageSwitcher`)                                                          | `useLanguageOptions`                                                           | `Combobox*`, `ToggleGroup*`                                             | the display modes become two roots; the `trigger` render prop becomes a child                               | -                                          |
| `EmojiPicker`                                                                                                           | root, `Search`, `GroupLabel`, `Content`, `Nav`                                 | `Empty` replaces `EmojiPickerEmpty`                                     | `EmojiGrid`, `EmojiCell` become `Grid`, `Cell`; one source for the size                                     | -                                          |
| `EmojiAppearanceToggleGroup` (`EmojiAppearance`)                                                                        | root                                                                           | -                                                                       | `Item`                                                                                                      | -                                          |
| `AvatarPicker` (`AvatarEditor`)                                                                                         | root, `Trigger`, `Content`, `Remove`, `Emoji`, `Upload`, `Color`               | `Tabs*`                                                                 | tabs declared by the consumer instead of found by scanning children; `AvatarPickerValue`, `AvatarPickerTab` | `data-uploading`                           |
| `NumberField`                                                                                                           | root (parse, clamp, keys)                                                      | `InputGroupAddon`, `InputGroupText`                                     | `Input`                                                                                                     | `data-mixed`, `data-editing`               |
| `TreeItem` (+ `TreeIndent`)                                                                                             | root (the row)                                                                 | `ItemMedia`, `ItemTitle`, `ItemActions`, `ContextMenu*`                 | `Indent`, `Label`, `RenameInput`                                                                            | `data-expanded`, `data-editing`            |
| `DataTable` (4 files)                                                                                                   | root, `Toolbar`, `View`, `ColumnHeader*`, `Pagination`, `ViewOptions`          | -                                                                       | `Empty`                                                                                                     | -                                          |
| `PanelHeader`                                                                                                           | all four parts, on `ComponentProps`                                            | a border class replaces the `<Separator />`                             | -                                                                                                           | -                                          |
| `PanelRow` (`FieldGroup`)                                                                                               | root, `Action`                                                                 | -                                                                       | -                                                                                                           | -                                          |
| `PanelFieldGroup` (`FieldGrid`)                                                                                         | root                                                                           | -                                                                       | columns through a `--cols` variable                                                                         | -                                          |
| `PanelFieldLabel` (`LabeledControl`)                                                                                    | the label recipe                                                               | `Field` replaces the root                                               | -                                                                                                           | -                                          |
| `IconChip`, `IconLabel`                                                                                                 | the chip or label element                                                      | `Tooltip*`, composed by the consumer                                    | -                                                                                                           | -                                          |
| `StatusIndicator` (`StatusDot`)                                                                                         | root                                                                           | -                                                                       | -                                                                                                           | `data-tone`, `data-pulse`                  |
| `UnsavedIndicator` (`DirtyDot`)                                                                                         | root, with a role for its label                                                | -                                                                       | -                                                                                                           | -                                          |
| `TabCloseButton`                                                                                                        | root                                                                           | -                                                                       | `revealClose` becomes `group-hover`                                                                         | `data-dirty`                               |
| `CopyButton`, `PasswordInput`                                                                                           | root                                                                           | -                                                                       | -                                                                                                           | `data-copied`, `data-visible`              |
| `MarkdownView`, `ImagePreview`, `FontPreview`, `FileTypeIcon`                                                           | root                                                                           | -                                                                       | classes held in module constants move to a recipe or an `@utility`; helpers move to `lib/`                  | -                                          |
| `PageContainer` (`Container`), `Center`, `FileTree*`, `TagInput`, `ResizeHandle`, `FloatingToolbar`, `AiProviderPicker` | unchanged but for the rules every family takes                                 | -                                                                       | `FloatingToolbar` drops `label`, which duplicated `aria-label`                                              | -                                          |

A part name is `<Root><Slot>`; the table writes only the slot.

Every family, whether listed or not: plain `function` declarations with one `export { }` at
the foot; each part takes its element's props and spreads what it was not asked for, after
its own handlers are composed rather than overwritten; each part carries `data-slot`.

Three deviations stay, each written at its line:

- `FileTree` keeps a name with no upstream shape: nothing upstream names a hierarchy.
- `Center` keeps a name with no subject: it is a layout atom whose identity is the centring.
- `FileTree` and `TreeItem` stay two trees. They resemble each other; nothing yet shows they
  change together.

## Defects fixed on the way

- `DataTableColumnHeaderSortAscending`, `...SortDescending` and `...Hide` spread the caller's
  props before their own `onClick` (`ui/data-table-column-header.tsx:92,106,120`), so a
  caller's `onClick` was dropped. The part composes both.
- `AiProviderCard` selects on a `div` click with no role, focus or key handler
  (`ai-provider-card.tsx:62-65`). Selection moves to a covering trigger.
- The house `FieldGroup` took upstream's name and `data-slot="field-group"`, so upstream's
  `group/field-group` selectors (`ui/field.tsx:44,61`) matched it. It becomes `PanelRow`.

Each gets a spec that fails before the fix.

## Order

Pass 1 moves files and nothing else, by a script that replaces exact import strings and
asserts each file's count before writing: the kind folders, the merged families
(`data-table*`, `model-list*`, `tree-item` with `tree-indent`), `ui/form.tsx` deleted, the
`registry.json` paths. Specs move with their modules. Two commits, gate green on each: the
moves into kind folders, then the merged families.

Pass 2 starts with three mechanical rules, one commit each:

1. the removed components, their items and examples rewritten onto upstream parts
2. renames, by script
3. export blocks at the foot

Then types, lib and hooks move out of component files in one commit, and every family after
that is one commit that takes it through the remaining rules at once: slots (content props
become children, parts reshaped per the table), state onto `data-*`, class strings out of
module constants with `cva` only where a variant exists and arbitrary values onto the scale,
and spread plus `data-slot` on every part. A defect is fixed test-first in its family's
commit. Last, one commit folds what crosses families and adds the check scripts.

A commit per family rather than per rule keeps each family's reshape, its spec and its call
sites reviewable together; a rule-wide commit would reopen every family file once per rule.
Pass 1 and rules 1 to 3 are one plan; the rest is a second, written once the first landed,
since its edits are read off the renamed tree.

A commit that changes a component `editor/` renders changes that call site in the same
commit.

## Checks

Run from `apps/registry-ui/registry/bases/base-ui/`. Each prints nothing when its rule
holds.

```sh
# kind folders only
find components -mindepth 1 -maxdepth 1 -type d ! -name docs ! -name data-entry \
  ! -name navigation ! -name feedback ! -name data-display ! -name layout ! -name general
# no loose component files
find components -maxdepth 1 -type f
# no inline exports
grep -rlnE '^export (function|const [A-Z])' components --include='*.tsx' | grep -v /docs/
# no class string in a module constant
grep -rnE "^(export )?const [A-Z_]+ = ['\"\`\[]" components --include='*.tsx' | grep -v /docs/
# no arbitrary px or rem where the scale has a step
grep -rnoE '[a-z-]+-\[[0-9.]+(px|rem)\]' components --include='*.tsx' | grep -v /docs/
# no content prop
grep -rnE '^\s+(title|description|heading|subtitle|emptyText)\??: (string|React\.ReactNode|ReactNode);' \
  components --include='*.tsx' | grep -v /docs/
````

Three checks need a script rather than a grep and are part of the plan: every exported name
opens with its file's root; every part both spreads its props and carries `data-slot` (a part
that renders no element of its own, a context root or a control it clones, has neither to
carry, and a part wrapping an upstream part keeps the upstream `data-slot` that upstream's
recipes select on); and every registry item declares what its files import.
`ui/` holding only CLI output is checked by `shadcn add <item> --dry-run --diff` reporting no
change for each file there.

Then the gate, `shadcn build`, and `shadcn registry validate registry.json`.

## Not covered

The checks read names and shapes, not behaviour. Behaviour is held by the specs that move
with each module and by the specs added for the three defects and for each state moved onto
`data-*`. No check covers visual appearance; the docs site that would show it is spec (c).
