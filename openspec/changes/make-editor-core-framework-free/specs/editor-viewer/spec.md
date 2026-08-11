## MODIFIED Requirements

### Requirement: Static, Server-Safe Viewer

A static Viewer MUST render stored document JSON to a React tree without instantiating the editing engine, so it is safe to import and render on the server. The React tree is produced entirely by the chrome: the chrome owns the React serialization walker and the per-node React codecs, and core supplies only the canonical document JSON. Core serialization has no React output and no React dependency; the Viewer does not require one to exist.

#### Scenario: Viewer renders without the engine

- **WHEN** document JSON is rendered by the static Viewer
- **THEN** the output is produced without creating an editable engine instance and does not require a browser-only editor runtime

#### Scenario: Viewer reflects registered features

- **WHEN** a document contains a block from a registered feature
- **THEN** the static Viewer renders it using that feature's chrome-owned React codec

#### Scenario: Core supplies JSON, chrome supplies React

- **WHEN** the Viewer renders a document
- **THEN** it reads the canonical JSON from core and maps it to a React tree through codecs that live in the chrome, with core contributing no React element and importing no `react`
