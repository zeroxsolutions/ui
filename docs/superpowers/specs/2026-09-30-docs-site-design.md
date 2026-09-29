# Docs site frame, on base-nova

## Goal

`apps/registry-ui` serves a docs site laid out the way shadcn's `apps/v4` is: MDX pages in
`content/docs` read by `fumadocs-mdx` and `fumadocs-core`, a sidebar from `meta.json`, a table of
contents from headings, and a header, footer, sidebar, TOC, pager, mobile nav and command menu of our
own. Before any of it, the registry moves from `base-vega` to `base-nova`.

This spec builds the **frame**: every route, the shell, the content pipeline, and one page of each
kind. The remaining pages are written into this frame by later plans.

Success is:

- `nx run @zeroxsolutions/registry-ui:wrangler:build` builds the worker, and the e2e suite passes
  against that worker's preview;
- the gate is green with `src/lib/source.spec.ts` and `registry/styles.spec.ts` in it;
- `shadcn preset resolve` reports `style nova`, and the site renders in Geist.

Paths are relative to `apps/registry-ui/` unless they start with `apps/`, `packages/` or `docs/`.

## Part 1: the move to base-nova

The move goes through the CLI: `shadcn apply --preset nova --yes`. The CLI rejects `base-nova` and
takes `nova` (shadcn 4.21.0, measured 2026-09-30). A rehearsal on a throwaway worktree the same day
showed what it writes and what it gets wrong:

| `apply` did                                                                                                                                                                    | What this spec does                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components.json` `style` to `base-nova`                                                                                                                                       | keeps it                                                                                                                                                                   |
| rewrote 46 of the 63 files in `registry/bases/base-ui/ui/` (e.g. `button`: `h-9` to `h-8`, `rounded-md` to `rounded-lg`, no `shadow-xs` on `outline`)                          | keeps them byte for byte; they are CLI output                                                                                                                              |
| `styles.css`: `--font-sans: var(--font-sans);`                                                                                                                                 | replaces it; a property mapped to itself resolves to nothing and the font falls back with no error                                                                         |
| `styles.css`: a second `tw-animate-css` and `shadcn/tailwind.css` import in double quotes, the trailing newline dropped                                                        | removes the duplicates, restores the newline                                                                                                                               |
| `src/app/layout.tsx`: Geist through `next/font/google`, unformatted, `@fontsource-variable/inter` still imported in `styles.css` (so `preset resolve` still said `font inter`) | loads Geist through `@fontsource-variable/geist` in `styles.css`, as Inter is loaded today, and drops Inter; `layout.tsx` gains no font code and needs no network at build |
| left the house tokens (`success`, `warning`, `info`, `selection-signal`, `component-mark`)                                                                                     | keeps them                                                                                                                                                                 |
| changed no manifest and no lockfile                                                                                                                                            | adds `@fontsource-variable/geist`, removes `@fontsource-variable/inter`                                                                                                    |

`registry/styles.spec.ts` fails if any custom property in `styles.css` maps to itself, so the next
`apply` cannot reintroduce the cycle silently.

The 42 composed components are then read against nova's recipes. A hand-written class that restates
a vega value a nova primitive no longer uses (a height, a radius, a shadow) is changed to nova's, and
the task lists every one it changed. `registry.json`'s `cssVars` values are copied from `styles.css`
and `registry.spec.ts` rule 4 already compares them, so they follow the file.

`CLAUDE.md`'s delivery line names `base-nova`.

## Part 2: the frame

### Packages

Read from npm on 2026-09-29: `fumadocs-mdx` 15.4.5 (peer `next ^15.3.0 || ^16.0.0`),
`fumadocs-core` 16.15.17 (peer `next 16.x.x`), both `react ^19.2.0`. `fumadocs-ui` is not added:
upstream declares it and imports it nowhere. Each has one declarer, so each is a plain pin in this
app's `package.json`.

fumadocs-mdx from 15.0.13 on emits a Turbopack rule Next accepts only from 16.2.0, and
`@opennextjs/cloudflare` 1.20.7 peers `next >=16.3.6` (npm, 2026-09-30). The app pinned
`next ~16.1.6`, so Next moves first, to 16.3.7, and the adapter to 1.20.7. The repo root and the app
both declare `next`, so it becomes one catalog entry.

### Content pipeline

| File                     | Holds                                                                                                                                                       |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `source.config.ts`       | `defineDocs({ dir: 'content/docs' })`; `rehypeCodeOptions.themes` light and dark; `postprocess.includeProcessedMarkdown: true`, which the `.md` routes read |
| `.source/`               | generated by the `fumadocs-mdx` CLI; already gitignored                                                                                                     |
| `tsconfig.json`          | `"collections/*": ["./.source/*"]`, the alias fumadocs documents today (the older `@/.source` import is deprecated)                                         |
| `src/lib/source.ts`      | `loader({ baseUrl: '/docs', source: docs.toFumadocsSource() })`                                                                                             |
| `src/mdx-components.tsx` | headings with anchors, `pre`/`code` with a copy button, `Steps`, `CodeTabs`, `Callout`, `ComponentPreview`, `ComponentSource`                               |

`ComponentPreview` and `ComponentSource` take a demo or item name and resolve it through two
generated files, as upstream's generator writes two: `examples/__index__.tsx` maps a name to the files
it ships and is read on the server, `examples/__components__.tsx` maps a name to a lazy component and
is imported only from a client component, because the demos use hooks and carry no client directive.
A new target writes both from `examples/*.tsx` and `registry.json`, and `build` and `test` depend on it
and on the `fumadocs-mdx` generation (the app has no `typecheck` target); the file is gitignored, so a target missing that dependency
fails with a missing module rather than going green. `ComponentSource` reads the file at build time,
which is safe only because every route that renders it is `force-static`.

The build keeps Turbopack, as upstream does (`"build": "pnpm registry:build && next build"`, read
2026-09-29). fumadocs#2800 reports `No such module "shiki/core"` on Workers for a Turbopack build that
highlights at request time; these pages highlight at build time. The first task measures it against
the worker preview, and `--webpack` is added only if that error appears, with the error as its
reason.

### Shell

Under `src/`, in the buckets the app already uses:

| Bucket                        | Files                                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------------------ |
| `components/layout/`          | `site-header.tsx`, `site-footer.tsx`                                                       |
| `components/navigation/`      | `docs-sidebar.tsx`, `docs-toc.tsx`, `docs-pager.tsx`, `mobile-nav.tsx`, `command-menu.tsx` |
| `components/general/`         | `mode-switcher.tsx`                                                                        |
| `providers/app-providers.tsx` | `next-themes`' provider, with no client directive of its own                               |
| `routes/`                     | a route unit per path the shell links to                                                   |

The shell composes this registry's own primitives (`sidebar`, `dialog`, `command`, `dropdown-menu`),
so it shows base-nova. `registry/bases/base-ui/components/docs/` (five parts and one spec) is
deleted: the shell replaces it and no item published it.

### Routes

| Path                                             | File                                      | Renders                                                                                                                                                                                                               |
| ------------------------------------------------ | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                                              | `src/app/(app)/page.tsx`                  | a landing page: what the registry is, the install line, links to Components and Blocks                                                                                                                                |
| `/docs/...`                                      | `src/app/(app)/docs/[[...slug]]/page.tsx` | the MDX body, `page.data.toc`, a pager that walks the flattened tree and skips the external links (`findNeighbour` would hand it one); `force-static`, `dynamicParams = false`, `generateStaticParams` from `source`  |
| `/blocks`                                        | `src/app/(app)/blocks/page.tsx`           | each block in an iframe                                                                                                                                                                                               |
| `/view/<name>`                                   | `src/app/(view)/view/[name]/page.tsx`     | one block, full page; `force-static`                                                                                                                                                                                  |
| `/api/search`                                    | `src/app/api/search/route.ts`             | `staticGET` from `createFromSource(source)`, `revalidate = false`; the command menu reads it with `staticClient` from `fumadocs-core/search/client/orama-static`                                                      |
| `/llms.txt`, `/llms-full.txt`, `/docs/<slug>.md` | route handlers                            | fumadocs' `llms()` over `page.data.getText('processed')`; every `.md` path listed in `generateStaticParams`. Upstream lists none and reads the file with `fs.readFileSync` on first request, which a Worker cannot do |
| `/og/docs/<slug>/image.png`                      | a route handler, fumadocs' own pattern    | one image per page, rendered at build from the pages' params. Next refuses an `opengraph-image` file inside an optional catch-all                                                                                     |
| `/sitemap.xml`, `/robots.txt`                    | `src/app/sitemap.ts`, `src/app/robots.ts` | static                                                                                                                                                                                                                |

`src/app/api/hello` is deleted. `/charts`, `/colors`, `/create`, `rss.xml` and `r/registries.json`
are not built: this repo has nothing for them to show.

Every route is fixed at build, which is all `static-assets-incremental-cache` supports: it reads
through `ASSETS` and writes nothing (OpenNext source, read 2026-09-29).

`wrangler.jsonc` gains `"keep_names": false`. `next-themes` sets the theme class from an inline script
before hydration; with the bundler's name-keeping on, that script calls a helper the page never
defines and throws, and the theme is set only after hydration, which no check made after hydration
sees. A render at request time was measured carrying `__name(...)` in that script; every route in this
frame is prerendered, so no case here fails when the line is removed.

### Content tree

```
content/docs/
  meta.json                   Get Started, Components, Blocks, Packages; Editor hidden until spec (d)
  index.mdx                   what the registry publishes and where primitives come from
  installation.mdx            components.json on base-nova; items reference each other by URL;
                              the success/warning cssVars merge into the consumer's CSS
  components/
    meta.json                 one group per kind folder, then Primitives; the primitives with no
                              page here are links to ui.shadcn.com/docs/components/base/<x>
    index.mdx                 every item grouped by its category, read from registry.json
    status-indicator.mdx      the composed-item page
    button.mdx                the primitive page
  blocks/
    ai-provider-picker.mdx
  packages/
    icons.mdx
```

A composed-item page:

| Section       | Holds                                                                                                                                                                                                                |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| frontmatter   | `title` and `description` equal to the item's in `registry.json`                                                                                                                                                     |
| preview       | `<ComponentPreview name="<name>-demo" />`                                                                                                                                                                            |
| Installation  | `CodeTabs`: the command `npx shadcn@latest add https://ui.zeroxsolutions.com/r/<name>.json`, or by hand in `Steps`: its npm packages, its upstream primitives, `<ComponentSource name="<name>" />`, the import paths |
| Usage         | the import and the smallest composition the family's doc comment shows                                                                                                                                               |
| Examples      | a `###` per variant demo `<name>-<variant>.tsx`, where the family has a variant, size or tone prop or a second composition                                                                                           |
| API Reference | a `###` per exported part: the props it adds to its element's own, with type and default, and the `data-*` it sets                                                                                                   |

A primitive page carries its description, `npx shadcn@latest add <x>`, a link to its page on
ui.shadcn.com, and its docs-only demos. The block page previews through `/view/<name>`. A package page
carries `pnpm add`, its usage from the package README, and one live demo.

## Tests

`src/lib/source.spec.ts` reads `content/docs`, `registry.json` and the demo index, and asserts, for
the pages that exist:

1. a page under `components/` or `blocks/` is a registry item or one of the primitives listed in
   `components/meta.json`, and an item page's `title` and `description` equal the item's;
2. every `ComponentPreview` and `ComponentSource` name resolves in the index, and an item page's first
   preview is `<name>-demo`;
3. an item page's install command names `https://ui.zeroxsolutions.com/r/<name>.json`, and a
   primitive page's names `npx shadcn@latest add <x>`;
4. every page is reached from some `meta.json`.

Each rule has a case that feeds it a wrong fragment and expects the failure. The rules that every item
has a page and every demo appears on one are added by the plan that writes the last page; added now,
they fail from the first commit.

Component specs cover the shell: the sidebar marks the current page, the TOC marks the heading in
view, the pager links both ways, the command menu opens on the shortcut and lists a stubbed search
result, the mode switcher changes the theme.

`apps/registry-ui-e2e` starts the worker instead of `next dev`, through a `wrangler:dev` target that
runs the adapter's preview and depends on `wrangler:build`. One test per feature:

- `/` renders and links to Components;
- `/docs/components/status-indicator` shows the preview, its Code tab shows the source, and the pager
  reaches the next page;
- the command menu finds Status Indicator;
- `/view/ai-provider-picker` renders the block;
- `/llms.txt` and `/docs/components/status-indicator.md` answer with the page's text;
- `/sitemap.xml` lists the pages;
- with a dark color-scheme and scripts blocked, the page loads dark;

and one for the unhappy path: an unknown `/docs/...` answers the not-found page.

## Not covered

- `wrangler:deploy`, the custom domain and the deploy secrets stay with
  `docs/superpowers/specs/2026-09-28-registry-ui-deploy-design.md`; this spec takes only its
  `wrangler:dev` target.
- How a page looks; no check compares pixels.
- The API Reference tables are written by hand, as upstream's are. Nothing compares them with a part's
  props, so a changed prop leaves its table wrong until someone edits it.
- The worker's size. Measured on the frame (`wrangler deploy --dry-run`, 2026-09-30): 6773 KiB
  gzipped, over the free plan's 3 MiB and under the paid plan's 10 MiB. The demos are already lazy;
  the weight is two copies of the Shiki grammars, `next` itself and the share-image renderer. Which
  plan it deploys on, and any cut, belong to the deploy spec.
- The known component defects (the AvatarPicker slot, FrontmatterFormFieldControl rejecting
  `Textarea`, TooltipTrigger's `data-slot`, `combobox-value`) are reported where an API Reference meets
  them, not fixed here.
- Multiple styles: a later round adds them; this frame takes upstream's shape and adds no style key
  ahead of it.
