# zui: the editor docs as a zone of their own

## Intent

The editor pages (`/docs/editor` and its 19 item pages, from #114) are served by `apps/registry-ui`, the
default zone, beside the rest of the web docs. Their demos pull Tiptap, CodeMirror, KaTeX, mermaid and
shiki into the build. To keep that out of `registry-ui`'s worker, `packages/ui/tools/build-examples-index.mts`
loads every editor demo through `next/dynamic` with `ssr: false`, so an editor page renders an empty stage
on the server and draws its demo only after the browser loads the editor's chunks.

This change moves the editor pages into a zone of their own, `apps/registry-editor-docs-zone`, on the
same origin and the same paths, the way #78 split the native docs (`2026-11-03-zui-zones-design.md`). The
owner asked for the split (2026-11-14). What it buys:

- an editor change rebuilds, retests and redeploys the editor zone, and a change to the other web docs
  never builds the editors;
- `registry-ui`'s worker no longer carries any editor code, not even the client-only imports;
- the editor zone's worker carries the editors on purpose, so its demos render on the server again.

## Goals

1. Every editor URL answers what it answers today, on `ui.zeroxsolutions.com`, from the editor zone.
2. `registry-ui`'s build imports nothing under `registry/bases/base-ui/editor/` and no editor demo.
3. The editor demos render on the server in the editor zone (no `ssr: false`), as long as the zone's
   worker passes `tools/check-worker-size.sh` (see Size).
4. A change reaching only the editor chrome or its pages is not built by `registry-ui`'s targets, and
   the reverse.

## Non-goals

- Splitting the editor chrome out of `packages/ui`, or the registry JSON out of `registry-ui`'s
  `/r/*`. `shadcn add @zui/document-editor` keeps resolving where it does today.
- A zone per editor item, or moving `/docs/components/*` anywhere.
- Changing what any editor page says or demos.
- The native editor.

## Anti-goals

- A link, a registry URL, an `.md` address or an `og` image that works today and breaks after the split.
- One path answered by both zones.
- `packages/editor-docs-web` importing `packages/ui-docs-web` or the reverse, or the editor zone
  importing either web context's package. Either makes the two zones inseparable again.

## Shape

### Projects

| Project                                                        | Kind                           | Holds                                                                                                                          |
| -------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `packages/editor-docs-web` (`@zeroxsolutions/editor-docs-web`) | the editor docs' pages         | `content/docs/editor/**` (moved from `packages/ui-docs-web`), the page components they need, its route units                   |
| `apps/registry-editor-docs-zone`                               | the editor zone                | route files, layouts and providers for the paths below, its fumadocs source over `editor-docs-web`'s content, its asset prefix |
| `apps/registry-editor-docs-zone-e2e`                           | e2e of the editor zone         | the editor half of `component-pages`, the editor pages' own specs, and the cross-zone checks below                             |
| `packages/ui`                                                  | the web UI package             | unchanged items; `build-examples-index` writes two indexes (below)                                                             |
| `apps/registry-ui`, `packages/ui-docs-web`                     | the default zone and its pages | everything they serve today except the editor pages                                                                            |

Names follow the native zone's: the context is `editor-docs`, its package `-web`, the zone
`registry-editor-docs-zone`, the worker `ui-sdk-registry-editor-docs-zone`. Tags: `type:context-frontend`
and `context:editor-docs`, under the boundary constraints `.oxlintrc.jsonc` already has. Created with the
nx generators, inferred targets, copying the native zone's `wrangler.jsonc`, `next.config.mjs`,
`open-next.config.ts` and target shape.

### Routes on the edge

The editor zone's `wrangler.jsonc`, production, on `ui.zeroxsolutions.com`:

- `/docs/editor`, `/docs/editor/*` (pages, the `.md` addresses, and the zone's own `llms.txt`,
  `llms-full.txt`, `sitemap.xml` and `api/search` under that prefix)
- `/og/docs/editor/*`
- `/llms.mdx/docs/editor/*`
- `/editor-static/*` (its asset prefix)

`registry-ui` keeps the Custom Domain and loses these paths by route precedence, as it lost the native
ones. Workers route patterns match `/docs/editor` exactly and `/docs/editor/*` below it, so a docs page
such as `/docs/editor-foo` would stay `registry-ui`'s. Dev ports `8789` and inspector `9231`, beside
8787/9229 and 8788/9230. `workers_dev: false` and `preview_urls: false` in production. The overlap check
each zone's `wrangler:deploy` runs over `apps/*-zone/wrangler.jsonc` covers the new zone as it is.

### Demos and the examples index

`build-examples-index.mts` already computes the client-only set: every `editor` item and every item that
names one among its registry dependencies (today exactly the 18 editor items and their 16 demos; no
component outside the editor category depends on one). It writes that set into a second pair of index
files instead of marking it `ssr: false`, and leaves it out of the first:

- the existing `examples/__index__.tsx` and `__components__.tsx`: everything but the editor set, which
  `registry-ui` imports;
- a second pair, for the editor set only, which the editor zone imports, with `lazy` for every entry.

`next/dynamic` then leaves the generated files altogether: neither pair marks anything client-only. The
editor zone's `ComponentPreview` and `ComponentSource` read the second pair; the component itself stays
in `packages/ui/src/site` and takes the index as it does today (its exact seam is left to the builder).

`apps/registry-ui/src/app/global.css` drops its `@import` of `editor/styles.css`; the editor zone's
`global.css` imports it beside the base sheet, with `@source` entries for `packages/ui` and
`packages/editor-docs-web`.

### Size

The first task builds today's master and records what `tools/check-worker-size.sh` prints for
`registry-ui` (the upload total, which the script refuses above 58982 KiB, 90 per cent of Cloudflare's
64 MiB uncompressed limit, and the handler's size); the zone's task records the editor zone's with SSR
on. Both must pass the script, and `registry-ui`'s upload must fall.

If the editor zone with every demo on the server goes past the limit, the item whose import tips it
(mermaid is the likely one) keeps `ssr: false` in the editor zone's index alone, named in the generator
with the measured size as the reason. My call: SSR is a goal of this change, not a condition of it.

### Cross-zone behaviour

- **Sidebar.** Both zones show one docs tree. `registry-ui`'s tree keeps an `Editor` section; its entries
  are built from `registry.json`'s `editor` items (title and `/docs/editor/<name>`), which `packages/ui`
  already exports, so `ui-docs-web` reads no editor content. The editor zone's tree is its own section in
  full, preceded by the other top-level docs sections (Introduction, Installation, Components, Blocks,
  Packages) as single links written in the zone's own `src/routes/`. Every link that crosses zones is a
  plain `<a>`. My call: the editor zone does not render the components list in its sidebar.
- **Components index.** `components-list.tsx` already links editor items to `/docs/editor/<name>`; those
  links become plain anchors.
- **Search.** Each zone serves its own pages' index: `registry-ui` keeps `/api/search`, the editor zone
  answers `/docs/editor/api/search`. The search box in both zones asks both endpoints and shows the
  results together, so a reader on either side still finds every docs page. My call: unlike the native
  split, where each platform searches only itself, the editor pages are part of the same docs.
- **Sitemap.** `/sitemap.xml` (sitemap index) gains `/docs/editor/sitemap.xml`; `/docs-sitemap.xml`
  drops the editor pages.
- **llms.** `/llms.txt` links `/docs/editor/llms.txt` as it links the native one; `/llms-full.txt` drops
  the editor pages, which move to `/docs/editor/llms-full.txt`. The `.md` rewrites for `/docs/editor` and
  `/docs/editor/:path*.md` move to the editor zone's `next.config`.
- **Theme, header, remembered choices** behave as across the native split: same `next-themes` key, same
  per-origin storage, header from `packages/ui`'s site components with links as props.

### What changes for a reader

- Moving between an editor page and any other docs page is a full page load.
- `/llms-full.txt` no longer holds the editor pages; `/docs/editor/llms-full.txt` does.
- An editor demo is drawn in the first HTML instead of after its chunks load (subject to Size).

## Order

Three pull requests, each green on its own, as the native split went, because the routing is only
observable on the real host:

1. **Package and index.** `packages/editor-docs-web` with the moved content, the boundary tags, the two
   examples indexes, the sidebar built from `registry.json`. `registry-ui` still serves the editor pages
   from the package (still client-only there). The size baseline is recorded.
2. **Editor zone.** The app, its e2e, routes, asset prefix, search, sitemap and llms routes, SSR on.
   Deployed and checked path by path; undoing it is deleting its routes.
3. **Leave `registry-ui`.** The editor pages, the editor examples index import and `editor/styles.css`
   leave `registry-ui`; its search, sitemap and llms drop the editor pages; `ssr: false` leaves the
   generator; `registry-ui`'s size is recorded.

## Testing

- `registry-ui-e2e`'s `component-pages` visits non-editor items only; the editor zone's e2e visits every
  editor item at 390x844 with the same assertions (no sideways page scroll, no stage scrolling sideways,
  no page error), plus one that the demo's markup is in the server's HTML.
- The editor zone's e2e asserts each cross-zone link by its `href` and by being a plain `<a>`, and that
  its search box queries both endpoints.
- After the deploy: each route answers from the editor worker (from its logs), `/editor-static/...`
  answers 200, `/docs/components/base/button` still answers from `registry-ui`, and
  `pnpm dlx shadcn@latest add @zui/document-editor` still resolves.

## Left to the builder

- How `ComponentPreview` and `ComponentSource` receive the editor index in the editor zone.
- The file names of the second index pair.
- How the merged search results are ordered.
- Which of today's editor-related specs in `apps/registry-ui/src/lib/source.spec.ts` move to the editor
  zone, as long as every check they make still runs against the editor pages.
