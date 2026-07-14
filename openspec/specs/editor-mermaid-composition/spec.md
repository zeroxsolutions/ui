# editor-mermaid-composition Specification

## Purpose

Define how the Mermaid surfaces (the in-document node view, the standalone editor, and the
read-only viewer) compose the house design system instead of hand-rolled chrome. A Mermaid
block is a code editor plus a View/Edit tab, so it shares the code-block's `Disclosure`
header; its zoom controls are the design-system `FloatingToolbar`; its type/template
switcher is a stateful `Combobox`; its container is a design-system `Card`/`Disclosure`; and
its static export fallback is the read-only `CodeBlock`. Only the pan/zoom viewport
(`DiagramCanvas`) stays bespoke — the one sanctioned coordinate-anchored surface.

## Requirements

### Requirement: The Mermaid surface composes the shared code-block header, not a bespoke strip

A Mermaid block is a code editor plus a View/Edit tab, so its header MUST be the shared
`@zeroxsolutions/ui` `Disclosure` compound — the same header pattern the code-block uses —
not a hand-rolled header strip. The Mermaid node view and the standalone Mermaid editor MUST
NOT each hand-roll their own `border-b` header row; the diagram-type label fills the header's
title slot, the View/Edit tabs and copy fill its actions slot, and the active panel
(rendered diagram or `CodeMirrorPane`) fills its content slot.

#### Scenario: The Mermaid header renders from the shared Disclosure

- **WHEN** an editable Mermaid block renders its chrome
- **THEN** its header (diagram-type label, View/Edit tabs, copy) and its body come from the
  shared `Disclosure` compound's slots
- **AND** neither the node view nor the standalone editor hand-rolls a separate header strip

### Requirement: Mermaid zoom controls compose the design-system floating toolbar

The Mermaid preview's zoom/pan controls MUST compose the `@zeroxsolutions/ui`
`FloatingToolbar` (formerly `FloatingToolbarShell`), not a hand-rolled toolbar. Only the
pan/zoom viewport itself (`DiagramCanvas`) stays bespoke — the one sanctioned
coordinate-anchored surface — and every control it hosts is a design-system component on
design-system tokens.

#### Scenario: The zoom toolbar is the design-system floating toolbar

- **WHEN** the Mermaid preview shows its zoom/reset/fit controls
- **THEN** those controls render inside the `@zeroxsolutions/ui` `FloatingToolbar`
- **AND** the only bespoke element is the `DiagramCanvas` pan/zoom viewport

### Requirement: The Mermaid template/type switcher is a stateful Combobox

The Mermaid template/diagram-type switcher MUST compose the shipped `@zeroxsolutions/ui`
`Combobox` (the `LanguageSwitcher` pattern) so it displays the currently-selected diagram
type. It MUST NOT use a `DropdownMenu`, which shows no current selection and leaves the
active type invisible to a user or an agent.

#### Scenario: The switcher shows the active diagram type

- **WHEN** the Mermaid toolbar renders its template/type control
- **THEN** it is a `Combobox`-backed switcher showing the current diagram type
- **AND** selecting a template updates that displayed value

### Requirement: The Mermaid block container composes the design-system Card

The Mermaid block's container MUST compose the design-system `Card` (or the `Disclosure`
Root's own container), not a hand-rolled `rounded-lg border bg-card` look-alike, in the node
view, the read-only viewer, and the standalone editor alike.

#### Scenario: The container is a design-system surface

- **WHEN** a Mermaid block renders its outer container
- **THEN** the container is a design-system `Card`/`Disclosure` surface on design-system
  tokens
- **AND** no `rounded-lg border bg-card` card look-alike is hand-rolled

### Requirement: The Mermaid SSR fallback renders the read-only code block

The Mermaid export codec's static fallback (used where no live DOM can produce an SVG) MUST
render the read-only `@zeroxsolutions/ui` `CodeBlock`, so the exported source is
Shiki-highlighted and copyable — consistent with every other code block — not a bare `<pre>`.

#### Scenario: A statically-exported Mermaid block shows highlighted source

- **WHEN** a Mermaid block is serialized by the export codec with no live DOM
- **THEN** its source renders through the read-only `@zeroxsolutions/ui` `CodeBlock`
- **AND** it is not emitted as a raw unstyled `<pre>` element
