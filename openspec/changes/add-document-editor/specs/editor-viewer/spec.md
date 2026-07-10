## ADDED Requirements

### Requirement: Static, Server-Safe Viewer

A static Viewer MUST render stored document JSON to a React tree without instantiating the editing engine, so it is safe to import and render on the server. It MUST reuse the same per-node codecs (React output) that the feature registry provides.

#### Scenario: Viewer renders without the engine

- **WHEN** document JSON is rendered by the static Viewer
- **THEN** the output is produced without creating an editable engine instance and does not require a browser-only editor runtime

#### Scenario: Viewer reflects registered features

- **WHEN** a document contains a block from a registered feature
- **THEN** the static Viewer renders it using that feature's React codec

### Requirement: Read-Only Live Viewer

A read-only live Viewer MUST render the document using the interactive block views with editing disabled, for cases needing live interactions (e.g. collapsible toggles, code copy, diagram interactions) that a static render cannot provide.

#### Scenario: Read-only viewer forbids edits

- **WHEN** a user interacts with content in the read-only live Viewer
- **THEN** content cannot be mutated, while feature-provided read interactions remain available

### Requirement: Shared Feature Registry Across Surfaces

The Editor, the static Viewer, and the read-only live Viewer MUST draw from the same feature registry so that a block behaves and renders consistently across all three.

#### Scenario: One feature, consistent across surfaces

- **WHEN** a feature is registered
- **THEN** its block is editable in the Editor and renders equivalently in both Viewers with no separate re-registration

### Requirement: Independently Themeable Viewer

A Viewer MUST accept its own theme independent of any editor instance, so read-only content can be presented in a different appearance (e.g. always-dark) than an editing surface.

#### Scenario: Viewer themed independently

- **WHEN** a Viewer is given a theme different from the editing surface
- **THEN** it renders with that theme without affecting any editor instance
