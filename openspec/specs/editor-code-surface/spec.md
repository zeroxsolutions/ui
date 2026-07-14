# editor-code-surface Specification

## Purpose

Define where the CodeMirror-based code editing surface lives and how the editor's
standalone multi-file code surface is composed. The editable code pane and the
`@codemirror/*` dependencies belong to `@zeroxsolutions/editor`, not the design system;
the multi-file surface routes each classified file to the right viewer, composing the
design-system previews forward. The relocation keeps the dependency edge one-directional
(`@editor → @ui`) with a single shared Shiki highlighter instance.

## Requirements

### Requirement: The editor package owns the CodeMirror editing pane

`@zeroxsolutions/editor` MUST provide the CodeMirror-based text editing surface (the
`CodeMirrorPane` seam) as an in-package component, themed to the editor theme tokens.
`@zeroxsolutions/ui` MUST NOT ship a CodeMirror editing surface, and the `@codemirror/*`
dependencies MUST belong to `@editor`, not `@ui`.

#### Scenario: The editing pane resolves from the editor package

- **WHEN** a caller needs an editable, syntax-highlighted text surface
- **THEN** it resolves the `CodeMirrorPane` from `@zeroxsolutions/editor`
- **AND** no CodeMirror import or `@codemirror/*` dependency remains in `@zeroxsolutions/ui`

#### Scenario: The pane serves both edit and read-only modes

- **WHEN** the pane is rendered read-only
- **THEN** it displays the document with no cursor and rejects edits, using the same
  syntax highlighting it uses when editable

### Requirement: A multi-file code surface routes each file to the right viewer

`@zeroxsolutions/editor` MUST provide a standalone multi-file code surface that routes an
already-classified file to the correct viewer: a code file to the editing pane, and a
non-code file (markdown, image, font, binary) to a design-system preview. The surface MUST
compose those previews from `@zeroxsolutions/ui`, never re-implement them.

#### Scenario: A code file routes to the editing pane

- **WHEN** the active file is classified as code
- **THEN** the surface renders it in the `CodeMirrorPane`, filling the height it is given

#### Scenario: A scrollable preview pane uses the design-system scroll surface

- **WHEN** the active file is markdown or a font preview whose content overflows
- **THEN** the pane scrolls through the design-system `ScrollArea`, not a raw
  `overflow-auto` element

### Requirement: The editor imports the design system forward only

The relocation MUST NOT introduce a `@zeroxsolutions/ui → @zeroxsolutions/editor`
dependency edge. `@editor` composes `@ui` forward; the shared Shiki highlighting
foundation stays in `@ui` and is consumed forward, so exactly one highlighter instance
exists across the workspace.

#### Scenario: No back-dependency from the design system to the editor

- **WHEN** the dependency graph is inspected after the move
- **THEN** `@zeroxsolutions/ui` has no import of `@zeroxsolutions/editor`
- **AND** the Shiki highlighter is instantiated once, in `@ui`, and reused by `@editor`
