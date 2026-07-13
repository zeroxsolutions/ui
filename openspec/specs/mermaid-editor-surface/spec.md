# mermaid-editor-surface Specification

## Purpose
TBD - created by archiving change add-mermaid-editor-surface. Update Purpose after archive.
## Requirements
### Requirement: Split source-and-preview authoring surface

The surface SHALL expose a `<MermaidEditor>` that presents a Mermaid source pane and a rendered-diagram preview together, so a user can author diagram text and see the result without leaving the surface. The source pane SHALL be the design system's code-editing surface (not a raw `<textarea>`).

#### Scenario: Author sees source and preview together

- **WHEN** a user opens `<MermaidEditor>` with valid Mermaid source
- **THEN** the source is shown in an editable code pane and the corresponding diagram is rendered in the preview

#### Scenario: Editing updates the rendered diagram

- **WHEN** the user changes the source text
- **THEN** the preview re-renders to reflect the new source after edits settle (debounced), without a manual "render" action

### Requirement: Controlled and uncontrolled value contract

`<MermaidEditor>` SHALL support a controlled `value` paired with `onValueChange`, and an uncontrolled `defaultValue`, mirroring the design system's code pane contract, so a host (including the in-document block) can own the source string.

#### Scenario: Controlled value is honored

- **WHEN** a host renders `<MermaidEditor value={source} onValueChange={...}>`
- **THEN** the pane shows `source` and every edit calls `onValueChange` with the full updated source

### Requirement: Non-destructive parse-error handling

When the current source fails to parse or render, the surface SHALL retain the last successfully rendered diagram and surface the error through a design-system alert, rather than discarding the diagram or emitting a raw error block.

#### Scenario: Broken edit keeps the last good render

- **WHEN** the user edits valid source into source that fails to render
- **THEN** the previously rendered diagram remains visible and an alert describes the error (including a line reference when the engine provides one)

#### Scenario: Empty source shows an empty state

- **WHEN** the source is empty
- **THEN** the preview shows a design-system empty state rather than an error

### Requirement: Pan, zoom, fit, and reset preview

The preview SHALL let the user pan by dragging, zoom via wheel and explicit controls (clamped to a sane range), fit the diagram to the viewport, and reset the transform. This transform viewport is the only sanctioned bespoke surface; every control rendered over or beside it SHALL be a design-system component on design tokens.

#### Scenario: Pan and zoom a large diagram

- **WHEN** a diagram is larger than the preview viewport
- **THEN** dragging pans it and zooming (wheel or the − / + controls) scales it within the clamp range

#### Scenario: Fit and reset

- **WHEN** the user invokes fit-to-view
- **THEN** the diagram is centered and scaled to fit the viewport; invoking reset returns the transform to its default

### Requirement: Diagram-type detection and starter templates

The surface SHALL detect the diagram type from the source and offer starter templates for the supported Mermaid diagram types, so a user can begin from a known-good example.

#### Scenario: Detected type is reflected

- **WHEN** the source begins with a recognized diagram keyword
- **THEN** the surface reflects the detected diagram type

#### Scenario: Inserting a template replaces confirmed content

- **WHEN** the user chooses a starter template while the source is non-empty
- **THEN** the surface confirms before replacing the existing source

### Requirement: Theme rides the editor theme and flips with dark mode

The rendered diagram SHALL use the active editor theme's Mermaid variant (`shared/theme` `variant.mermaid`) and flip between light and dark with the `.dark` class. No foreign palette or hardcoded color may be introduced.

#### Scenario: Dark mode flips the diagram theme

- **WHEN** the `.dark` class is active
- **THEN** the diagram renders with the theme variant's dark Mermaid theme values

### Requirement: Export the diagram

The surface SHALL let the user copy the source, copy the SVG, download the SVG, and download a PNG. The outcome of each export SHALL be reported to the user (success or failure).

#### Scenario: Export to PNG

- **WHEN** the user exports a rendered diagram to PNG
- **THEN** a PNG image of the current diagram is produced and a success (or failure) notification is shown

### Requirement: Responsive layout

The surface SHALL present source and preview side by side when width allows and switch to a tabbed source/preview layout on narrow widths, so the surface is usable inline and on small screens.

#### Scenario: Narrow width uses tabs

- **WHEN** the available width is below the narrow breakpoint
- **THEN** source and preview are presented as switchable tabs rather than a side-by-side split

### Requirement: Read-only SSR-safe viewer

The surface SHALL provide a `<DiagramViewer>` that renders a diagram read-only, and SHALL degrade to the readable source (not a crash or blank) in environments without a live DOM.

#### Scenario: Server render degrades gracefully

- **WHEN** `<DiagramViewer>` renders where no browser DOM is available
- **THEN** it emits the readable Mermaid source in a `pre` fallback instead of failing

### Requirement: Engine-free public surface, lazily loaded

The Mermaid engine SHALL be loaded lazily (only in the browser, only when a diagram renders) and SHALL NOT appear in the surface's public type surface. Every non-preview control SHALL be composed from `@zeroxsolutions/ui`.

#### Scenario: Engine stays out of the public types and the base bundle

- **WHEN** the package is built
- **THEN** the engine-hiding build guard passes and the Mermaid engine is not imported at module load

