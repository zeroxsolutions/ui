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

**The docs shell takes its structure and behaviour from upstream `apps/v4`**, read live from
`shadcn-ui/ui@main`: which region scrolls, which is sticky, what the sidebar and TOC hold. It takes
neither upstream's classes nor its extras. Upstream's shell classes (`h-[30px]`, `text-[0.8rem]`, a
repositioned dialog) style ui.shadcn.com itself, not the base-nova preset, so copying them is what
made the shell stop looking like base-nova. The shell is built from this registry's own items and the
vendored base-nova primitives as the CLI wrote them, and holds only what these docs need.

## Rules

Every rule applies to what the registry publishes (the 42 `registry:component` items, the block and
their examples) and to the docs shell: every module under `apps/registry-ui/src/`. Rule 7 also
covers every docs page.

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
5. **Every region that scrolls because its content overflows is a `ScrollArea`**, in the items and in
   the docs shell alike. A plain `overflow-auto` box is not. A vendored primitive's own scroller, such as
   `SidebarContent` or `CommandList`, counts as the primitive and is used as it comes (rule 1).
6. **Icons are `@lucide-animated` where it has the glyph**, and `lucide-react` only where it does not.
   An animated icon inside a control animates on that control's hover or focus, not on its own.
7. **UI copy is sentence case.** Buttons, labels, headings, placeholders, `aria-label`s, empty and
   error messages: `Copy page`, `On this page`, `Context length`. A name stays as it is named: a
   registry item's title (`AI Provider Picker`), a package, a product or brand (`Base UI`,
   `shadcn`, `ZeroXSolutions UI`). An identifier stays as typed (`components.json`, a command, a
   version). Capitals shown for display come from CSS `uppercase`, never from the stored string.

## The docs shell

**Layout.** Upstream's structure, file for file: `<body>` carries `group/body overscroll-none` and
the footer height; the docs layout is one `SidebarProvider` grid (`--sidebar-width` then
`minmax(0,1fr)`) holding `DocsSidebar` and the page; the page is a flex row of the article column and
the TOC column. The site footer hides itself on docs pages (`group-has-[[data-slot=docs]]/body:hidden`)
as upstream's does. The header is sticky and the page is the only scroller of the article.

**Sidebar.** Upstream's structure on the primitives as they come: the `Sidebar` primitive
(`collapsible="none"`) is the sticky, bounded, `overscroll-none` column, and `SidebarContent` is the
list's scroller. Groups come from `meta.json`: `SidebarGroupLabel` and `SidebarMenuButton` at their
own size, the current page marked with `isActive`. The sidebar has the page's own background. No
fade, no scroll-position script, no hit-area or size classes.

**The scroll defect, and what fixes it.** Today the sidebar's `aside` is sticky at
`100svh - header`, the full height below the header, inside a flex row that ends where the footer
begins. Near the end of the page the footer pushes that full-height box up in one step, and its
inner scroller chains its overscroll into the page, so a drag at either end moves every column. The
TOC is sticky with no height and no scroller of its own. The fix is upstream's structure: the page itself
`overscroll-none`, the rails bounded and `overscroll-none` with their own scroller, and no footer on a
docs page for the rail to meet. An e2e holds
it by behaviour: at the end of a long page at 1440 and 1024 wide the sidebar's top stays under the
header; a wheel over a rail scrolled to its end leaves the page where it was; the page's scrolling
element computes `overscroll-behavior-y: none`.

**TOC.** A sticky, bounded, `overscroll-none` column beside the article, its list in a `ScrollArea`,
the active heading marked. Heading `On this page`.

**Page header.** Title and description, then on the right the registry's `CopyButton` copying the
page's Markdown (served at `<page>.md`) and previous / next icon buttons. No menu of AI providers.
The pager at the bottom stays.

**Header, footer, mobile nav, command menu, mode switcher.** Upstream's structure on the primitives as
they come. The command menu is the `CommandDialog` primitive at its own position and size, one
`CommandItem` per page with no per-item icon animation, no debounce and no observers. The header's
search trigger shows the platform's modifier.

No upstream utility is added to `styles.css` (`scroll-fade`, `extend-touch-target`, `--top-spacing`
and the like); a layout variable the shell needs is declared once in the layout that owns it.

## Code preview and code blocks

**Component preview.** One card: the rendered demo on top, the demo's source below it, collapsed to
a few lines with a `View code` button that expands it, as upstream's `component-preview-tabs.tsx`
does. The `Preview` / `Code` tabs go.

**Install command.** The registry's `CodeBlock` holding the one `pnpm dlx shadcn@latest add <url>`
command, with its language label and its copy button. No package-manager tabs.

**Code block.** The registry's own `CodeBlock`, highlighted by the registry's own highlighter on its
`--code-*` tokens, with a copy button, a header bar that always shows the fence's language
(its label and its icon, `tsx`, `bash`, ...) and the fence's title beside it when one is given, and horizontal overflow in the
block's `ScrollArea` rather than the page. MDX code fences and the component source both go through
that one highlighter; the site defines no code block of its own.

## Docs content

**No primitive pages.** The `Primitives` group leaves `components/meta.json`, `components/button.mdx`
is deleted, and so are the demos that only that page rendered. The components index lists the
registry's own items only. A primitive a composed item uses is named in that item's page as a
dependency, linking to shadcn's page for it.

## The composed items

Each of the 42 components and the block is rebuilt on the rules above and on the house skill for
writing a component, in full: one family per file named for its root, subject-plus-shape names,
content arriving as children (a string prop naming content becomes a slot), coordination through
`data-*`, a wrapper that carries placement only, class strings only in a recipe or on the element,
and composition taken from upstream's fetched example. Its behaviour and its registry entry stay;
its props change only where that skill requires a slot, since nothing installs these items yet. Its examples
follow the same rules. Where an item's look depended on a class that rule 1 removes, the primitive's
own variant or size replaces it; where none fits, the item takes the primitive's default.

## Verification

- The unit gate, the build, `wrangler:build`, and `shadcn build` + `validate` pass.
- The e2e suite passes on the worker, with the sidebar / footer case above added.
- Screenshots of `/docs`, one component page and `/blocks` at 1440 and 390 wide, in light and dark,
  compared by eye against the base-nova preview, go in the final report.

## Out of scope

The logo, the home page and its shader (spec c3); new item pages beyond the ones that exist; the
deploy (worker size, plan choice, the duplicate Shiki); the editor (spec d).
