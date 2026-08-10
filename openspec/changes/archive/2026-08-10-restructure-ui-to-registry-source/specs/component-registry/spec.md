## REMOVED Requirements

### Requirement: The npm package remains a parallel, unchanged channel

This requirement is removed. There is no consumer-import npm package; the registry
(`shadcn add`, copy-in) is the sole consumer channel. The "parallel channel" concept
is gone - there is only one channel.

### Requirement: One source feeds both channels

Removed (superseded). With the npm channel gone there are no longer "both" channels;
one source now feeds the single registry channel (see the added "One source feeds the
registry channel").

## MODIFIED Requirements

### Requirement: Components are installable via a shadcn-compatible registry

The workspace MUST expose its components as a shadcn-compatible registry - a
`registry.json` describing each component as a registry item - and a build step MUST
emit static registry JSON that a static host can serve at a per-item URL. This
registry is the **sole** consumer channel: there is no npm-import alternative. A
consumer MUST be able to install a component with `shadcn add <url>`, which copies
the item's source files into the consumer's project.

#### Scenario: The registry build emits a servable item per component

- **WHEN** the registry build runs over the declared registry items
- **THEN** it emits a static JSON file per item at a `/r/<name>.json` path
- **AND** each file validates against the shadcn registry-item schema

#### Scenario: A component installs via the CLI

- **WHEN** a consumer runs `shadcn add <host>/r/<name>.json`
- **THEN** the component's source files are copied into the consumer's project
- **AND** the item's npm `dependencies` are installed and its `registryDependencies` are also added

## ADDED Requirements

### Requirement: The registry is app source, not a consumer-import package

The workspace MUST NOT ship a consumer-import `@zeroxsolutions/ui` package - it is
**deleted**, not merely unpublished. Its component source MUST live as registry
source inside the docs app (`apps/docs-ui/registry/bases/<base>/`), alongside
`registry.json`, `components.json`, and the `shadcn-build` target. No consumer
project imports it; consumers obtain components only by `shadcn add` (copy-in).

#### Scenario: No consumer import surface exists

- **WHEN** the workspace is built
- **THEN** no consumer-importable `@zeroxsolutions/ui` entry exists and it is not published to npm
- **AND** no package declares a publish/release target for the ui

#### Scenario: An internal importer reaches the source directly

- **WHEN** the docs app needs a component for a live preview
- **THEN** it imports the registry source directly via the `@/registry/...` alias
- **AND** that internal import is not part of any consumer contract

### Requirement: One source feeds the registry channel

Registry items MUST be authored from the registry's own `@/`-aliased source - there
MUST be no forked or hand-copied second definition of a component, and no consumer
build that imports the ui as a library. The registry source IS the component source;
the build copies it out for consumers.

#### Scenario: A component has a single definition

- **WHEN** a component's source is changed once
- **THEN** the registry item emitted by the build reflects that change
- **AND** no parallel copy of the component exists for the registry

### Requirement: Component source is organized per-base

The registry source MUST be organized by base under
`apps/docs-ui/registry/bases/<base>/` - mirroring shadcn-ui/ui's
`apps/v4/registry/bases/<base>/` layout. A base holds its primitives in
`bases/<base>/ui/` and its composed components, blocks, and pages in
`bases/<base>/{components,blocks,pages}/`, with `examples/` holding example items and
`lib/`/`hooks/` holding shared helpers. There is NO per-style source folder - style is
a token, not a directory. Each item's `registry.json` entry points at its source files
under the base.

#### Scenario: A primitive lives under its base

- **WHEN** a primitive component (e.g. Button) is authored
- **THEN** its source file lives under `bases/<base>/ui/<primitive>.tsx`
- **AND** its `registry.json` entry's `files` point at that path

#### Scenario: A composed item lives under its base

- **WHEN** a composed component, block, or page is authored
- **THEN** its source file lives under `bases/<base>/{components,blocks,pages}/<slug>.tsx`
- **AND** its `registry.json` entry's `files` point at that path
