## REMOVED Requirements

### Requirement: The npm package remains a parallel, unchanged channel

This requirement is removed. `@zeroxsolutions/ui` is no longer a consumer-import
npm package; the registry (`shadcn add`, copy-in) is the sole consumer channel.
The "parallel channel" concept is gone - there is only one channel.

## MODIFIED Requirements

### Requirement: Components are installable via a shadcn-compatible registry

`@zeroxsolutions/ui` MUST expose its components as a shadcn-compatible registry -
a `registry.json` describing each component as a registry item - and a build step
MUST emit static registry JSON that a static host can serve at a per-item URL. This
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

### Requirement: One source feeds the registry channel

Registry items MUST be authored from the registry's own `@/`-aliased source - there
MUST be no forked or hand-copied second definition of a component, and no consumer
build that imports `@zeroxsolutions/ui` as a library. The registry source IS the
component source; the build copies it out for consumers.

#### Scenario: A component has a single definition

- **WHEN** a component's source is changed once
- **THEN** the registry item emitted by the build reflects that change
- **AND** no parallel copy of the component exists for the registry

## ADDED Requirements

### Requirement: The package is registry-source, not a consumer import

`@zeroxsolutions/ui` MUST NOT expose consumer `import` entry points and MUST NOT
be published to npm. It stays as a workspace package - the home of the registry
source, `registry.json`, and the `shadcn-build` target - but no consumer project
imports it. Consumers obtain its components only by `shadcn add` (copy-in).

#### Scenario: No consumer import surface exists

- **WHEN** the package is built
- **THEN** it emits no consumer-importable entry and is not published to npm
- **AND** its `package.json` declares no publish/release target

#### Scenario: An internal importer reaches the source directly

- **WHEN** an in-repo app (e.g. the docs app) needs a component for live preview
- **THEN** it imports the workspace source directly, not a published package name
- **AND** that internal import is not part of any consumer contract

### Requirement: Component source is organized per-style

The registry source MUST be organized per-style so the SDK is multi-style ("da
hinh"): a `bases/<base>/ui/` folder holds the primitive components for a base
library (e.g. Base UI), one `<style>/` folder per named style holds that style's
`components/`, `blocks/`, and `pages/`, and an `examples/` folder holds example
items. Each item's `registry.json` entry points at its per-style source files. The
SDK ships one base plus one style to start; further styles are added later without
restructuring the layout.

#### Scenario: A primitive lives under its base

- **WHEN** a primitive component (e.g. Button) is authored
- **THEN** its source file lives under `bases/<base>/ui/<primitive>.tsx`
- **AND** its `registry.json` entry's `files` point at that path

#### Scenario: A styled item lives under its style

- **WHEN** a styled component, block, or page is authored
- **THEN** its source file lives under `<style>/{components,blocks,pages}/<slug>.tsx`
- **AND** its `registry.json` entry's `files` point at that path

#### Scenario: A new style is added without restructuring

- **WHEN** a new named style is introduced
- **THEN** a new `<style>/` folder is added beside the existing styles
- **AND** no existing base, style, or examples folder is renamed or moved
