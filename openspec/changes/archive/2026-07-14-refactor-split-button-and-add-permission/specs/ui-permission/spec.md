## ADDED Requirements

### Requirement: Permission renders inline in the message stream, never as a modal

`@zeroxsolutions/ui` MUST ship a `Permission` compound that renders an AI-consent request as a
block inside a chat message body (within `ChatMessageShell`), NOT as an `AlertDialog` or any modal
overlay. The request MUST be part of the message flow so it stays visible in scrollback.

#### Scenario: A pending request appears in the message body

- **WHEN** a `Permission` with a pending status is rendered inside an assistant/tool message
- **THEN** it appears as an inline block in that message's body
- **AND** it does not open a modal dialog or overlay

### Requirement: Permission is a compound of `data-slot` parts with a host-driven status

`Permission` MUST be authored as a Root plus named sub-parts: a header (a leading glyph, typically
the calling MCP server's brand mark, plus the title; a status cue is an OPTIONAL part, not a
required pill), a description, a preview slot, a decision-actions row, and a resolved-outcome part,
each tagged `data-slot="permission-*"`, composed by the consumer. The presence of the
decision-actions row is itself the "needs approval" signal, so the default illustration ships no
status pill. The Root MUST take a host-supplied status (`pending` | `approved` | `denied`) exposed
as a `data-status` attribute; the parts MUST show/hide by `data-status` selector coordination, not
a prop-drilled boolean or a hand-rolled context. The **preview** part is a **thin slot** that holds
the operation's rendering (typically a `CodeBlock`, which is itself a `Disclosure` on Base UI
`Collapsible` bringing its own muted frame, header, and collapse); it MUST NOT add its own border
or a second collapsible, so the preview never double-frames. `Permission` MUST compose
design-system primitives (`CodeBlock`, `Button`) and MUST NOT hand-roll a look-alike of any shipped
primitive. The Root MUST be **borderless** (no border, no background fill, and no padding inset
around the parts) so the request flows in the assistant message set off only by spacing and the
preview `CodeBlock`'s own frame, and the preview spans the full message width (no card chrome boxing
or squeezing it); never a `Card` re-skin. Restraint over chrome (per Claude's preview-then-confirm
pattern): spacing and type carry the hierarchy, not a filled block or a loud status pill. It MUST
live in the composed component layer, never `components/ui/*`.

#### Scenario: Parts follow the host-supplied status

- **WHEN** the Root's status is `pending`
- **THEN** the decision-actions part is shown and the resolved-outcome part is hidden, driven by
  the `data-status` selector
- **WHEN** the status is `approved` or `denied`
- **THEN** the resolved-outcome part is shown and the decision-actions part is hidden

#### Scenario: The preview does not double-frame its content

- **WHEN** a request includes a preview (e.g. a command or diff) rendered via `CodeBlock`
- **THEN** its frame, header, and collapse come from the `CodeBlock`'s own `Disclosure` (on Base UI
  `Collapsible`), and the `PermissionPreview` slot adds no border or second collapsible around it

### Requirement: The decision row is asymmetric - plain Deny, graduated-scope Allow

`Permission`'s decision row MUST place all graduated grant scopes on the `Allow` side and MUST keep
`Deny` a single plain `Button`. `Deny` MUST NOT be a split button and MUST NOT use the
`destructive` variant (it is the safe, reversible default). When a request offers more than one
grant scope, the `Allow` control MUST be a `SplitButton` (primary = the safe default grant, menu
items = riskier scopes); with a single scope it MAY be a plain `Button`. `Permission` MUST compose
the `Allow` control through children rather than hard-depending on `SplitButton`.

#### Scenario: A multi-scope request

- **WHEN** a request offers scopes such as allow-once, allow-this-session, and always-allow
- **THEN** the `Allow` control is a `SplitButton` whose primary is the safe default and whose menu
  items are the riskier scopes
- **AND** `Deny` is a single plain, non-destructive button beside it

#### Scenario: A single-scope request

- **WHEN** a request offers only one grant scope
- **THEN** the `Allow` control MAY render as a plain `Button` with no caret

### Requirement: A resolved decision persists in the transcript

Once the user decides, `Permission` MUST render a persisted, non-interactive resolved state that
stays in the message stream: an approved outcome summarising the granted scope, or a denied
outcome. The live decision controls MUST no longer be interactive after resolution.

#### Scenario: Approved

- **WHEN** the status becomes `approved`
- **THEN** the card shows a persisted approved outcome naming the granted scope, and the decision
  buttons are gone

#### Scenario: Denied returns control to the conversation

- **WHEN** the status becomes `denied`
- **THEN** the card shows a persisted denied outcome, and the affordance for telling the assistant
  what to do instead is the conversation itself (the composer), not a menu item on a deny control

### Requirement: No component-level danger/tone chrome - risk emphasis is a consumer variant choice

`Permission` MUST NOT expose a `tone`/`danger` axis or render any risk-signalling chrome of its own
(a tinted container, a coloured border, an emphasis swap). Foregrounding `Deny` for a risky
operation is achieved solely by the **consumer** choosing the emphasised button variant for `Deny`
and a quieter one for `Allow` - the component neither adds nor requires an axis for it. (Anthropic's
real destructive-command handling is a **behavioural** circuit-breaker - catastrophic commands such
as `rm -rf /` always prompt - not a visual card tone; the card therefore ships no invented danger
styling.)

#### Scenario: A risky request foregrounds rejection without component chrome

- **WHEN** a consumer wants to foreground rejection for a destructive operation
- **THEN** it gives `Deny` the emphasised button variant and `Allow` a quieter one
- **AND** the `Permission` Root adds no border, tint, or `data-tone` of its own, and the row
  structure is unchanged with `Deny` still a single plain button
