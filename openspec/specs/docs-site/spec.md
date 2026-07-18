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

The registry app MUST render each documented component in an **isolated live preview** -
the component rendered on its own, apart from page chrome - so it serves as the design
and development sandbox that Storybook provided, and as the surface the `registry-e2e`
tests drive.

#### Scenario: A component page shows an isolated live render

- **WHEN** a reader opens a component's docs page
- **THEN** the component is rendered live and interactable
- **AND** the preview is isolated from the surrounding navigation and chrome

### Requirement: The registry app hosts the component registry

The registry app MUST serve the built component registry at `/r/<name>.json`, so the
same deployment that documents a component also distributes it via `shadcn add`.

#### Scenario: A registry item is served from the deployment

- **WHEN** a client requests `/r/<name>.json` from the registry app
- **THEN** it receives the built registry item for that component

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
