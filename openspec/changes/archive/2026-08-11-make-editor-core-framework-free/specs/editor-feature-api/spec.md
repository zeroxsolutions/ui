## MODIFIED Requirements

### Requirement: Engine-Free Node View Contract

A feature's interactive block view MUST receive a contract of validated attributes, an attribute-update function, selection state, a façade editor handle, and (for content-bearing nodes) an editable content slot - with no engine types in that contract. The contract is also framework-free at core: any slot whose value is a rendered view or icon (the view's return value, the editable content slot, a contributed icon) is opaque (`unknown`) in the core type, so the core published contract names no UI-framework type. The concrete React typing for those slots is supplied by the chrome; core never imports `react`.

#### Scenario: Node view updates its own attributes

- **WHEN** a block view calls its attribute-update function with a partial patch
- **THEN** the block's attributes update through the change model without the view importing the engine

#### Scenario: View contract carries no UI-framework type

- **WHEN** a feature author programs against the core node-view contract
- **THEN** the contract's view-returning and content-slot members are opaque at core, and the author obtains their concrete React types from the chrome rather than from `react` via core

## ADDED Requirements

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
