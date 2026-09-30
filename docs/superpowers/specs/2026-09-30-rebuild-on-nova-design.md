# Spec (c2): rebuild the docs site and the composed items on base-nova

Date: 2026-09-30. Follows spec (c) (`2026-09-30-docs-site-design.md`), which shipped the frame.
Spec (c3) - the logo, the home page and its shader - comes after this one and builds on it.

## Why

The user reviewed the shipped frame and rejected its look:

- the composed components and the docs shell do not follow base-nova's design direction;
- scrolling the page drags the sidebar, the content and the TOC together, with a jolt near the footer;
- the code preview and the code blocks are not right;
- the primitive pages should not be there;
- no `@lucide-animated` icon is used anywhere;
- the copy mixes Title Case and sentence case.

Nova is described upstream only as "reduced padding and margins for compact layouts". Its actual
values live in the primitives `shadcn add` writes for `base-nova`, and those are already vendored
here byte for byte. Everything that drifted is code written here that styled itself instead of
taking its look from those primitives.

## The standard

**The base-nova preview on `ui.shadcn.com/create` is the reference for how things look.** Its cards
(`apps/v4/registry/bases/base/blocks/preview*/cards/*.tsx` upstream) are built from primitives as
they come: `Card`, `CardHeader`, `Field`, `FieldGroup`, `Select`, `Button size="icon-sm"`, with
only layout classes beside them (`flex`, `items-baseline`, `justify-between`, `w-full`). That is the
shape every composed item and every shell piece here takes.

**The docs shell follows upstream `apps/v4`** (layout, sidebar, TOC, page header, code preview,
code block, install command), read live from `shadcn-ui/ui@main`, never from memory.

## Rules

Each rule applies to the 42 `registry:component` items, the block, their examples, and every module
under `apps/registry-ui/src/`.

1. **A primitive is used as it comes.** A `className` on a primitive, or on a plain element that
   stands in for one, carries layout only: display, flex and grid placement, width and max-width,
   `min-w-0`, gap between the children it lays out, position, visibility, overflow, and their
   responsive and state variants. It never changes a primitive's height, padding, radius, font
   size, weight or colour. Where a variant or size the primitive already has does the job, the prop
   is used (`size="sm"`, `variant="ghost"`), never a class that imitates it.
2. **Colours are theme tokens.** No palette colour (`emerald-600`, `blue-500`, ...) and no arbitrary
   colour. A status colour the theme lacks becomes a token in `styles.css`, beside the others, with a
   light and a dark value.
3. **No arbitrary values** (`text-[0.85em]`, `h-[30px]`, `top-[calc(...)]`) outside the few layout
   sizes a shell region needs (the header height, the sidebar and TOC widths), and those are CSS
   variables declared once in the layout that owns them.
4. **A missing primitive is added, not imitated.** When a region needs a primitive that is not
   vendored yet, it is added with `shadcn add <item> -o`, byte for byte, as the others were.
5. **Every region that scrolls on its own is a `ScrollArea`.** A plain `overflow-auto` box is not.
6. **Icons are `@lucide-animated` where it has the glyph**, and `lucide-react` only where it does not.
   An animated icon inside a control animates on that control's hover or focus, not on its own.
7. **UI copy is sentence case.** Buttons, labels, headings, placeholders, `aria-label`s, empty and
   error messages: `Copy page`, `On this page`, `Context length`. A name stays as it is named: a
   registry item's title (`AI Provider Picker`), a package, a product or brand (`Base UI`,
   `shadcn`, `ZeroXSolutions UI`). An identifier stays as typed (`components.json`, a command, a
   version). Capitals shown for display come from CSS `uppercase`, never from the stored string.

## The docs shell

**Layout.** The docs layout is one `SidebarProvider` grid, `[--sidebar-width]` then
`minmax(0,1fr)`, as upstream's `app/(app)/docs/layout.tsx` is. The header is sticky at the top of
the page and the page is the only scroller of the content column.

**Sidebar.** Sticky under the header, with a height **shorter than the viewport** so that it never
meets the footer, `overscroll-none`, and its list inside a `ScrollArea`. It keeps its scroll position
across navigations within the docs (upstream keeps it in `sessionStorage`) and scrolls the active item
into view on the first render. Groups come from `meta.json` as now.

**The scroll defect, and what fixes it.** Today the sidebar's `aside` is sticky at
`100svh - header`, the full height below the header, inside a flex row that ends where the footer
begins. Near the end of the page the footer pushes that full-height box up in one step, and its
inner scroller chains its overscroll into the page, so a drag at either end moves every column. The
TOC is sticky with no height and no scroller of its own. The fix is the rule above for both rails: a
bounded height that leaves the footer's room, `overscroll-none`, a `ScrollArea` inside. An e2e holds
it: at the bottom of a long page, the sidebar's box does not overlap the footer's, and both rails
compute `overscroll-behavior: none`.

**TOC.** Sticky beside the article, bounded in height, in a `ScrollArea`, the active heading marked
as now. Heading `On this page`.

**Page header.** Title and description, then on the right a `Copy page` button (it copies the page's
Markdown, which the site already serves at `<page>.md`) and previous / next icon buttons, as
upstream's page header has. The pager at the bottom stays.

**Header, footer, mobile nav, command menu, mode switcher.** Rebuilt on the primitives by the rules
above, following upstream's `site-header.tsx`, `main-nav.tsx`, `site-footer.tsx`, `mobile-nav.tsx`,
`command-menu.tsx`, `mode-switcher.tsx`. The header's search trigger shows the platform's modifier as
now.

## Code preview and code blocks

**Component preview.** One card: the rendered demo on top, the demo's source below it, collapsed to
a few lines with a `View code` button that expands it, as upstream's `component-preview-tabs.tsx`
does. The `Preview` / `Code` tabs go.

**Install command.** A block with package-manager tabs (`pnpm`, `npm`, `yarn`, `bun`) and a copy
button, as upstream's `code-block-command.tsx`; the chosen manager is remembered for the next block.
Where a page offers both, `Command` and `Manual` tabs sit above it, the manual tab showing the item's
files.

**Code block.** Highlighted at build by the registry's own highlighter, with upstream's themes
(`github-light`, `github-dark`), a copy button, a header bar that always shows the fence's language
(its label and its icon, `tsx`, `bash`, ...) and the fence's title beside it when one is given, and horizontal overflow in the
block rather than the page. Upstream keeps highlighting in one module, `lib/highlight-code.ts`; so
does this site, and MDX code fences and the component source both go through it.

## Docs content

**No primitive pages.** The `Primitives` group leaves `components/meta.json`, `components/button.mdx`
is deleted, and so are the demos that only that page rendered. The components index lists the
registry's own items only. A primitive a composed item uses is named in that item's page as a
dependency, linking to shadcn's page for it.

## The composed items

Each of the 42 components and the block is rebuilt on the rules above, one family at a time. Its
props, its behaviour and its registry entry do not change; only how it is styled does. Its examples
follow the same rules. Where an item's look depended on a class that rule 1 removes, the primitive's
own variant or size replaces it; where none fits, the item takes the primitive's default.

## The gate holds the rules

Two unit specs in `apps/registry-ui` read the source and fail with the file, the line and the class
or string:

- **`classes.spec.ts`** (new, beside `copy.spec.ts` at the app root, because both read the whole
  tree) - rules 1 to 3: no palette colour, no arbitrary
  value outside the layout's declared variables, and on a primitive's `className` no class from the
  forbidden families (height, padding, radius, font size and weight, colour).
- **`copy.spec.ts`** (new) - rule 7: every JSX text node and every `title`, `aria-label`,
  `placeholder` and `label` string literal, and every MDX heading, is sentence case once the names
  are set aside. The names come from the registry's item titles plus one short list in the spec.

`source.spec.ts` keeps holding each page to its item; it now also fails on a page whose item is not
in the registry.

## Verification

- The unit gate, the build, `wrangler:build`, and `shadcn build` + `validate` pass.
- The e2e suite passes on the worker, with the sidebar / footer case above added.
- Screenshots of `/docs`, one component page and `/blocks` at 1440 and 390 wide, in light and dark,
  compared by eye against upstream's same pages and the base-nova preview, go in the final report.

## Out of scope

The logo, the home page and its shader (spec c3); new item pages beyond the ones that exist; the
deploy (worker size, plan choice, the duplicate Shiki); the editor (spec d).
