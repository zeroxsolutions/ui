## MODIFIED Requirements

### Requirement: A Next.js registry app replaces the Storybook host

The workspace MUST provide a Next.js app named **`docs`** (`apps/docs`,
`@zeroxsolutions/docs`) - renamed from `registry`, because the app is now a docs
site, not only a registry host. It MUST remove the Storybook host
(`@zeroxsolutions/storybook`, its `.storybook/` config, its `@storybook/*`
dependencies, and its `test-storybook` target). It still hosts the shadcn
component registry at `/r/<name>.json`, and it MUST build and serve through an
`nx` target, deploying as a Cloudflare static-assets Worker at
`ui.zeroxsolutions.com`.

#### Scenario: The Storybook host is gone and the docs app builds

- **WHEN** the workspace is inspected after the change
- **THEN** no Storybook project, `.storybook/` config, `@storybook/*` dependency,
  or `test-storybook` target remains
- **AND** the `docs` app (not `registry`) builds via its `nx` build target
- **AND** the shadcn registry still serves at `/r/<name>.json` off the `docs` app

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

## ADDED Requirements

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
