# editor-feature-api Specification

## Purpose

Define the declarative feature API through which blocks, marks, behavior, serialization, and UI are contributed to the editor without exposing the underlying engine — enabling third-party extensibility, schema-validated attributes and command arguments, engine-free node views, and a single opt-in advanced escape hatch.
## Requirements
### Requirement: Declarative Feature Definition

A feature MUST be defined declaratively through a single `defineFeature` entry that bundles the block/mark it contributes together with its behavior, serialization, and UI. Defining a feature MUST NOT require importing or referencing the underlying engine.

#### Scenario: Feature authored without engine imports

- **WHEN** an author defines a feature using only the SDK's feature API
- **THEN** the feature compiles and registers with no direct dependency on `@tiptap/*` or `prosemirror-*`

#### Scenario: One feature contributes all its facets

- **WHEN** a feature declares a node, its commands, its codec, and its slash/toolbar entries
- **THEN** registering that one feature makes the block editable, serializable, importable, and insertable via its UI, with no edits to editor core

### Requirement: Third-Party Extensibility Without Engine Exposure

A third party MUST be able to publish a feature package that depends only on `@zeroxsolutions/editor`. Installing and registering such a feature MUST NOT introduce a second engine instance.

#### Scenario: External feature depends only on the SDK

- **WHEN** a third-party feature package is authored with the declarative API
- **THEN** its only editor-related dependency is `@zeroxsolutions/editor`, and consuming it does not add a duplicate engine/document-model instance to the app

### Requirement: Schema-Validated Attributes and Command Arguments

Node/mark attributes and command arguments MUST be declared as schemas from which the static type, defaults, and runtime validation are all derived. A single schema declaration MUST serve as the source of the attribute type.

#### Scenario: Attribute type derives from its schema

- **WHEN** a feature declares a node's attributes as a schema
- **THEN** the node's view receives statically-typed attributes matching that schema, with declared defaults applied

#### Scenario: Invalid attributes are rejected at a boundary

- **WHEN** attributes that violate the schema are produced during import or via a consumer API call
- **THEN** they are rejected or coerced at that boundary and never enter the document unchecked

### Requirement: Engine-Free Node View Contract

A feature's interactive block view MUST receive a contract of validated attributes, an attribute-update function, selection state, a façade editor handle, and (for content-bearing nodes) an editable content slot - with no engine types in that contract. The contract is also framework-free at core: any slot whose value is a rendered view or icon (the view's return value, the editable content slot, a contributed icon) is opaque (`unknown`) in the core type, so the core published contract names no UI-framework type. The concrete React typing for those slots is supplied by the chrome; core never imports `react`.

#### Scenario: Node view updates its own attributes

- **WHEN** a block view calls its attribute-update function with a partial patch
- **THEN** the block's attributes update through the change model without the view importing the engine

#### Scenario: View contract carries no UI-framework type

- **WHEN** a feature author programs against the core node-view contract
- **THEN** the contract's view-returning and content-slot members are opaque at core, and the author obtains their concrete React types from the chrome rather than from `react` via core

### Requirement: Behavior and UI Contributions

A feature MAY contribute input rules, keyboard shortcuts, slash-menu items, toolbar/bubble items, and block-menu items. Contributed UI MUST be rendered from the house design system.

#### Scenario: Slash entry inserts the block

- **WHEN** a feature contributes a slash item and the user selects it
- **THEN** the feature's insert command runs and the block appears

#### Scenario: Input rule creates the block

- **WHEN** a user types the feature's declared input pattern
- **THEN** the corresponding block is created

### Requirement: Feature Dependencies

A feature MAY declare dependencies on other features by id. Registration MUST fail clearly when a declared dependency is absent.

#### Scenario: Missing dependency reported

- **WHEN** a feature declaring a dependency is registered without that dependency present
- **THEN** registration fails with an error identifying the missing feature

### Requirement: Single Advanced Engine Escape

The only path that exposes engine primitives MUST be an explicit, opt-in `advanced` surface (raw engine plugins/extensions). This surface MUST be documented as unstable and outside the SemVer-stable contract.

#### Scenario: Advanced escape is opt-in and isolated

- **WHEN** a feature uses the advanced escape to supply a raw engine plugin
- **THEN** engine types appear only through that opt-in surface, and the declarative path remains engine-free

### Requirement: Validate at Boundaries, Trust the Interior

Schema validation MUST run at untrusted boundaries — import, remote deltas, consumer API calls, and (in development) feature registration — and MUST NOT run per keystroke on internally-generated edits.

#### Scenario: Hot path is not re-validated

- **WHEN** a user types, producing internally-generated edits from already-validated commands
- **THEN** those edits are applied without re-running attribute schema validation on each keystroke

### Requirement: Framework-Free Published Contract

The `editor-core` package MUST be framework-free: its source imports no `react`, its `package.json` declares no `react` dependency or peerDependency, and its emitted `.d.ts` files contain no `ReactNode` (or any other `react` type) reference. A consumer MUST be able to depend on the engine contract without `react` in their type graph. React serialization, React node views, and React typing for the opaque contract slots are supplied by the chrome.

#### Scenario: Core source has no react import

- **WHEN** the editor-core source tree is searched for imports from `react`
- **THEN** zero matches are found - neither type-only nor runtime

#### Scenario: Published declarations carry no ReactNode

- **WHEN** the editor-core build emits its `.d.ts` files
- **THEN** no emitted declaration file references `ReactNode` or any `react` type, and `editor-core`'s `package.json` has no `react` in `dependencies`, `peerDependencies`, or `devDependencies`

#### Scenario: Engine contract usable without react

- **WHEN** a consumer depends on `@zeroxsolutions/editor-core` and programs against the engine/feature contract
- **THEN** the contract typechecks without `react` or `@types/react` installed, because core's published types name no React type

