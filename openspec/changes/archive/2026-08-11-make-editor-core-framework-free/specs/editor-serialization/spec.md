## REMOVED Requirements

### Requirement: Export to Markdown, HTML, and React

The registry MUST support exporting a document to Markdown, HTML, and a React tree. A node type without a codec for the requested format MUST use a configurable fallback (skip, render children, or emit text) rather than crashing.

#### Scenario: Missing codec uses fallback

- **WHEN** a document containing a node with no codec for the target format is exported
- **THEN** the configured fallback is applied and export completes without error

## ADDED Requirements

### Requirement: Export to Markdown and HTML

The core registry MUST support exporting a document to Markdown and HTML (and to any consumer-registered custom string format). A node type without a codec for the requested format MUST use a configurable fallback (skip, render children, or emit text) rather than crashing. The `'react'` value is no longer part of the core `Format` set; a React tree is not produced by core serialization - it is produced by the chrome Viewer from the document JSON (see the `editor-viewer` capability).

#### Scenario: Missing codec uses fallback

- **WHEN** a document containing a node with no codec for the target format is exported
- **THEN** the configured fallback is applied and export completes without error

#### Scenario: Core serialization produces no React

- **WHEN** the core serialize walker is invoked over a document
- **THEN** it produces Markdown or HTML strings (or a registered custom string format) and never a React element, and the core `Format` set contains no `'react'` value
