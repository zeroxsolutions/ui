# Spec (c4): a docs page for every component

Date: 2026-10-01. Follows spec (c3) (`2026-10-01-logo-home-and-carry-over-design.md`). The rules of
spec (c2) (`2026-09-30-rebuild-on-nova-design.md`, rules 1-7) hold for every page and example this
spec adds. Motion is spec (c5), which comes after this one and uses these pages to show it.

## Why

The registry publishes 42 components, and the site has a page for one of them, Status Indicator. The
other 41 are listed by name on the components index and in the home page's grid, with no link and no
way to read how to install or compose them.

## The pages

Every `registry:component` in `registry.json` gets one page at `content/docs/components/<name>.mdx`:

| Kind         | Items                                                                                                                                                                                                 |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Data display | ai-provider-card, chat-message, code-block, data-table, data-table-column-header, file-tree, file-type-icon, font-preview, highlighted-code, image-preview, markdown-view, model-info-card, tree-item |
| Data entry   | avatar-picker, chat-suggestion-item, emoji-appearance-toggle-group, emoji-picker, frontmatter-form, language-combobox, language-toggle-group, number-field, password-input, resize-handle, tag-input  |
| Feedback     | copy-button, permission-card, status-indicator (exists), tool-call-card, unsaved-indicator                                                                                                            |
| General      | icon-label, icon-media                                                                                                                                                                                |
| Layout       | center, collapsible-card, floating-toolbar, model-list, page-container, panel-field-group, panel-header, panel-row, reasoning-collapsible                                                             |
| Navigation   | command-menu, editor-tab                                                                                                                                                                              |

`components/meta.json` groups the sidebar by these six kinds, which are the folders the items live
in, with the pages of a group in name order. Data Table and Data Table Column Header link to each
other, because the table's demo composes the header.

## A page's shape

The page follows upstream shadcn's component pages (`apps/v4/content/docs/components/base/*.mdx`),
written by hand as upstream writes them. Nothing on a page is generated. Its headings are sentence
case (`API reference`, not upstream's `API Reference`), as every heading on this site is.

```
---
title, description            the item's title and description in registry.json
---
<ComponentPreview name="<item>-demo" />
## Installation               CodeTabs with Command and Manual
## Usage                      the import, then the smallest composition that works
## Composition                a text tree of how the parts nest; only for a family of two or more parts
## <a feature or a state>     only where the demo cannot show it; one ComponentPreview each
## API reference
### <Part>                    one per exported part
```

**Installation.** The Command tab holds the item's `pnpm dlx shadcn@latest add <url>`. The Manual tab
is a `Steps`:

1. Install the item's `dependencies`, when it has any.
2. `shadcn add` its `registryDependencies`: shadcn's primitives by name, `@lucide-animated` icons by
   their full URL.
3. One `<ComponentSource>` per file the item ships, its `title` the path the CLI writes it to
   (`components/<kind>/<file>.tsx`, `lib/<file>.ts`).
4. Any step only this item needs, such as the `success` and `warning` colours.
5. "Update the import paths to match your project."

**Usage.** The import, then a composition a reader can paste. A sentence says when to use the item
and when another item fits better, where that is not obvious (Status Indicator against Unsaved
Indicator). The item's root docblock already holds a composition example, and the page starts
from it.

**A feature section** is added only for a state a reader needs and the demo does not show, such as a
disabled or invalid state the demo never reaches. Each one is a new `registry:example` with its own entry in
`registry.json`. A demo that already shows every state gets none, as c3 settled for Status Indicator.

**API reference.** One `### <Part>` for each part the file exports, in export order:

- A part with props of its own gets a `| Prop | Type | Default |` table, written from its
  `<Part>Props` interface, as upstream does for Button and Sidebar.
- A part that only takes an element's or a primitive's props says so in one line ("Renders a `span`
  and takes every prop a `span` takes"), with a link to shadcn's or Base UI's page for a primitive,
  as upstream does for Select.
- Each part lists the `data-*` it sets and what they mean, as Status Indicator's page does.

The Status Indicator page moves to this shape too.

## Keeping hand-written pages true

Each check below compares what a page says with a list the registry or the source owns, so a page
goes red the day its item changes rather than drifting. `src/lib/source.spec.ts` holds them, reading
`registry.json` and the item's source file:

- Every `registry:component` has a page, and every component page is a registry item.
- The page's `title` and `description` equal the item's.
- The Command tab's command installs the item by its URL.
- The Manual tab has one `<ComponentSource>` per file of the item, each titled with the path the CLI
  writes it to, and its install command names exactly the item's `dependencies`.
- The `###` headings under API reference are exactly the parts in the file's `export { }`, in order.
- Every prop in a part's table is a member of that part's `<Part>Props` interface, read from the
  source. A part whose props cannot be read this way is listed in `source.spec.ts` with the reason.

The prose (Usage, the notes, Composition) has no check; review holds it.

## Order of work

1. The checks first, red for the 41 missing pages; `meta.json` regrouped; the Status Indicator page
   moved to the new shape.
2. One task per kind, each writing that kind's pages until its checks pass: Data display, Data
   entry, Feedback, General with Layout, Navigation.

## Verification

- The unit gate, the build, `wrangler:build` and `shadcn build` pass.
- The e2e suite passes, and it adds one case: every component page, taken from `registry.json`,
  renders its preview, has no sideways scroll at 390 wide and logs no error.
- Screenshots of Data Table, Tag Input and Permission Card at 1440 and 390 wide, light and dark, go
  in the final report.

## Out of scope

- Motion (spec c5).
- Rewriting a demo that is correct.
- Pages for shadcn's primitives; a page links to shadcn's.
- The deploy.
