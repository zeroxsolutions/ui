# Registry items: one item per composed family, one demo per item

## Goal

`apps/registry-ui/registry.json` publishes every composed family the refactor of
`2026-09-28-composed-components-design.md` left in `components/`, plus the one block, each
named after its file, described by its current API, declaring exactly what its files import
and carrying the theme tokens it paints with. Every item has one published demo. A test in
the gate holds all of that. Nothing is published and nothing consumes the registry yet, so no
item name is kept for compatibility.

Success is the gate green with `registry.spec.ts` in it, and `shadcn build` plus
`shadcn registry validate registry.json` passing.

## Scope

In: `registry.json`, `examples/`, `pages/demo-page.tsx`, the import of an example in
`src/app/page.tsx`, and the new `registry.spec.ts` and `examples/examples.spec.tsx`.

Out: the MDX pages, `meta.json`, sidebar, table of contents, pager, header and footer, and the
choice to build them on `fumadocs-mdx` and `fumadocs-core` as upstream's `apps/v4` does (spec
(c)); variant demos, which each page adds when it is written (spec (c)); `editor/` (spec (d));
any change to a component's code.

Paths are relative to `apps/registry-ui/registry/bases/base-ui/` unless they start with
`apps/` or `src/`.

## Items

One `registry:component` item per family file under `components/`, 42 of them, and one
`registry:block`, `ai-provider-picker`.

| Field                  | Value                                                                                                                                                                                                |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`                 | the family file's basename: `status-indicator`, `panel-row`, `panel-field-group`                                                                                                                     |
| `title`                | the root's name in words: `Status Indicator`                                                                                                                                                         |
| `description`          | one sentence saying what the root does under its current API; no removed prop or part is named                                                                                                       |
| `categories`           | the kind folder: `data-display`, `data-entry`, `feedback`, `general`, `layout`, `navigation`; `blocks` for the block                                                                                 |
| `files`                | the family file (`registry:component`, or `registry:block`), then every `lib/`, `hooks/` and `types/` file it imports, transitively, as `registry:lib` or `registry:hook`, without `target`          |
| `registryDependencies` | `@shadcn/<x>` for each `ui/<x>` imported, `@shadcn/utils` for `cn`, `https://ui.zeroxsolutions.com/r/<name>.json` for another item, `https://lucide-animated.com/r/<icon>.json` for an animated icon |
| `dependencies`         | each npm package imported, other than `react`                                                                                                                                                        |
| `cssVars`              | only on an item whose files paint with a house token (below)                                                                                                                                         |

Renamed items: `status-dot` is `status-indicator`, `field-grid` is `panel-field-group`,
`field-group` is `panel-row`. `demo-page` is deleted with `pages/demo-page.tsx` and
`demo-page-hero`: it only illustrated what a page item is, and no app installs it.

### Theme tokens

`styles.css` maps `--color-success` and `--color-warning` onto `--success` and `--warning`.
Upstream's `neutral` theme declares neither (`https://ui.shadcn.com/r/themes/neutral.json`,
read 2026-09-29), so an item painting with `success` or `warning` (on
2026-09-29: `status-indicator`, `ai-provider-card`, `permission-card`, `tool-call-card`)
carries them:

| `cssVars` key | Variables                        | Values                             |
| ------------- | -------------------------------- | ---------------------------------- |
| `theme`       | `color-success`, `color-warning` | `var(--success)`, `var(--warning)` |
| `light`       | `success`, `warning`             | `styles.css`'s `:root` values      |
| `dark`        | `success`, `warning`             | `styles.css`'s `.dark` values      |

An item carries only the tokens its files use. `--info` has no reader and ships nowhere.

## Examples

`examples/` stays flat, as upstream's `apps/v4/examples/base/` is: `<name>-demo.tsx` and
`<name>-<variant>.tsx`.

**Published.** Each item has exactly one `examples/<name>-demo.tsx`, published as the
`registry:example` item `<name>-demo`, whose `registryDependencies` name the item's URL plus
each upstream part the demo composes. The demo is the preview at the top of the item's page.
Existing examples are renamed to it: `chat-message-hero` to `chat-message-demo`, `tree-hero` to
`tree-item-demo`, `field-group-hero` to `panel-row-demo`, `ai-provider-picker-hero` to
`ai-provider-picker-demo`. The other 39 are written.

**Docs only.** A demo of an upstream primitive is not an item, because the registry publishes
composed items only; it is a file in `examples/` that no `registry.json` entry names. The
Button examples leave the registry and take upstream's names: `button-hero` is `button-demo`,
and `button-default`, `button-secondary`, `button-outline`, `button-destructive`,
`button-ghost` are `button-<variant>`. The compositions that replaced the removed components
are docs-only demos on the page of the part they are built from:

| Removed                   | Demo                                                                      |
| ------------------------- | ------------------------------------------------------------------------- |
| `ConfirmButton`           | `alert-dialog-confirm`                                                    |
| `PopoverIconButton`       | `popover-icon-trigger`                                                    |
| `ToolbarButton`           | `toggle-toolbar`                                                          |
| `SearchInput`             | `input-group-search`                                                      |
| `BinaryFileCard`          | `empty-file`                                                              |
| `SplitButton`             | `button-group-split` (was `split-button-hero`)                            |
| `MenuButton`              | `button-group-menu` (was `menu-button-hero`)                              |
| `SidebarGroupCollapsible` | `sidebar-group-collapsible`                                               |
| `SidebarMenuCollapsible`  | `sidebar-menu-collapsible`                                                |
| `Section`                 | `collapsible-card-section`, a variant demo of the `collapsible-card` item |

Each composes exactly the parts the removed-components table of the 2026-09-28 spec names.

`src/app/page.tsx` imports `ButtonHero`; the import follows the rename in the same commit.

## Tests

`examples/examples.spec.tsx` renders every file in `examples/` once and asserts the
`data-slot` of the component it demonstrates is in the document. It replaces
`split-button-hero.spec.tsx` and `menu-button-hero.spec.tsx`.

`apps/registry-ui/registry.spec.ts` reads `registry.json` and the source tree and asserts:

1. every family file under `components/` and `blocks/` is the first file of exactly one item,
   and every component or block item's first file is one; `name` is the file's basename and
   `categories` its kind folder;
2. every component or block item has exactly one `<name>-demo` example, and every
   `registry:example` is some item's demo;
3. each item's `files`, `registryDependencies` and `dependencies` equal what its files import;
4. an item whose files use a `success` or `warning` class carries the matching `cssVars`, and
   no other item carries them.

Each rule has a case that feeds it a deliberately wrong `registry.json` fragment and expects
the failure, so a rule that cannot fail is caught. The three uncommitted scripts of plan B are
the reference for rules 1 and 3; the family-name and part-shape scripts check components, not
the registry, and stay out.

## Not covered

No check runs `shadcn add` against the published items: their URLs point at
`https://ui.zeroxsolutions.com`, which does not resolve yet. No check covers how a demo looks.
