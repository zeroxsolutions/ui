# composer-trigger-registry Specification

## Purpose

Define how the chat composer (`@zeroxsolutions/editor/composer`) discovers, renders,
commits, and serialises inline trigger tokens through a **registry** of token
descriptors rather than a hand-written surface per trigger. A trigger is registered as
a token object declaring its character, a stable `kind`, an archetype, and a data
source; three archetype presets - `reference` (`@mention`, `#channel`), `invocation`
(`/command`), and `insertion` (`:emoji:`) - fill its behavioural defaults, each field
staying overridable and validated against incoherent combinations. One generic
caret-anchored suggestion menu and one inline-token factory (node plus codec, shared by
the editable input and the read-only message view) serve every registered token, and the
typed submit payload is **derived from** the registry - each `kind` a typed collection
inferred from its token - instead of a closed hand-maintained union. The result is the
extensibility of an open system with the type safety of a closed one: adding a trigger
is registering a token, and a renamed token attribute fails the build rather than
reading `undefined` at runtime.

## Requirements

### Requirement: Triggers Are Registered, Not Hardcoded

The chat composer SHALL accept a list of trigger tokens as its registration
surface. Each token declares its trigger character, a stable `kind` identifier,
an archetype, and a data source. Recognising a new inline trigger SHALL require
only adding a token to that list - no new suggestion-menu component, no
hand-written node, and no edit to the payload mapping.

#### Scenario: A new trigger is added by registration alone

- **WHEN** a token declaring a not-yet-registered trigger character is added to
  the composer's trigger list
- **THEN** typing that character opens its suggestion menu and commits its token
  without any additional menu component, node definition, or payload-mapping edit

#### Scenario: Two tokens cannot claim the same trigger character

- **WHEN** two registered tokens declare the same trigger character
- **THEN** the registration is rejected with an error naming the conflicting
  character, rather than silently letting one shadow the other

### Requirement: Archetype Presets With Overridable Defaults

The capability SHALL provide three archetype presets that fill an open
descriptor's behavioural defaults, each field of which remains overridable:

- `reference` - an inline pill, insertable anywhere, many per message
  (`@mention`, `#channel`).
- `invocation` - an inline pill, permitted only at the input start, at most one
  leading the message, committing on the full slug plus space, and restoring to
  editable text on backspace (`/command`).
- `insertion` - no pill; commits a self-contained inline node (a native or image
  glyph) and does not survive as a deletable-as-one-unit slug (`:emoji:`).

The registration SHALL validate a token's resolved behaviour and reject an
incoherent combination.

#### Scenario: A preset supplies its archetype defaults

- **WHEN** a token is declared through the `reference` preset with only its kind,
  character, and source
- **THEN** it resolves to "insertable anywhere, many allowed" without the caller
  restating those behaviours

#### Scenario: An overridden field wins over the preset default

- **WHEN** a token declared through a preset overrides one behavioural field
- **THEN** the overridden value takes effect and the remaining preset defaults
  are unchanged

#### Scenario: An incoherent behaviour combination is rejected

- **WHEN** a token resolves to a contradictory combination (for example
  line-start placement together with many-allowed multiplicity)
- **THEN** registration fails with an error identifying the offending token and
  the conflicting fields, rather than registering a silently broken trigger

### Requirement: One Generic Suggestion Menu Per Registered Token

Each registered pill-bearing token (reference and invocation archetypes) SHALL
surface a caret-anchored suggestion menu produced by one generic menu, driven by
the token descriptor. Typing the trigger character leaves the typed query as
visible text highlighted on the composer accent; selecting an option deletes the
typed query and commits the token. Mounting several tokens' menus together SHALL
not let one menu's inline highlight wipe another's.

#### Scenario: Selecting an option commits the token

- **WHEN** a suggestion menu is open on a typed query and an option is chosen by
  keyboard or click
- **THEN** the typed query is removed and the token is committed in its place,
  with the editor retaining focus

#### Scenario: Sibling menus do not clobber each other's highlight

- **WHEN** more than one token menu is mounted on the same composer and one is
  active
- **THEN** closing it clears only the highlight it painted, leaving any sibling
  token's active highlight intact

### Requirement: One Shared Node And Codec Per Token, No Surface Drift

A pill-bearing token SHALL render through one node plus one codec shared by the
editable input and the read-only message view, so the two surfaces cannot
diverge. The codec round-trips the token through the stored document
(react/HTML) and yields an honest textual form (the literal slug) for plain-text
output; it SHALL NOT reconstruct a token from arbitrary prose.

#### Scenario: Editable and read-only surfaces render identically

- **WHEN** the same committed token is shown in the composer input and in the
  read-only message view
- **THEN** both render it through the same node/codec, producing the same pill

#### Scenario: Plain-text output is the literal slug

- **WHEN** a message containing a token is flattened to plain text
- **THEN** the token appears as its literal slug (for example `/image-gen`,
  `@alice`) and is not re-parsed back into a token from that text

### Requirement: Registry-Derived Typed Payload

The submit payload SHALL be derived from the registry: the mapping walks the
document's inline nodes and buckets each committed token under its registered
`kind`. A host SHALL read each kind as a typed collection whose element type is
inferred from the registered token, without a closed hand-maintained union and
without casting. A renamed token attribute SHALL fail the build at each read
site.

#### Scenario: Each registered kind is a typed collection on the payload

- **WHEN** a message is submitted from a composer with registered `mention`,
  `channel`, and `command` tokens
- **THEN** the payload exposes the committed tokens grouped by kind, each group
  typed as that token's attribute shape, in document order

#### Scenario: A renamed attribute breaks the build, not runtime

- **WHEN** a registered token's attribute is renamed
- **THEN** every consumer that read the old name fails to compile, rather than
  reading `undefined` at runtime

### Requirement: Mention And Command Behaviour Preserved Through The Registry

The composer SHALL ship `mention` (`@`, reference) and `command` (`/`,
invocation) tokens built on the presets, preserving the existing behaviour: an
`@` mention pill insertable anywhere and many per line; a `/` command permitted
only at the input start, at most one leading the line, committed by Tab, Enter,
or typing the full slug then space, and restored to editable `/slug` text by
backspace on the committed pill.

#### Scenario: The command stays start-only and single

- **WHEN** a `/` is typed anywhere other than the input start, or a command
  already leads the line
- **THEN** the command menu does not open and the `/` remains literal text

#### Scenario: Backspace restores a committed command to editable text

- **WHEN** backspace is pressed with the caret immediately after a committed
  leading command pill
- **THEN** the pill is replaced by editable `/slug` text and its menu re-opens

#### Scenario: Space commits an exactly-typed command

- **WHEN** the typed `/query` exactly matches a command's slug or label and space
  is pressed
- **THEN** that command is committed as its inline pill
