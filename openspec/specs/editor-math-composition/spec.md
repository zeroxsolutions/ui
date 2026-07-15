# editor-math-composition Specification

## Purpose
TBD - created by archiving change add-math-editor. Update Purpose after archive.
## Requirements
### Requirement: The math surface composes the shared code-block header, not a bespoke strip

A math block is a code editor plus a View/Edit tab, so its header MUST be the shared `@zeroxsolutions/ui` `Disclosure` compound — the same header pattern the code-block and Mermaid blocks use — not a hand-rolled header strip. The math node view and the standalone math editor MUST NOT each hand-roll their own `border-b` header row; the math label fills the header's title slot, the View/Edit tabs and copy fill its actions slot, and the active panel (rendered formula or the code pane) fills its content slot.

#### Scenario: The math header renders from the shared Disclosure

- **WHEN** an editable math block renders its chrome
- **THEN** its header (math label, View/Edit tabs, copy) and its body come from the shared `Disclosure` compound's slots
- **AND** neither the node view nor the standalone editor hand-rolls a separate header strip

### Requirement: The math block container composes the design-system Card or Disclosure

The math block's container MUST compose the design-system `Card` (read-only viewer) or the `Disclosure` root's own container (editable), not a hand-rolled `rounded-lg border bg-card` look-alike, in the node view, the read-only viewer, and the standalone editor alike.

#### Scenario: The container is a design-system surface

- **WHEN** a math block renders its outer container
- **THEN** the container is a design-system `Card`/`Disclosure` surface on design-system tokens
- **AND** no `rounded-lg border bg-card` card look-alike is hand-rolled

### Requirement: Error and empty states compose the design-system Alert and Empty

The math preview's parse-error and empty states MUST compose the design-system `Alert` (error) and `Empty` (no formula), not a raw red `<pre>` or hand-rolled empty markup, consistent with the Mermaid preview.

#### Scenario: A parse error renders through Alert

- **WHEN** the current source fails to render
- **THEN** the error is shown in a design-system `Alert` and the last good formula stays visible

#### Scenario: Empty source renders through Empty

- **WHEN** the source is empty
- **THEN** the preview shows a design-system `Empty` state

### Requirement: The inline math editor composes InputGroup, not a positioned input

The inline math editor's compact input with its commit/cancel/palette controls MUST compose the design-system `InputGroup` with `InputGroupInput` and `InputGroupAddon` — never a raw `Input` with absolutely-positioned buttons beside it. The palette trigger placed in an addon MUST use the Base UI `render` prop with `nativeButton={false}`.

#### Scenario: Inline controls live in an InputGroup

- **WHEN** the inline math popover renders its input and controls
- **THEN** the input is an `InputGroupInput` and its buttons are `InputGroupAddon` contents, not positioned siblings of a bare `Input`

### Requirement: The symbol palette composes a Popover and Command, staying open for repeated inserts

The symbol/template palette MUST compose the shipped `@zeroxsolutions/ui` `Command` inside a `Popover`, with its items grouped in `CommandGroup`s and searchable via `CommandInput`. Because a palette inserts many entries in succession (unlike a pick-one `Combobox`), it MAY stay open across inserts. It MUST NOT be hand-rolled markup.

#### Scenario: The palette is a searchable grouped Command

- **WHEN** the palette opens
- **THEN** it is a `Command` in a `Popover` with grouped, searchable entries
- **AND** inserting an entry writes its LaTeX at the caret

### Requirement: The math surface introduces no bespoke surface

Unlike the Mermaid surface, whose pan/zoom viewport (`DiagramCanvas`) is the one sanctioned bespoke surface, the math preview is a static formula in a design-system container and MUST NOT introduce any bespoke coordinate-anchored surface. Every part of the math surface MUST be a design-system component on design-system tokens.

#### Scenario: No bespoke viewport is introduced

- **WHEN** the math surface renders its preview
- **THEN** the preview is a design-system container holding the KaTeX markup, with no bespoke pan/zoom or canvas surface

### Requirement: The KaTeX color rides the theme and its stylesheet stays a CSS import

The rendered formula's color MUST come from the active editor theme's `variant.math`, and the KaTeX stylesheet MUST be included via a CSS `@import` in the package's `styles.css` — never a JavaScript side-effect `import` of `katex/dist/katex.min.css`, which breaks the library's bundling contract.

#### Scenario: KaTeX CSS is not imported from JavaScript

- **WHEN** the math surface modules are built
- **THEN** no module performs a JS side-effect import of the KaTeX stylesheet
- **AND** the stylesheet remains a CSS `@import` in `styles.css`

