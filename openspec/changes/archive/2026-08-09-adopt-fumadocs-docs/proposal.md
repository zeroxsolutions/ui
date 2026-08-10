## Why

The `registry` app's docs shell is hand-rolled - a top-nav-only layout, an index
split by registry type (`components` / `blocks` / `pages`), a bespoke
Preview/Code component, and no persistent sidebar. Surveying the references
(shadcn/ui, Magic UI) shows the standard pattern is the opposite: a docs
framework with a left sidebar, MDX content, and standard sections (Preview ->
Installation -> Usage -> Examples -> Props), with the index organized by
function or A-Z, never by registry type. The hand-rolled shell was assessed as
off-pattern and hard to grow.

The app is now a docs site (fumadocs), not just a registry host, so the
`registry` name no longer fits. fumadocs is the de-facto "shadcn for docs" - MDX
content collections, an App-Router catch-all route, sidebar/TOC/search generated
from the content, and verified static-export support (the app deploys as
Cloudflare Workers Static Assets). Adopting it replaces the bespoke shell with a
standard, maintainable framework and makes fumadocs the project's docs
foundation (not only the component docs), so general docs and the component
docs share one system.

## What Changes

- **Rename the app** `apps/registry` / `@zeroxsolutions/registry` ->
  `apps/docs` / `@zeroxsolutions/docs` (and `apps/registry-e2e` ->
  `apps/docs-e2e`), via the `@nx/workspace:move` generator. The app still hosts
  the shadcn registry at `/r/*.json`; its deploy custom domain is
  `ui.zeroxsolutions.com`.
- Replace the hand-rolled docs shell (`app/(main)/*` RESTful routes +
  `components/docs/*`) with **fumadocs**, installed via Manual Installation
  (`fumadocs-core`, `fumadocs-mdx`, `fumadocs-ui`, the Tailwind plugin). UI
  components and layouts come from the **fumadocs CLI** (`npx fumadocs`), not
  hand-copied.
- fumadocs is the **project docs framework**: content is multi-section (general
  docs + the component/registry docs as one section, via fumadocs multi-docs).
- The **component-docs section is a skeleton only**: the content structure, one
  MDX page template, and registry-specific MDX components - a live Preview
  wired to the `registry:example` items, an Install command block, and a Props
  table (auto-type-table). Existing items are NOT bulk-migrated; the user
  specifies which components become pages. At most one example page is seeded.
- **shadcn primitives** (`packages/ui` `components/ui`) get NO per-component
  page. Instead the general docs carry an **Install the library** guide
  (`pnpm add @zeroxsolutions/ui` + `import { ... } from '@zeroxsolutions/ui'`) -
  the safe way to surface the primitives without per-page docs.
- The shell **composes with the shipped `@zeroxsolutions/ui` Sidebar primitive
  and the monochrome tokens**; fumadocs-ui's default theme colors are not
  adopted wholesale.
- `packages/ui/registry.json` and the `registry:example` mechanism are kept, as
  are the iframe standalone `/preview` routes for block/page fullscreen.
- A **new docs-authoring ruleset** is added under `.agents/rules/` (via the
  rules submodule): how to author MDX with fumadocs components, frontmatter,
  `_meta.json` grouping, live-vs-static preview, and the primitives-get-no-page
  rule.
- `apps/docs-e2e` is rewritten to the new IA.

## Success Criteria

- The app is renamed `docs` (`apps/docs`, `@zeroxsolutions/docs`); no stale
  `registry` project name remains; the deploy target ships at
  `ui.zeroxsolutions.com`.
- Docs render under fumadocs at `/docs` with a left sidebar, right TOC, and
  command-palette search, all generated from the content source.
- The one seeded component-docs page renders a live `<Example/>` (from a
  `registry:example`), the install command, and an auto-generated Props table.
- The general docs include an "Install the library" guide showing
  `import { ... } from '@zeroxsolutions/ui'`.
- No shadcn primitive has a per-component doc page.
- The shadcn registry still serves at `/r/*.json` off the `docs` app.
- The app still builds as a static export and deploys via the existing
  `wrangler deploy` Workers Static Assets target.
- `pnpm nx run-many -t lint typecheck build test` is green.
- The docs-authoring rule exists in `.agents/rules/` and the submodule bump is
  committed.
- `pnpm nx e2e @zeroxsolutions/docs-e2e` is green.

## Non-Goals

- Populating the component docs with every existing item - the user directs
  which components get pages; this change ships the skeleton + one template
  page.
- Per-component doc pages for shadcn primitives (`components/ui`).
- Changing the `registry.json` payload schema or the `registry:example` build.
- Changing the deploy mechanism (still `wrangler deploy` / Workers Static
  Assets).
- Adopting Fumadocs Story (interactive playground) - inline live preview + a
  Props table is enough for now.

## Capabilities

### New Capabilities

None. The docs-authoring rule is a `.agents/rules/` (rules-submodule)
deliverable, not an OpenSpec capability.

### Modified Capabilities

- `docs-site`: the docs framework becomes fumadocs and the app is renamed
  `docs` - content is MDX in `content/**`, rendered through a catch-all route +
  loader with sidebar/TOC/search generated from the source; the site is
  multi-section (general docs + component docs); primitives get an install
  guide, not pages; the component docs are a skeleton the user fills per
  component.

## Impact

- `apps/docs` (from `apps/registry`): rename via `@nx/workspace:move`; rewrite
  the docs shell to fumadocs (new `content/**`, `lib/source`,
  `app/docs/[[...slug]]`, layouts); remove `app/(main)/*` and
  `components/docs/*`; new deps (fumadocs-core, fumadocs-mdx, fumadocs-ui).
- `apps/docs-e2e` (from `apps/registry-e2e`): rename; rewrite specs to the
  `/docs` IA and fumadocs DOM.
- `packages/ui`: unchanged (`registry.json` + `registry:example` kept); the
  `shadcn-build` output path moves to `apps/docs/public/r`.
- `apps/docs/wrangler.jsonc`: `routes[].custom_domain` -> `ui.zeroxsolutions.com`.
- `packages/ui/registry.json`: `homepage` updated to the `ui.zeroxsolutions.com`
  / new pages.dev URL.
- `.agents/rules` submodule: new doc-authoring rule + submodule bump.
- `CLAUDE.md`/`AGENTS.md` workspace inventory: `apps/registry` -> `apps/docs`.
- Build: static export preserved; the gate adds no new failures.
