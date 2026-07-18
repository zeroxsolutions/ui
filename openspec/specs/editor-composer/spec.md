# editor-composer Specification

## Purpose

Define `@zeroxsolutions/editor`'s chat composer surface, homed in-package under
`composer/`. The composer is a contentEditable input (`ChatInput`) built on the
existing editor engine with a minimal composer schema - a single textblock of inline
text and mention atoms, not the block document schema - so `@zeroxsolutions/ui` ships
no ProseMirror/contentEditable composer and pulls in no TipTap/ProseMirror
dependency. It resolves `@` into caret-anchored mention pills carrying `{ id, label }`,
sets a single `/` command mode rendered as a design-system `Badge`, and emits a
structured submit payload (command, mentions, positional segments). A read-only
`ChatMessageView` renders a submitted message from the same schema/codec the input
uses, reusing the same `MentionPill`. The surface composes `@zeroxsolutions/ui`
forward (`InputGroup`, `Badge`, `Item`, `Empty`, `ScrollArea`), introduces no
back-dependency from the design system to the editor, and is exposed as additive
per-file `./*` subpaths.

## Requirements

### Requirement: The editor package owns the chat composer input surface

`@zeroxsolutions/editor` MUST provide a contentEditable chat composer input (`ChatInput`) as
an in-package surface under `composer/`, built on the existing editor engine with a minimal
composer schema — a single textblock holding inline text and mention atoms, not the block
document schema. `@zeroxsolutions/ui` MUST NOT ship a ProseMirror/contentEditable composer,
and no TipTap/ProseMirror dependency MAY be introduced into `@zeroxsolutions/ui`.

#### Scenario: The composer input resolves from the editor package

- **WHEN** a caller needs an input that highlights `/` commands and `@` mentions inline
- **THEN** it resolves `ChatInput` from `@zeroxsolutions/editor`
- **AND** `@zeroxsolutions/ui` carries no TipTap/ProseMirror dependency and no import of it

#### Scenario: Enter submits and Shift+Enter inserts a newline

- **WHEN** the caret is in the composer and the user presses `Enter` with no menu open
- **THEN** the composer emits its submit payload and clears its content
- **WHEN** the user presses `Shift+Enter`
- **THEN** a newline is inserted and no submit is emitted

#### Scenario: The composer shows a placeholder when empty

- **WHEN** the composer has no content
- **THEN** it renders the caller-provided placeholder text and emits no payload

### Requirement: Typing `@` inserts a resolved mention pill through a caret-anchored menu

The composer MUST, when the user types `@` followed by a query, open a suggestion menu
anchored at the caret and filtered by that query, sourced from a caller-supplied people list
(which MAY resolve asynchronously). Selecting an item MUST delete the typed `@query` and
insert a mention pill carrying `{ id, label }` and displaying `label`. The pill MUST behave as
a single atom — one `Backspace` removes the whole pill. The menu MUST be a caret-anchored
`FloatingShell` whose rows, empty state, and scrolling are the design-system `Item`, `Empty`,
and `ScrollArea`; it MUST NOT hand-roll a look-alike of those components.

#### Scenario: Selecting a person inserts a resolved pill

- **WHEN** the user types `@ad`, the menu shows a person `{ id: "u1", label: "Ada" }`, and the user selects it
- **THEN** the `@ad` text is removed and a mention pill is inserted carrying `id: "u1"` and showing `@Ada`
- **AND** the pill deletes as a single unit on `Backspace`

#### Scenario: The pill displays the label, never the raw id

- **WHEN** a mention pill is rendered
- **THEN** it shows the `label`, and the `id` is carried only as data, never displayed

#### Scenario: An empty or non-matching query shows the design-system empty state

- **WHEN** the query matches no person in the caller-supplied list
- **THEN** the menu renders the design-system `Empty`, not a bespoke empty element

### Requirement: Typing `/` at the input start sets a single command mode as a Badge

The composer MUST, when the user types `/` at the start of an empty-or-argument input, open a
command menu anchored at the caret and filtered by the typed query, sourced from a
caller-supplied command list. Selecting an item MUST set a single command mode — rendered as a
design-system `Badge` chip pinned at the input start — and clear the typed `/query` from the
text, leaving the remaining input as that command's argument. The command MUST be surface
state, NOT inline document content. `Backspace` at the input start MUST clear the command mode.
At most one command MAY be active at a time. The command chip MUST be the design-system
`Badge`, not a hand-rolled chip.

#### Scenario: Selecting a command pins a Badge and consumes the slash text

- **WHEN** the user types `/ima` at the start, the menu shows `{ id: "image", label: "Image" }`, and the user selects it
- **THEN** the `/ima` text is removed, a `Badge` reading `Image` is pinned at the input start, and the caret sits in the argument text
- **AND** typing after it contributes to the command's argument, not a new command

#### Scenario: Backspace at the start clears the command mode

- **WHEN** a command mode is active and the caret is at the input start on `Backspace`
- **THEN** the command mode is cleared, the `Badge` is removed, and the argument text remains

#### Scenario: The command menu opens only at the input start

- **WHEN** the user types `/` mid-argument (not at the start)
- **THEN** no command menu opens and the `/` is ordinary text

### Requirement: Submitting emits a structured object payload

The composer MUST emit its content on submit as a single object with the active command (or
null), the resolved mentions, and positional segments from which a flat text is derivable.
Mentions MUST carry `{ id, label }`; segments MUST preserve the inline order of text and
mentions so a reader can place each pill. The input MUST clear after a successful submit.

#### Scenario: The payload carries command, mentions, and positional segments

- **WHEN** the input holds command `Image`, the text `a portrait of `, and a mention pill for `{ id: "u1", label: "Ada" }`
- **THEN** submit emits `{ command: { id: "image", label: "Image" }, mentions: [{ id: "u1", label: "Ada" }], segments: [{ text: "a portrait of " }, { mention: { id: "u1", label: "Ada" } }] }`
- **AND** the input clears

#### Scenario: A message with no command emits a null command

- **WHEN** no command mode is active on submit
- **THEN** the payload's `command` is null and `segments` still carries the text and any mentions

### Requirement: A read-only message view renders the same content from one shared codec

`@zeroxsolutions/editor` MUST provide a read-only `ChatMessageView` under `composer/` that
renders a submitted message — mention pills and, when present, the leading command `Badge` —
from the same schema/codec the input uses. The mention pill in the view MUST be the **same**
`MentionPill` the input renders; the view MUST NOT introduce a second, look-alike render path.

#### Scenario: The view renders mention pills identical to the input

- **WHEN** `ChatMessageView` renders a message containing a mention `{ id: "u1", label: "Ada" }`
- **THEN** it renders the same `MentionPill` (showing `@Ada`) the composer input renders, from the shared codec

#### Scenario: The view renders the command as a leading Badge

- **WHEN** the message payload carries command `{ id: "image", label: "Image" }`
- **THEN** the view renders a leading design-system `Badge` reading `Image` before the message body

### Requirement: The composer composes the design system forward only

The `composer/` surface MUST compose `@zeroxsolutions/ui` forward — `InputGroup` as the input
shell, `Badge` for the command chip, `Item` / `Empty` / `ScrollArea` for the menu contents —
and MUST NOT introduce a `@zeroxsolutions/ui → @zeroxsolutions/editor` dependency edge. The
ProseMirror DOM MUST be styled through the design tokens (the sanctioned foreign-engine
exception), never a hardcoded colour. The composer MUST NOT edit any vendored
`@zeroxsolutions/ui` `components/ui/*` primitive.

#### Scenario: No back-dependency from the design system to the editor

- **WHEN** the dependency graph is inspected after the surface lands
- **THEN** `@zeroxsolutions/ui` has no import of `@zeroxsolutions/editor`

#### Scenario: The command chip and mention pill use design tokens

- **WHEN** the command `Badge` and the mention pill are rendered in light and dark themes
- **THEN** their colours come from semantic tokens (the `Badge` variant, the pill's `primary` token) and flip under `.dark`, with no hardcoded hex or palette colour

### Requirement: The composer surface is exposed as additive per-file subpaths

The new files under `@zeroxsolutions/editor` `composer/` MUST be exposed through the package's
per-file `./*` subpath map as additive public subpaths, with no root barrel that `export *`s
internals. Adding them MUST be a minor (additive) release, removing or renaming none of the
existing surface.

#### Scenario: Each composer entry resolves at its own subpath

- **WHEN** a consumer imports the composer input or the message view
- **THEN** it resolves each from its own `@zeroxsolutions/editor/composer/*` subpath
- **AND** no existing `@zeroxsolutions/editor` subpath is removed or renamed by this change
