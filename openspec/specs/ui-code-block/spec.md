# ui-code-block Specification

## Purpose

Define the design system's read-only code block and the shared `Disclosure` compound it is
built on. `@zeroxsolutions/ui`'s `CodeBlock` is a read-only, Shiki-highlighted view with copy
and collapse — no embedded editor, no CodeMirror dependency. The `Disclosure` compound is the
shared header/body chrome that both the read-only block and any editable consumer compose, so
their header pattern is identical by construction rather than duplicated. Horizontal overflow
rides a design-system-styled scrollbar without editing the CLI-vendored primitives.

## Requirements

### Requirement: The design-system code block is a read-only view

The `@zeroxsolutions/ui` `CodeBlock` MUST render read-only, Shiki-highlighted code with a
copy control and a collapse affordance. It MUST NOT embed a text editor, MUST NOT expose an editable mode
(`editable` / `onCodeChange` / `onLanguageChange`), and MUST carry no CodeMirror
dependency.

#### Scenario: A code block renders highlighted read-only code

- **WHEN** a `CodeBlock` is rendered with source and a language
- **THEN** it shows the Shiki-highlighted code and a copy control
- **AND** it provides no editing affordance and pulls in no CodeMirror code

### Requirement: A shared `Disclosure` compound keeps header patterns from drifting

`@zeroxsolutions/ui` MUST provide a general `Disclosure` compound — a shadcn-style compound
(Root + `DisclosureHeader` / `DisclosureTitle` / `DisclosureActions` / `DisclosureContent`)
authored per `ui-compound-authoring`, whose collapse state rides a Base UI collapsible
primitive — exposing a title slot, an actions slot, and a collapsible content slot. It MUST
live in the composed component layer, never the CLI-vendored `components/ui/`. The read-only
`CodeBlock` and any editable consumer MUST both compose `Disclosure`, so their header pattern
is identical by construction rather than duplicated.

#### Scenario: The read-only block composes the Disclosure

- **WHEN** the read-only `CodeBlock` renders its header and body
- **THEN** the header (language label, copy, collapse) and the collapsible body come from the
  shared `Disclosure` compound's parts

#### Scenario: An editable consumer reuses the same Disclosure

- **WHEN** an editable code surface (e.g. the editor's code-block feature) renders its
  chrome
- **THEN** it composes the same `Disclosure`, filling `DisclosureActions` with its extra
  controls
- **AND** its header layout matches the read-only block's without a hand-rolled copy

### Requirement: The code block's horizontal overflow rides the design-system scrollbar

A long line in the read-only code block MUST scroll horizontally through a
design-system-styled thin scrollbar. Achieving this MUST NOT require editing the vendored
scroll-area primitive (which ships a vertical scrollbar and regenerates from the registry).

#### Scenario: A long line scrolls with the styled rail

- **WHEN** a code line overflows the block's width
- **THEN** it scrolls horizontally with the design-system thin scrollbar
- **AND** the vendored `components/ui/scroll-area` file is left unmodified
