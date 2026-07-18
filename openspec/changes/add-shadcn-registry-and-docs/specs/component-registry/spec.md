## ADDED Requirements

### Requirement: Components are installable via a shadcn-compatible registry

`@zeroxsolutions/ui` MUST expose its components as a shadcn-compatible registry - a
`registry.json` describing each component as a registry item - and a build step MUST
emit static registry JSON that a static host can serve at a per-item URL. A consumer
MUST be able to install a component with `shadcn add <url>`.

#### Scenario: The registry build emits a servable item per component

- **WHEN** the registry build runs over the declared registry items
- **THEN** it emits a static JSON file per item at a `/r/<name>.json` path
- **AND** each file validates against the shadcn registry-item schema

#### Scenario: A component installs via the CLI

- **WHEN** a consumer runs `shadcn add <host>/r/<name>.json`
- **THEN** the component's source files are copied into the consumer's project

### Requirement: The npm package remains a parallel, unchanged channel

The registry MUST be an **additive** second channel. Installing and importing
`@zeroxsolutions/ui` as an npm package (`pnpm add`, subpath `import`) MUST keep working
exactly as before, with no change to the package's `exports` surface.

#### Scenario: The package import channel is unaffected

- **WHEN** a consumer installs `@zeroxsolutions/ui` from npm and imports a component from its subpath
- **THEN** the import resolves exactly as it did before the registry was added
- **AND** no existing subpath export is removed or renamed

### Requirement: One source feeds both channels

Registry items MUST be authored from the **same** `@/`-aliased source that builds the
npm package - there MUST be no forked or hand-copied second definition of a component
for the registry.

#### Scenario: A component has a single definition

- **WHEN** a component's source is changed once
- **THEN** both the npm package build and the registry item reflect that change
- **AND** no parallel copy of the component exists for the registry

### Requirement: Installed components resolve under the consumer's aliases

When a component is installed via `shadcn add`, its `@/` import aliases MUST be
rewritten to the installing project's own `components.json` aliases, so the installed
component compiles in a consumer whose alias configuration differs from this repo's.

#### Scenario: Aliases are rewritten on install

- **WHEN** a component is added into a project whose `components.json` maps `@/` differently
- **THEN** the installed files import through that project's aliases
- **AND** the installed component compiles with no unresolved `@/` import

### Requirement: Composed items declare their registry dependencies

A registry item that composes another component MUST declare that relationship via
`registryDependencies`, so installing the composed item also installs the components it
depends on.

#### Scenario: Installing a composed item pulls its dependencies

- **WHEN** a consumer adds a registry item that composes a primitive component
- **THEN** the CLI also installs that primitive from its registry dependency
- **AND** the composed item resolves its dependency after install
