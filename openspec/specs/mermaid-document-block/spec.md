# mermaid-document-block Specification

## Purpose
TBD - created by archiving change add-mermaid-editor-surface. Update Purpose after archive.
## Requirements
### Requirement: Code-block-style header with a view/edit toggle

The in-document Mermaid block SHALL present a header consistent with the sibling code block: the diagram-type identity on the left and, on the right, a single-select view/edit toggle (an eye and a pencil control) plus a copy-source control. The header chrome SHALL be shared between the view and edit states.

#### Scenario: Header offers view and edit

- **WHEN** an editable document renders a Mermaid block
- **THEN** the block shows a header with a diagram-type label on the left and an eye/pencil toggle plus a copy control on the right

#### Scenario: Copy source

- **WHEN** the user activates the header copy control
- **THEN** the block's Mermaid source is copied to the clipboard

### Requirement: Body follows the view/edit toggle

The block body SHALL render the diagram when the view (eye) control is selected and the design system's code-editing surface when the edit (pencil) control is selected. The raw `<textarea>` editing affordance SHALL be removed.

#### Scenario: Eye shows the diagram

- **WHEN** the view control is selected
- **THEN** the body shows the rendered diagram

#### Scenario: Pencil shows the source editor

- **WHEN** the edit control is selected
- **THEN** the body shows the design-system code pane bound to the block's source, and edits update the block's `source`

### Requirement: View/edit is local view state, not document data

The selected view/edit mode SHALL be local view state of the node view and SHALL NOT be persisted to the document. The block's node schema SHALL keep `source` as its only attribute, and the fenced ` ```mermaid ` codec (Markdown/HTML round-trip and SSR `toReact`) SHALL be unchanged.

#### Scenario: Toggling does not change the document

- **WHEN** the user switches between view and edit
- **THEN** the document JSON is unchanged (only `source` edits mutate the document) and serialization round-trips exactly as before

### Requirement: Inserting a block opens it ready to edit

Inserting a Mermaid block (e.g. via the slash command) SHALL open the block in edit mode with the source focused, so the user can type immediately.

#### Scenario: Slash insert lands in edit mode

- **WHEN** the user inserts a Mermaid block from the slash menu
- **THEN** the block opens with the edit (pencil) control selected and the source pane focused

### Requirement: Non-destructive error at rest

When a block's source fails to render in the view state, the block SHALL keep any last good render available and present a compact, recoverable error (with a way to enter edit mode) instead of a raw error block.

#### Scenario: Broken source is recoverable

- **WHEN** a block in view mode holds source that fails to render
- **THEN** the block shows a recoverable error affordance that enters edit mode, rather than a raw red error block

### Requirement: Read-only rendering omits the edit affordance

When the editor is not editable (the read-only viewer), the block SHALL render the diagram without the edit (pencil) control, keeping the reading surface clean and consistent with shared header chrome.

#### Scenario: Viewer has no pencil

- **WHEN** the block renders in a read-only editor/viewer
- **THEN** the diagram is shown and no edit control is offered

### Requirement: Reuse of the surface components

The block SHALL reuse the Mermaid surface's preview and source components rather than a bespoke inline implementation, so both the standalone surface and the block share one rendering and one editing path.

#### Scenario: One shared rendering path

- **WHEN** a diagram renders in the block and in the standalone surface
- **THEN** both use the same preview/render path (same theme handling and non-destructive error behavior)

