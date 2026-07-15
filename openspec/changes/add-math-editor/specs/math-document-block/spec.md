## ADDED Requirements

### Requirement: Block math uses a code-block-style header with a view/edit toggle

The in-document math **block** (`mathBlock`) SHALL present a header consistent with the sibling code and Mermaid blocks: a math identity label on the left and, on the right, a single-select view/edit toggle (an eye and a pencil control) plus a copy-source control. The header chrome SHALL be shared between the view and edit states.

#### Scenario: Header offers view and edit

- **WHEN** an editable document renders a math block
- **THEN** the block shows a header with a math label on the left and an eye/pencil toggle plus a copy control on the right

#### Scenario: Copy source

- **WHEN** the user activates the header copy control
- **THEN** the block's LaTeX source is copied to the clipboard

### Requirement: Block body follows the view/edit toggle with a live preview

The block body SHALL render the formula when the view (eye) control is selected, and the design-system code-editing surface together with a live preview when the edit (pencil) control is selected. The raw `<textarea>` editing affordance SHALL be removed.

#### Scenario: Eye shows the formula

- **WHEN** the view control is selected
- **THEN** the body shows the rendered formula

#### Scenario: Pencil shows the source editor and a live preview

- **WHEN** the edit control is selected
- **THEN** the body shows the design-system code pane bound to the block's `latex` plus a live preview that updates as the source changes, and edits update the block's `latex`

### Requirement: Inline math is authorable in the text flow

The in-document math **inline** node (`mathInline`) SHALL be editable without leaving the text flow: activating it SHALL open a design-system popover holding a compact LaTeX input, a live one-line preview, and access to the palette, so a user can edit an inline formula in place. The raw inline `<input>` affordance SHALL be removed.

#### Scenario: Activating inline math opens an in-flow editor

- **WHEN** the user activates an inline math node in an editable document
- **THEN** a popover opens anchored to the formula with a compact source input, a live preview, and palette access, and committing updates the node's `latex`

#### Scenario: Inline editing does not disturb surrounding text

- **WHEN** the user edits and commits an inline formula
- **THEN** only that node's `latex` changes and the surrounding paragraph text is unchanged

### Requirement: View/edit and collapse are local view state, not document data

The selected view/edit mode and the collapsed state SHALL be local view state of the node view and SHALL NOT be persisted to the document. The block's node schema SHALL keep `latex` as its only attribute, and the `$$…$$` / `$…$` / `data-latex` codecs (Markdown/HTML round-trip and SSR `toReact`) SHALL be unchanged.

#### Scenario: Toggling does not change the document

- **WHEN** the user switches between view and edit or collapses the block
- **THEN** the document JSON is unchanged (only `latex` edits mutate the document) and serialization round-trips exactly as before

### Requirement: Inserting a block opens it ready to edit

Inserting a math block (e.g. via the slash command) SHALL open the block in edit mode with the source focused, so the user can type immediately. Inline insertion SHALL likewise open the inline editor ready to type.

#### Scenario: Slash insert lands in edit mode

- **WHEN** the user inserts a math block from the slash menu
- **THEN** the block opens with the edit (pencil) control selected and the source pane focused

### Requirement: Read-only rendering omits the edit affordance

When the editor is not editable (the read-only viewer) and for the static export, the block and inline node SHALL render the real formula without the edit affordance. Because KaTeX is synchronous and SSR-safe, the read-only and export paths SHALL render the formula itself, not a source fallback.

#### Scenario: Viewer has no pencil

- **WHEN** a math block renders in a read-only editor/viewer
- **THEN** the formula is shown and no edit control is offered

#### Scenario: Static export renders the formula

- **WHEN** a math node is serialized by its `toReact` codec
- **THEN** the exported output is the rendered KaTeX formula, not the raw source

### Requirement: The block reuses the surface components

The block SHALL reuse the math surface's preview and source components rather than a bespoke inline implementation, so the standalone surface and the block share one render path and one editing path (same theme handling and same non-destructive error behavior).

#### Scenario: One shared render path

- **WHEN** a formula renders in the block and in the standalone surface
- **THEN** both use the same preview/render path

### Requirement: Block is collapsible from its header without tearing down the render

The in-document math block SHALL be collapsible from its header via a collapse control placed alongside the copy control. Collapsing SHALL fold the active view/edit panel to header-only and SHALL keep the rendered formula mounted (hidden, not unmounted) so folding or unfolding never tears down an in-flight render. The collapsed state SHALL be local view state and SHALL NOT be persisted.

#### Scenario: Collapsing folds the block to its header

- **WHEN** the block is expanded and the user activates the collapse control
- **THEN** the body is hidden and only the header remains visible

#### Scenario: Collapsing keeps the formula mounted

- **WHEN** the user collapses and then expands the block, including across view/edit toggles
- **THEN** the rendered formula remains available and no render error occurs
