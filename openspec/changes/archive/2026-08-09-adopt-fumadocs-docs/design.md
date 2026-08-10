## Context

`apps/registry` is a Next.js 16.1.6 App Router app, React 19, Tailwind v4
(`@tailwindcss/postcss`), `lucide-react`, building to a static export deployed
as Cloudflare Workers Static Assets (`wrangler deploy`, no server runtime). It
currently carries a hand-rolled docs shell - `app/(main)/*` RESTful routes
(`components|blocks|pages` + `[slug]`) and `components/docs/*`
(`site-header`, `doc-catalog`, `entry-detail`, `section-list`,
`animated-backdrop`, `dark-mode-toggle`) - plus standalone
`app/preview/[kind]/[slug]` iframe routes. `packages/ui` owns `registry.json`
(23 items) and the `registry:example` build (`@zeroxsolutions/ui:shadcn-build`
emits `/r/<name>.json`).

fumadocs (verified: `fumadocs-core` logic, `fumadocs-mdx` content source,
`fumadocs-ui` theme, a `fumadocs` CLI for components/layouts, App-Router
catch-all rendering, generated sidebar/TOC/search, and documented static-export
support) replaces the hand-rolled shell.

## Goals / Non-Goals

**Goals:**

- fumadocs is the docs framework; content is MDX rendered through a catch-all
  route with nav/TOC/search generated from the source.
- Multi-section: general project docs and the registry are distinct sections.
- The registry ships as a skeleton (structure + template + MDX components);
  items are added per directive, not bulk-migrated.
- shadcn primitives stay undocumented.
- The shell uses the monochrome tokens; fumadocs-ui's default colors are not
  adopted wholesale.
- `registry.json`, the `registry:example` build, and the iframe `/preview`
  routes are preserved.
- A docs-authoring rule lands in `.agents/rules/`.

**Non-Goals:**

- Documenting every existing registry item (one template page only).
- Documenting `components/ui` primitives.
- Changing the registry payload or the deploy mechanism.
- Fumadocs Story (interactive playground) - inline preview + Props table first.

## Decisions

### D1. Install via Manual Installation + the fumadocs CLI

The app already exists, so use fumadocs **Manual Installation** (add
`fumadocs-core`, `fumadocs-mdx`, `fumadocs-ui`; wire the Tailwind plugin and the
content-collection config), and use the **`npx fumadocs` CLI** to pull UI
components and the docs layout rather than hand-copying. Pinned through the
pnpm `catalog:` once shared.

### D2. Two content sources for multi-section

Two fumadocs `loader` sources, each its own DocsLayout + sidebar:

- `content/docs/**` -> source `docs`, baseUrl `/docs` (general project docs).
- `content/registry/**` -> source `registry`, baseUrl `/registry` (the component
  registry; sub-folders `components/`, `blocks/`, `pages/`).

A shared root layout carries the top nav (wordmark, section switch, theme
toggle, GitHub). `_meta.json` per folder drives the sidebar grouping/order.

### D3. A registry item page is MDX + three MDX components

`content/registry/<kind>/<slug>.mdx` with frontmatter (`title`, `description`,
`example`, `item`) and, in order:

- `<Preview example="..." />` - renders the live `registry:example` inline for
  components, or via the iframe `/preview/<kind>/<slug>` for blocks/pages.
- `<Install name="..." />` - the package-manager toggle + `shadcn add` command
  (ported from the existing `Installation` component).
- `<Props of="..." />` - the Props table from the component's TypeScript types
  (fumadocs `auto-type-table`/`TypeTable`; exact API verified at apply).

One seeded page (the item the user names) is the template; the rest are added
later by writing MDX against it - no framework change (see spec).

### D4. Keep the iframe `/preview/[kind]/[slug]` routes

Unchanged - the standalone preview route powers block/page fullscreen and the
`<Preview>` iframe mode. Components preview inline.

### D5. Theme = monochrome tokens, not fumadocs-ui defaults

fumadocs-ui's color tokens are remapped to the workspace's monochrome scale
(grayscale + `--destructive`); its layout chrome is kept where it is
purpose-built (TOC, search, code blocks), and the navigation composes with the
`@zeroxsolutions/ui` Sidebar primitive per directive #5. The exact seam between
fumadocs-ui's DocsLayout and our Sidebar is the open question below.

### D6. docs-authoring rule in the rules submodule

A new rule (e.g. `.agents/rules/doc-authoring.md`) is authored in the
`zeroxsolutions/nx-cloudflare-in-house-rules` repo, tagged, and pulled via a
submodule bump - the same channel as every other rule. It standardizes MDX
authoring: the fumadocs component for each job (Callout/Steps/Tabs/Cards/
CodeBlock/TypeTable), frontmatter, `_meta.json` grouping, live-vs-static
preview, and the primitives rule (primitives get an install/import guide, not
per-component pages).

### D7. Rename the app `registry` -> `docs`

The app is renamed `apps/registry` / `@zeroxsolutions/registry` ->
`apps/docs` / `@zeroxsolutions/docs` (and the e2e pair -> `apps/docs-e2e` /
`@zeroxsolutions/docs-e2e`) via the `@nx/workspace:move` generator - never a
raw `mv` (the project identity spans folder, `package.json#name`, tsconfig
refs, and nx graph edges). The shadcn registry (`/r/*.json`,
`packages/ui/registry.json`) is unchanged in concept; it is just served by the
`docs` app. The deploy custom domain is `ui.zeroxsolutions.com`; the
`shadcn-build` output path and `registry.json#homepage` are repointed to the
`docs` app, and `CLAUDE.md`/`AGENTS.md` workspace inventory is updated.

### D8. Primitives surface as an install guide, not pages

shadcn primitives (`components/ui`) get NO per-component doc page. The general
docs carry one **"Install the library"** page (`pnpm add @zeroxsolutions/ui` +
`import { ... } from '@zeroxsolutions/ui'`) - the safe way to surface the
primitives without the per-page docs that drift. Composed/registry items remain
the only things with full pages.

## Risks / Trade-offs

- **fumadocs-ui theme vs our Sidebar/tokens** - fumadocs-ui's DocsLayout is
  purpose-built; forcing our Sidebar in fights it, but the directive asks for
  our primitive. Surfaced as Open Question Q1.
- **Static export + dynamic catch-all** - fumadocs supports `output: 'export'`,
  but the build must keep SSG-ing every MDX route with no server binding; verify
  at apply and add `generateStaticParams` if needed.
- **Next 16 / React 19 compatibility** - verify the fumadocs version against the
  installed Next/React at apply (house-libs-catalog: trust the installed
  artifact, not memory).
- **Removing the redesign code** - `app/(main)/*` and `components/docs/*` are
  deleted, but `app/preview/*` and `packages/ui` are untouched.

## State Model

Content-source driven; no meaningful runtime state. The MDX files + `_meta.json`
+ `registry.json` are the single sources; the `loader` turns them into the nav
tree, TOC, and search index at build time.

## Migration Plan

1. Rename `apps/registry` -> `apps/docs` (+ e2e) via `@nx/workspace:move`;
   repoint `shadcn-build` output, `registry.json#homepage`, the wrangler
   `custom_domain` (`ui.zeroxsolutions.com`), and the CLAUDE/AGENTS inventory.
2. Manual-install fumadocs into `apps/docs`; pull the docs layout + components
   via the CLI.
3. Add the two sources (`docs`, `registry`), the root + docs + registry layouts,
   theme the tokens monochrome.
4. Build the registry MDX components (`Preview`, `Install`, `Props`); seed one
   template page; add the general-docs "Install the library" guide
   (`import { ... } from '@zeroxsolutions/ui'`).
5. Remove `app/(main)/*` and `components/docs/*`; keep `app/preview/*`.
6. Author the docs-authoring rule in the rules repo; bump the submodule.
7. Rewrite `apps/docs-e2e` to the `/docs` + `/registry` IA and fumadocs DOM.
8. `pnpm nx run-many -t lint typecheck build test` + `nx e2e` green.

## Open Questions

- **Q1 (theme seam)**: RESOLVED at apply - adopt fumadocs-ui's DocsLayout and
  remap only its color tokens to monochrome (Option A). The "compose with our
  Sidebar primitive" goal is deferred until a real docs-nav need exceeds
  fumadocs' own nav.
- **Q2 (registry route)**: `/registry/<kind>/<slug>` (separate source, as
  designed) or nest it under `/docs/registry/...`?
- **Q3 (Props API)**: confirm fumadocs' current Props-from-TS component
  (`auto-type-table` vs `TypeTable`) against the installed version at apply.
- **Q4 (seed item)**: RESOLVED at apply - `split-button` (a composed
  `registry:component`, with `split-button-hero` for the live Preview).
