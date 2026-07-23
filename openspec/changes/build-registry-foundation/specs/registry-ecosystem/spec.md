## ADDED Requirements

### Requirement: Every registry item declares a type and a category

Each registry item MUST declare a `type` - one of `registry:ui`, `registry:component`,
`registry:block`, `registry:page`, or `registry:example` - and a `category`, so the
catalog can be filtered and the ecosystem can grow beyond single components.

#### Scenario: A new item is added to the registry

- **WHEN** a component, block, or page is added to `registry.json`
- **THEN** its entry declares a `type` and a `category` before it ships.

#### Scenario: The catalog is filtered

- **WHEN** a consumer browses the registry by kind or group
- **THEN** every item can be selected by its `type` and `category`, because both fields are
  present on every item.

### Requirement: The registry validates against the shadcn schema in the build gate

The build gate MUST run `shadcn registry validate` so a malformed `registry.json` - a
missing required field, a bad `type`, a dangling `registryDependencies` - fails the build
before it ships.

#### Scenario: A registry entry is malformed

- **WHEN** a registry entry misses a required field or breaks the shadcn registry schema
- **THEN** `shadcn registry validate` fails the build, and the entry is not shipped.

### Requirement: Each documented item has a complete doc page

Each documented registry item MUST have a page in the registry app that matches the
`ui.shadcn.com` shape: a live **Preview**, a **Code/Usage** section (the `shadcn add`
command plus an import snippet), a **Props** table, a **Composition** tree (the
`Parent -> Part` structure), and a **dark-mode** toggle. The isolated live preview is one
section of this page, not the whole page.

#### Scenario: A documented item's page

- **WHEN** a registry item is documented
- **THEN** its page renders the live Preview, the `shadcn add` command and import snippet,
  the Props table, the Composition tree, and a dark-mode toggle.

#### Scenario: A consumer copies the install path

- **WHEN** a consumer opens a documented item's page
- **THEN** they can copy the `shadcn add` command and the import snippet straight from the
  page and install/use the item.

### Requirement: The ecosystem grows from components to blocks and pages

The registry MUST support assembling single components into `registry:block` items and
`registry:page` items, so the catalog grows from primitives and components to composed
blocks and full pages that other apps `shadcn add`. A block composes existing
`registry:ui` / `registry:component` items and declares its `registryDependencies`.

#### Scenario: A block is composed from components

- **WHEN** a block is authored
- **THEN** it ships as a `registry:block` whose files compose existing items and declares
  its `registryDependencies` on them.

#### Scenario: A page is authored

- **WHEN** a page is authored
- **THEN** it ships as a `registry:page` composed from blocks and components, extending the
  ecosystem to full page regions.
