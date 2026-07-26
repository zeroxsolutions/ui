# docs-site Specification

## Purpose

Define the Next.js `registry` app that replaces the Storybook host: it documents each component in an isolated live preview, hosts the built component registry at `/r/<name>.json`, deploys to Cloudflare as a static assets-only Worker with no server runtime, and is paired with a Playwright `registry-e2e` project that carries the real-browser interaction, a11y, and visual coverage the jsdom-only library cannot.

## Requirements

### Requirement: A Next.js registry app replaces the Storybook host

The workspace MUST provide a Next.js app named `registry` (`apps/registry`,
`@zeroxsolutions/registry`) and MUST remove the Storybook host
(`@zeroxsolutions/storybook`, its `.storybook/` config, its `@storybook/*`
dependencies, and its `test-storybook` target). The app is named for its essence - the
component registry it hosts and distributes - and also serves the docs. It MUST build
and serve through an `nx` target.

#### Scenario: The Storybook host is gone and the registry app builds

- **WHEN** the workspace is inspected after the change
- **THEN** no Storybook project, `.storybook/` config, `@storybook/*` dependency, or `test-storybook` target remains
- **AND** the `registry` app builds via its `nx` build target

### Requirement: Each documented component renders in an isolated live preview

A documented registry item MUST render in a complete doc page that matches the
`ui.shadcn.com` shape: a live **Preview**, a **Code/Usage** section (the `shadcn add`
command plus an import snippet), a **Props** table, a **Composition** tree, and a
**dark-mode** toggle. The isolated live preview is the Preview section of this page - the
page as a whole is the documentation, not just the render. (See the `registry-ecosystem`
capability for the complete contract.)

#### Scenario: A documented item's page

- **WHEN** a registry item is documented
- **THEN** its page renders the live Preview, the `shadcn add` command and import snippet,
  the Props table, the Composition tree, and a dark-mode toggle.

#### Scenario: A consumer copies the install path

- **WHEN** a consumer opens a documented item's page
- **THEN** they can copy the `shadcn add` command and the import snippet straight from the
  page and install/use the item.

### Requirement: The registry app hosts the component registry

The registry app MUST host the registry, where every item declares a `type` and a
`category`, `shadcn registry validate` runs in the build gate, and the ecosystem grows
from single components to composed `registry:block` and `registry:page` items. (See the
`registry-ecosystem` capability for the type/category/validate/growth contract.)

#### Scenario: The registry ships typed, categorized items

- **WHEN** the registry app is built and deployed
- **THEN** every registry item carries a `type` and a `category`, the build gate runs
  `shadcn registry validate`, and at least one `registry:block` composes existing items.

### Requirement: The registry app deploys as a static site to Cloudflare, with no server runtime

The registry app MUST have no server runtime requirement - it MUST build to a static
export and deploy to Cloudflare through an `nx` target wrapping `wrangler deploy` as an
**assets-only Worker** (`assets.directory` over the static build, no `main`), carrying no
`nodejs_compat` flag and no data bindings. This is the workspace's established static-site
pattern (Workers Static Assets); the production custom domain is declared as a
`routes[].custom_domain` entry under `env.production`.

#### Scenario: The registry app deploys statically

- **WHEN** the deploy target runs
- **THEN** it publishes the static build directory to Cloudflare as static assets
- **AND** the app declares no server binding or `nodejs_compat` flag

### Requirement: The registry app is paired with an e2e project that covers component interaction

The registry app MUST carry a paired `registry-e2e` project (`@zeroxsolutions/registry-e2e`,
Playwright) driving a real browser, invoked through `nx` by its scoped name. Because the
library is jsdom-only, this e2e is where real-browser interaction / a11y / visual
coverage of the components lives (driving the app's isolated previews).

#### Scenario: The registry e2e project runs

- **WHEN** `nx e2e @zeroxsolutions/registry-e2e` is invoked
- **THEN** the e2e suite drives the registry app in a browser
- **AND** it can assert a component's interaction/layout against its isolated preview
