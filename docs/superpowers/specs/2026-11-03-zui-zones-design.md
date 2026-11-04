# zui zones: the web and native docs as two deployables

## Intent

`apps/registry-ui` serves both platforms of the registry from one worker, `ui-sdk-registry-ui` on
`ui.zeroxsolutions.com`: the web docs, components and blocks, and the native docs, components, blocks
and Expo previews. So any change on either platform rebuilds, retests and redeploys both. The native
side is the heavier and the faster-moving one: its build waits on two Expo web exports and on
`native-ui:build-registry`, which a web-only change never needs.

This change makes each platform a micro frontend: a package per platform holding its pages, and a zone
per platform deployed on its own behind the same origin. A change to one platform then lints, tests,
builds and deploys that platform alone, in a PR's gate and in the production deploy.

## Goals

1. A change reaching one platform only is linted, tested, built and deployed for that platform only,
   on the PR gate and on the push to `production`.
2. Every public URL keeps answering what it answers today, on the same origin. The exceptions are in
   "What changes for a reader".
3. Each platform's worker is smaller than today's single worker, measured (see "Size").

## Non-goals

- Splitting by style (vega, nova, maia, ...) or by native engine (nativewind, uniwind). A style or an
  engine is a parameter of the same page, readers switch it constantly, and what differs per style is
  registry JSON, which is a static asset and does not grow a worker. A zone per style would multiply
  builds and deploys with every style added.
- Splitting a platform further by section (docs, components, blocks). Readers move between them, and
  they share the layout and the content source.
- Module Federation, or any code loaded at runtime. Its Next.js integration does not support the App
  Router.
- A remote task cache on CI. The repository is public, so it runs on GitHub-hosted runners: a
  self-hosted runner would run a fork's PR on our machine, and `actions/cache` holding `.nx/cache`
  already filled travel's 10 GB GitHub cache limit (github-actions `ed6e4f1`). Selection by `affected`
  is how this change saves work instead.
- Changing `apps/native-preview`, `apps/native-preview-uniwind`, or the EAS update flow.

## Anti-goals

- A link, a registry URL or a `shadcn add` command that works today and breaks after the split.
- One path answered by both zones, or a zone answering on an address other than its routes.
- A platform's package importing the other platform's package. Once one does, the two zones stop
  being separable and the affected selection stops saving anything.

## Shape

### Projects

| Project                                                              | Kind                        | Holds                                                                                                                                                                                                                                                                                                                                              |
| -------------------------------------------------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/ui` (`@zeroxsolutions/ui`)                                 | the web UI package          | the web registry's items, now in `apps/registry-ui/registry/bases/base-ui` and `registry.json`, with their `build-registry` and `examples-index` targets; the site's own components that both zones draw (header, footer, mode switcher, docs sidebar, TOC, pager, search box, code blocks), exported by subpath and not listed in `registry.json` |
| `packages/ui-docs-web` (`@zeroxsolutions/ui-docs-web`)               | the web platform's pages    | `content/docs`, the pages of `/docs`, `/blocks` and `/view`, their components, and its route units                                                                                                                                                                                                                                                 |
| `packages/native-ui-docs-web` (`@zeroxsolutions/native-ui-docs-web`) | the native platform's pages | `content/native`, the pages of `/native`, their components (engine tabs, native preview, QR, install command, `components.json`), `native-install`, `native-preview`, and its route units                                                                                                                                                          |
| `packages/native-ui`                                                 | the native UI package       | unchanged                                                                                                                                                                                                                                                                                                                                          |
| `apps/registry-ui`                                                   | the default zone, web       | route files, layouts, providers, and the paths no other zone claims: `/`, `/docs`, `/blocks`, `/view`, `/og/docs`, `/llms.mdx/docs`, `/llms.txt`, `/llms-full.txt`, `/sitemap.xml`, `/robots.txt`, `/api/search`, `/r/*` except the native styles, `/favicon.ico`                                                                                  |
| `apps/registry-native-ui-docs-zone`                                  | the native zone             | route files, layouts and providers for `/native`, `/native/*`, `/native-preview/*`, `/native-preview-uniwind/*`, `/og/native/*`, `/llms.mdx/native/*`, `/r/styles/nativewind-*`, `/r/styles/uniwind-*`, and its asset prefix `/native-static/*`                                                                                                    |
| `apps/registry-ui-e2e`                                               | e2e of the web zone         | today's specs, less the native ones                                                                                                                                                                                                                                                                                                                |
| `apps/registry-native-ui-docs-zone-e2e`                              | e2e of the native zone      | `native-home`, `native-preview`, `native-urls`, and the native halves of `platform-switch`, `search`, `llms`, `sitemap`, `not-found`                                                                                                                                                                                                               |

All are created with the nx generators, with inferred targets.

On the names (the contexts were the user's call, the rest mine): each context is named for the UI package it
documents, `ui-docs` for `packages/ui` and `native-ui-docs` for `packages/native-ui`.
The splitting skill names a context package
`packages/<context>-<realm>-<renderer>` and its zone `apps/<surface>-<context>-zone`. zui has no backend
and no realm, so the realm segment is dropped: both contexts are drawn
with the DOM (`-web`), and the surface is `registry` (from `registry-ui`). `apps/registry-ui` stays the
default zone under its own name, so its project, worker and e2e names do not change.

No `-react` package: both contexts are drawn by one renderer, so nothing is shared between a `-web` and
a `-native` package of one context.

### The boundary

Tags in each `package.json`'s `nx.tags`, and constraints in `.oxlintrc.jsonc`'s
`@nx/enforce-module-boundaries`, which already runs through `@nx/oxlint/boundaries-plugin`:

| Project                             | Tags                                              |
| ----------------------------------- | ------------------------------------------------- |
| `packages/ui`, `packages/native-ui` | `type:ui`                                         |
| `packages/ui-docs-web`              | `type:context-frontend`, `context:ui-docs`        |
| `packages/native-ui-docs-web`       | `type:context-frontend`, `context:native-ui-docs` |

`type:context-frontend` may not depend on `type:context-frontend`; `type:ui` may not depend on
`type:context-frontend`; `context:<c>` may depend only on `context:<c>` and `type:ui`. The lint target
fails a deliberate cross-import once before that import is deleted.

`native-ui-docs-web` depends on `@zeroxsolutions/native-ui` (`examples`, `preview`) and on
`@zeroxsolutions/ui` (the site components and the items the pages draw with); `ui-docs-web` depends on
`@zeroxsolutions/ui` only.

### Pages free of Next

A page in a context package imports nothing from `next/*`. Today's source imports `next/navigation`
23 times and `next/link` 15 times. Each zone's providers hand in the link element and the router's push,
replace, pathname and search params through a host provider exported by `packages/ui`; a page and a site
component read them from it. `next-themes` stays in the apps' providers; a page reads the theme through
the same provider.

My call, on where the line falls: everything Next-specific stays in the zone's route file, which is
the only file that knows it runs in Next: `generateStaticParams`, `dynamicParams`, `generateMetadata`,
`notFound()`, `redirect()`, the route handlers, and `next/og` (`lib/share-image.tsx` stays in each
zone app). The route file loads the page's data from its context package's source, calls `notFound()`
when there is none, and renders the package's page with it as props. A package page is a server
component taking props; the host provider is read only by the client components under it.

A context package's route units are the path builders and matchers of its own paths, today's
`src/routes/docs` and `src/routes/native` and their halves of `app-routes.ts`, exported from a
`routes` subpath that imports no React.

The site components in `packages/ui` take their links and nav items as props from the zone app
(header, platform switch, sidebar), so `packages/ui` holds no route of either platform.

fumadocs-core's `page-tree`, `toc`, `source` and search client import no Next module and may be used in
packages. `createMDX`, `source.config.ts` and the fumadocs loaders (`lib/source.ts`, `lib/native-source.ts`)
stay in each zone app, because the loaders read `collections/server`, which fumadocs-mdx generates
inside the app; each app declares only its own collections, with `dir` pointing into its context
package's `content/`; the MDX remark and rehype plugins
move with the package that owns that content (`remark-native-demo-source` to `native-ui-docs-web`,
`rehype-docs-code` to `packages/ui`, since both platforms' code blocks use it).

### Routes on the edge

Each zone's `wrangler.jsonc` routes, on `ui.zeroxsolutions.com`:

- `apps/registry-ui`: the Custom Domain `ui.zeroxsolutions.com`.
- `apps/registry-native-ui-docs-zone`: `/native`, `/native/*`, `/native-preview/*`,
  `/native-preview-uniwind/*`, `/og/native/*`, `/llms.mdx/native/*`, `/native-static/*`,
  `/r/styles/nativewind-*`, `/r/styles/uniwind-*`.

A route takes precedence over a Custom Domain on the same hostname ("Routes can `fetch()` Custom
Domains and take precedence if configured on the same hostname", Workers "Routes", last updated
Oct 18, 2026, read 2026-11-03), so the native zone's entries take their paths from `registry-ui`, which
keeps its `custom_domain: true` and the DNS record that created. Each claim is a path plus its subtree,
except the two style prefixes: `/r/styles/nativewind-*` deliberately takes every nativewind style, so
adding a style adds no route.

Both zones set `workers_dev: false` and `preview_urls: false` in production, so the routes are the only
way in. The native worker is `ui-sdk-registry-native-ui-docs-zone`.

Before `wrangler:deploy`, the deploy job runs the overlap check from the splitting skill's Cloudflare
reference over `apps/*-zone/wrangler.jsonc` and stops on any output.

### The native zone's assets

- `assetPrefix: '/native-static'` in its `next.config`, and after the OpenNext build the zone's build
  target moves `.open-next/assets/_next` to `.open-next/assets/native-static/_next` and asserts nothing
  is left at the unprefixed path. OpenNext ignores `assetPrefix` for the files it ships
  (opennextjs-cloudflare#885).
- Its `public/` holds `native-preview/`, `native-preview-uniwind/` (the two Expo exports, unchanged
  paths) and `r/styles/{nativewind,uniwind}-*` (copied from `packages/native-ui/dist/r`), all under paths
  its routes claim; nothing at the public root.
- The site uses no `next/image`; a page that later does sets `images: { unoptimized: true }` in this
  zone.

### Build targets

- `packages/ui` keeps the items under `registry/bases/base-ui/...`, the same relative paths
  `registry.json` names today, so the built JSON is unchanged: `public/r` built before and after the
  move is compared with `diff -r` and differs in nothing. The same holds for `native-ui`'s styles copied
  into the native zone.
- Each zone's `global.css` has Tailwind `@source` entries for `packages/ui` and for its own context
  package, or classes used only there are missing from its CSS.
- `packages/ui:build-registry` runs today's `shadcn build` for `base-nova`, copies it to the other base
  styles, and validates `registry.json`; `apps/registry-ui:shadcn-build` copies its output into
  `public/r`. It no longer depends on `native-ui:build-registry` or copies native styles.
- `apps/registry-native-ui-docs-zone`'s build depends on `native-ui:build-registry`,
  `native-preview:export` and `native-preview-uniwind:export`, which `registry-ui`'s no longer does.
- Each zone has its own `fumadocs-generate`; `examples-index` moves to `packages/ui`.
- Each zone's targets keep today's `wrangler:build`, `wrangler:dev` and `wrangler:deploy` shape.

### CI

- The PR gate is unchanged: `nx affected` already selects by project.
- `.github/workflows/nx-deploy.yml` gains the gate's `mode` input and a range step whose base is the
  head SHA of the last successful `cd` run on `production` (`gh api` on the workflow's runs, with
  `actions: read`), falling back to `run-many` when there is none or it is not reachable. My call: the
  base is not `github.event.before`, because a deploy that failed and was followed by another push
  would then never be deployed; against the last success, the next push carries it. `cd.yml` passes
  `mode: affected` to both `deploy` and `eas-update`, so a web-only change publishes no EAS update
  either. Its comment about version skew is rewritten for this
  repository: the two zones share no binding or queue, so deploying a subset ships no skew.
- `.github/actions/nx-setup/action.yml`'s comment on the nx cache is corrected to the reason that holds:
  hosted runners keep no disk, and `actions/cache` for `.nx/cache` exceeded GitHub's per-repository limit
  in travel.

A change reaching `packages/ui` affects both zones, as it should: both draw it.

## Cross-zone behaviour

- **Links across zones are plain `<a>`**: the platform switch, the site header's platform links, the
  home page's links into `/native`, and the redirects' targets. A `next/link` into the other zone
  prefetches the other zone's payload three times for one hard navigation.
- **Paths in another zone** are written in each zone app's own `src/routes/` with the same values:
  the other platform's home, docs, components and blocks, which the platform switch builds. A zone app
  never imports the other context's package, not even its `routes` subpath, because nx marks the zone
  affected by every change in that package.
- **The platform switch** links to the counterpart path without checking the other platform has the
  page, since neither zone holds the other's page list. A component or docs slug the other platform
  lacks answers that zone's 404, which shows that section's index. My call, and a departure from
  today, where `platformCounterpart` falls back to the section index before navigating.
- **Search**: a page already searches its own platform only (`search-index.ts` tags each page with its
  platform). The index splits with the zones: the web zone keeps `/api/search` with the web pages; the
  native zone serves `/native/api/search` with the native pages, and the native search box asks it.
- **Sitemaps**: `/sitemap.xml` (web zone) is a sitemap index naming `/docs-sitemap.xml` and
  `/native/sitemap.xml`; each zone writes its own pages' sitemap. `/robots.txt` names `/sitemap.xml`
  and is the web zone's alone: robots is read at the origin's root, which the native zone does not
  claim.
- **llms**: `/llms.txt` lists the web pages and links `/native/llms.txt`; `/llms-full.txt` holds the web
  pages and `/native/llms-full.txt` the native ones. The `.md` rewrites move with their paths:
  `/native/**/*.md` to the native zone's `next.config`.
- **Redirects** from old addresses stay with the zone owning the old path: `/docs/native*` and
  `/r/<name>.json` in the web zone.
- **Theme and locale**: both zones read the same `next-themes` storage key and class, so a reader's
  light or dark choice holds across the switch. The site has no locale.
- **Remembered choices** (`use-remembered-choice`: style, engine, base) are stored per origin in the
  browser, so both zones read the same values; their keys do not change.

## What changes for a reader

- Switching platform is a full page load.
- Switching to a page the other platform lacks shows that section's 404 page instead of redirecting to
  the section index.
- `/llms-full.txt` holds the web pages only; the native ones move to `/native/llms-full.txt`.

## Size

The numbers measured while designing came from a build that predates PR #65, which made every
collection `async`, so they are not used here. The first task builds today's master with
`wrangler:build` and records the gzipped size of `handler.mjs`; the last task records each zone's. Both
must stay under Workers Paid's 10 MB compressed limit, and each zone below today's single worker.

## Order

Three stacked PRs, each green on its own. The routing can only be observed on the real hostname (no
local edge joins two workers, and production is the only environment), so the native zone goes live
while `registry-ui` still serves every native page, and the native pages leave `registry-ui` only once
the zone is seen answering:

1. **Packages.** `packages/ui`, `packages/ui-docs-web`, `packages/native-ui-docs-web`, the host provider, the
   boundary tags and constraints. `apps/registry-ui` still serves both platforms from the packages, and
   every e2e spec still passes against it. Nothing about deployment changes.
2. **Native zone.** `apps/registry-native-ui-docs-zone` and its e2e, its routes, the asset prefix, the overlap
   check, the deploy by `affected`, and the custom-domain question settled. Deployed, then checked
   path by path (see Testing). Undoing it is deleting the zone's routes: `registry-ui` still answers
   every path.
3. **Web zone.** The native routes, pages, public files and build dependencies leave `registry-ui`; the
   cross-zone links, search, sitemap and llms split.

## Testing

- Unit specs move with their files. The boundary lint fails a deliberate cross-import.
- `registry-ui-e2e` runs against `registry-ui`'s `wrangler:dev`; `registry-native-ui-docs-zone-e2e` against the
  native zone's own `wrangler:dev`, visiting `/native/...` and its `/native-static/` assets on the zone's
  own port. A cross-zone link is asserted by its `href` and by being an `<a>` without Next's link
  handling, since no local edge joins the two.
- After the first deploy: every path in the route list answers from the expected worker (the response's
  `cf-worker` header or the worker's logs), `/native-static/_next/static/...` answers 200, and
  `npx shadcn@latest add @zui/button` resolves against both a web and a native style.

## Left to the builder

- The host provider's exact interface, and which site components need it.
- How `docs-sidebar`, `docs-toc` and the other site components take their nav items, so `packages/ui`
  imports no context package.
- The split of today's e2e specs that cover both platforms.
- The wording of the 404 pages and of the sitemap index.
