# docs-site Specification

## Purpose

Define the fumadocs docs site - the Next.js `registry-ui` app (`apps/registry-ui`,
`@zeroxsolutions/registry-ui`) - that replaces the Storybook host. It documents each
component in an isolated live preview authored as MDX and served by fumadocs,
hosts the built shadcn component registry at `/r/<name>.json`, and deploys to
Cloudflare as a static assets-only Worker with no server runtime at
`ui.zeroxsolutions.com`. The site is multi-section - general project docs and
component/registry docs coexist under one fumadocs app - so the registry is one
audience of the docs, not the whole site. It is paired with a Playwright
`registry-ui-e2e` project that carries the real-browser interaction, a11y, and visual
coverage the jsdom-only library cannot.

## Requirements

### Requirement: A Next.js registry app replaces the Storybook host

The workspace MUST provide a Next.js app named **`registry-ui`** (`apps/registry-ui`,
`@zeroxsolutions/registry-ui`) - the UI surface that hosts the shadcn component
registry (the fumadocs docs site is planned to live here too). It MUST remove the Storybook host
(`@zeroxsolutions/storybook`, its `.storybook/` config, its `@storybook/*`
dependencies, and its `test-storybook` target). It still hosts the shadcn
component registry at `/r/<name>.json`, and it MUST build and serve through an
`nx` target, deploying as a Cloudflare static-assets Worker at
`ui.zeroxsolutions.com`.

#### Scenario: The Storybook host is gone and the docs app builds

- **WHEN** the workspace is inspected after the change
- **THEN** no Storybook project, `.storybook/` config, `@storybook/*` dependency,
  or `test-storybook` target remains
- **AND** the `registry-ui` app builds via its `nx` build target
- **AND** the shadcn registry still serves at `/r/<name>.json` off the `registry-ui` app

### Requirement: Each documented component renders in an isolated live preview

A documented registry item (a composed component, a block, or a page - never a
shadcn primitive) MUST render on a page authored as MDX and served by fumadocs.
The page MUST carry, in order: a live **Preview** of the item's
`registry:example`, an **Installation** block with the `shadcn add` command, and
a **Props** table generated from the component's TypeScript types. The page's
sidebar, right table of contents, and command-palette search are generated from
the content source, not hand-built per page.

#### Scenario: A documented item's page

- **WHEN** a registry item is documented
- **THEN** its page is an MDX file rendered through fumadocs
- **AND** the page shows the live Preview, the Installation command, and the
  Props table, in that order
- **AND** the sidebar, table of contents, and search are generated from the
  content, not authored per page

#### Scenario: A consumer copies the install path

- **WHEN** a consumer opens a documented item's page
- **THEN** they can copy the `shadcn add` command straight from the Installation
  block and install the item

#### Scenario: primitives get an install guide, not pages

- **WHEN** the docs content is inspected
- **THEN** no shadcn primitive under `components/ui` has a per-component doc page
- **AND** the general docs include an "Install the library" guide showing
  `import { ... } from '@zeroxsolutions/ui'`

### Requirement: The docs app hosts the component registry

The docs app MUST host the registry, where every item declares a `type` and a
`category`, `shadcn registry validate` runs in the build gate, and the ecosystem
grows from single components to composed `registry:block` and `registry:page`
items. (See the `registry-ecosystem` capability for the type/category/validate/
growth contract.)

#### Scenario: The registry ships typed, categorized items

- **WHEN** the docs app is built and deployed
- **THEN** every registry item carries a `type` and a `category`, the build gate
  runs `shadcn registry validate`, and at least one `registry:block` composes
  existing items.

### Requirement: The docs app deploys as a static site to Cloudflare, with no server runtime

The docs app MUST have no server runtime requirement - it MUST build to a static
export and deploy to Cloudflare through an `nx` target wrapping
`wrangler deploy` as an **assets-only Worker** (`assets.directory` over the
static build, no `main`), carrying no `nodejs_compat` flag and no data bindings.
This is the workspace's established static-site pattern (Workers Static Assets);
the production custom domain (`ui.zeroxsolutions.com`) is declared as a
`routes[].custom_domain` entry under `env.production`.

#### Scenario: The docs app deploys statically

- **WHEN** the deploy target runs
- **THEN** it publishes the static build directory to Cloudflare as static
  assets at `ui.zeroxsolutions.com`
- **AND** the app declares no server binding or `nodejs_compat` flag

### Requirement: The registry-ui app is paired with an e2e project that covers component interaction

The registry-ui app MUST carry a paired `registry-ui-e2e` project
(`@zeroxsolutions/registry-ui-e2e`, Playwright) driving a real browser, invoked through
`nx` by its scoped name. Because the library is jsdom-only, this e2e is where
real-browser interaction / a11y / visual coverage of the components lives
(driving the app's isolated previews).

#### Scenario: The registry-ui e2e project runs

- **WHEN** `nx e2e @zeroxsolutions/registry-ui-e2e` is invoked
- **THEN** the e2e suite drives the registry-ui app in a browser
- **AND** it can assert a component's interaction/layout against its isolated
  preview

### Requirement: The docs site runs on fumadocs

The docs site MUST be a fumadocs app: content authored as MDX under
`content/**`, wired through a `loader` source, and rendered by a catch-all
`/docs` route. It MUST build as a Next.js static export with no server runtime,
so it deploys unchanged through the existing Workers Static Assets target.

#### Scenario: fumadocs serves the docs

- **WHEN** a visitor opens any `/docs/...` path
- **THEN** fumadocs resolves the MDX page from the content source and renders it

#### Scenario: the docs build is still a static export

- **WHEN** the build target runs
- **THEN** the docs site builds as a static export with no server binding
- **AND** it deploys through the existing Workers Static Assets target

### Requirement: The docs site is multi-section, not registry-only

The docs site MUST host more than the component registry: general project docs
and the component/registry docs are separate sections under one fumadocs app
(multi-docs / multiple sources), so the registry is one audience of the docs,
not the whole site.

#### Scenario: general docs and the component docs coexist

- **WHEN** the docs site is built
- **THEN** it serves a general docs section and a component-docs section
- **AND** each section has its own navigation subtree generated from its content

### Requirement: The component docs framework is item-agnostic

The component docs MUST ship as a reusable framework - the content structure,
one MDX page template, and the registry MDX components (Preview, Installation,
Props) - decoupled from which items are documented. Adding a component's page
MUST NOT require a change to the docs framework, route, or layout; it is a new
MDX page written against the template.

#### Scenario: adding a component page needs no framework change

- **WHEN** a new registry item is chosen for documentation
- **THEN** it is added as an MDX page using the existing template and components
- **AND** no change to the docs framework, route, or layout is required
