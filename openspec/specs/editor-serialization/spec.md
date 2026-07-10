# editor-serialization Specification

## Purpose

Define serialization for the document editor: structured JSON as the canonical source of truth, a per-node/per-mark codec registry that keeps serialization knowledge with each feature, export to Markdown/HTML/React with configurable fallbacks, two-way import that preserves custom blocks, gated/reported import for migration, and an open set of formats.

## Requirements

### Requirement: JSON Is the Source of Truth

The document's canonical representation MUST be structured JSON. All other formats (HTML, Markdown, React output) are derived views produced from that JSON, and JSON↔JSON round-trips MUST be lossless.

#### Scenario: JSON round-trip is lossless

- **WHEN** a document's JSON is loaded and re-read
- **THEN** the resulting JSON is identical to the input

### Requirement: Per-Node Codec Registry

Serialization knowledge MUST live with each feature as a codec for its node/mark, not in a monolithic serializer. A generic walker MUST delegate to the registered codec for each node type; adding a new block MUST require no change to the walker or editor core.

#### Scenario: New block serializes via its own codec

- **WHEN** a feature registers a codec for its node and the document containing that node is exported
- **THEN** the node is serialized by its feature's codec with no edit to the serializer core

#### Scenario: Marks serialize via mark codecs

- **WHEN** inline text carries formatting marks
- **THEN** each mark's open/close output is applied by its registered mark codec

### Requirement: Export to Markdown, HTML, and React

The registry MUST support exporting a document to Markdown, HTML, and a React tree. A node type without a codec for the requested format MUST use a configurable fallback (skip, render children, or emit text) rather than crashing.

#### Scenario: Missing codec uses fallback

- **WHEN** a document containing a node with no codec for the target format is exported
- **THEN** the configured fallback is applied and export completes without error

### Requirement: Two-Way Import With Custom-Block Preservation

The registry MUST import Markdown and HTML back into document JSON. Markdown import MUST use a token-based path so that custom blocks with non-standard Markdown (e.g. callouts, columns, diagrams) can be reconstructed rather than lost. HTML import MUST reconstruct nodes from their DOM parse rules.

#### Scenario: Custom block survives Markdown import

- **WHEN** Markdown containing a feature's custom-block syntax is imported
- **THEN** the corresponding custom block node is reconstructed in the document JSON

#### Scenario: HTML import reconstructs nodes

- **WHEN** HTML matching features' declared parse rules is imported
- **THEN** the corresponding nodes and marks are reconstructed in the document JSON

### Requirement: Reported, Gated Import for Migration

Import MUST validate produced nodes against their attribute schemas and MUST return a result reporting the document plus any warnings and dropped nodes. Import MUST NOT silently corrupt the document with unvalidated or unmappable content.

#### Scenario: Unmappable content is reported, not silently dropped

- **WHEN** source content contains a construct with no matching codec
- **THEN** the import result lists it under warnings/dropped and the produced document contains only validated nodes

#### Scenario: Invalid attributes are caught on import

- **WHEN** an imported node would carry attributes that violate its schema
- **THEN** the node is coerced or dropped with a warning, and no unvalidated attributes enter the document

### Requirement: Format Extensibility

The set of serialization formats MUST be open. A consumer MUST be able to register codecs for a new format (or a whole-document serializer for an unusual format) without modifying the registry core.

#### Scenario: New format registered

- **WHEN** a consumer registers node codecs for a new named format
- **THEN** documents can be exported to that format using those codecs
