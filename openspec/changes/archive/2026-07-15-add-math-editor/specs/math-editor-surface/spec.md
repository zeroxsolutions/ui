## ADDED Requirements

### Requirement: Split source-and-preview authoring surface

The surface SHALL expose a `<MathEditor>` that presents a LaTeX source pane and a rendered-formula preview together, so a user can author a formula and see the result without leaving the surface. The source pane SHALL be the design system's code-editing surface (not a raw `<textarea>`), and the LaTeX source SHALL be syntax-highlighted.

#### Scenario: Author sees source and preview together

- **WHEN** a user opens `<MathEditor>` with valid LaTeX source
- **THEN** the source is shown in an editable, LaTeX-highlighted code pane and the corresponding formula is rendered in the preview

#### Scenario: Editing updates the rendered formula

- **WHEN** the user changes the source text
- **THEN** the preview re-renders to reflect the new source, without a manual "render" action

### Requirement: Controlled and uncontrolled value contract

`<MathEditor>` SHALL support a controlled `value` paired with `onValueChange`, and an uncontrolled `defaultValue`, mirroring the design system's code pane contract, so a host (including the in-document block) can own the source string.

#### Scenario: Controlled value is honored

- **WHEN** a host renders `<MathEditor value={latex} onValueChange={...}>`
- **THEN** the pane shows `latex` and every edit calls `onValueChange` with the full updated source

### Requirement: Non-destructive parse-error handling

When the current source fails to parse or render, the surface SHALL retain the last successfully rendered formula and surface the error through a design-system alert, rather than discarding the render or emitting a raw KaTeX error string.

#### Scenario: Broken edit keeps the last good render

- **WHEN** the user edits valid source into source that fails to render
- **THEN** the previously rendered formula remains visible and an alert describes the KaTeX error

#### Scenario: Empty source shows an empty state

- **WHEN** the source is empty
- **THEN** the preview shows a design-system empty state rather than an error

### Requirement: Symbol and template palette

The surface SHALL offer a palette of common LaTeX symbols (Greek letters, operators, relations, delimiters, arrows) and structural templates (fraction, square root, matrix, cases, limit), grouped and searchable by name, so a user can insert LaTeX without memorizing commands. Choosing an entry SHALL insert its LaTeX at the caret; a template with a hole SHALL place the caret inside the hole.

#### Scenario: Inserting a symbol writes LaTeX at the caret

- **WHEN** the user chooses a symbol from the palette
- **THEN** the symbol's LaTeX is inserted into the source at the caret and the preview updates

#### Scenario: Inserting a template positions the caret

- **WHEN** the user chooses a structural template with a hole (e.g. a fraction)
- **THEN** the template's LaTeX is inserted and the caret is placed inside the first hole

#### Scenario: Searching finds a symbol by name

- **WHEN** the user types a symbol name into the palette search (e.g. "integral")
- **THEN** the palette filters to matching entries

### Requirement: Theme rides the editor theme and flips with dark mode

The rendered formula SHALL use the active editor theme's math variant (`shared/theme` `variant.math`) for its color and SHALL flip between light and dark with the `.dark` class. No foreign palette or hardcoded color may be introduced.

#### Scenario: Dark mode flips the formula color

- **WHEN** the `.dark` class is active
- **THEN** the formula renders with the theme variant's dark math color

### Requirement: Export the formula source

The surface SHALL let the user copy the LaTeX source and copy the formula's MathML. The outcome of each export SHALL be reported to the user (success or failure).

#### Scenario: Copy LaTeX

- **WHEN** the user copies the source of a rendered formula
- **THEN** the LaTeX string is placed on the clipboard and a success (or failure) indication is shown

### Requirement: Responsive layout

The surface SHALL present source and preview side by side when width allows and switch to a tabbed source/preview layout on narrow widths, so the surface is usable inline and on small screens.

#### Scenario: Narrow width uses tabs

- **WHEN** the available width is below the narrow breakpoint
- **THEN** source and preview are presented as switchable tabs rather than a side-by-side split

### Requirement: Read-only SSR-safe viewer

The surface SHALL provide a `<FormulaViewer>` that renders a formula read-only. Because KaTeX renders synchronously and is SSR-safe, the viewer SHALL render the real formula on the first paint in any environment, including where no browser DOM is available, rather than degrading to a source fallback.

#### Scenario: Server render shows the real formula

- **WHEN** `<FormulaViewer>` renders where no browser DOM is available
- **THEN** it emits the rendered KaTeX markup for the formula, not a source fallback or a blank

### Requirement: Engine-free public surface

The KaTeX render SHALL live behind a render seam in the surface's `core/` and SHALL return a discriminated result (rendered markup, or an error) without throwing. The KaTeX type SHALL NOT appear in the surface's public type surface, and every non-preview control SHALL be composed from `@zeroxsolutions/ui`.

#### Scenario: Render never throws

- **WHEN** the render seam is called with source that KaTeX rejects
- **THEN** it returns an error result rather than throwing, so callers can keep the last good render
