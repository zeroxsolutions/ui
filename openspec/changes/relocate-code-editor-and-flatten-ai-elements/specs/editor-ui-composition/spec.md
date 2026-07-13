## ADDED Requirements

### Requirement: The editable code-block composes the design-system shell around the editor's own pane

The editor's code-block feature MUST render its **editable** surface by composing the
shared design-system `Disclosure` compound around `@zeroxsolutions/editor`'s own
`CodeMirrorPane` — not by consuming a `@zeroxsolutions/ui` editable code block. Its
**read-only** rendering (static viewer and export codec) MUST use the read-only
`@zeroxsolutions/ui` `CodeBlock`. The change MUST preserve the feature's observable
editing behavior.

#### Scenario: Editing a code block preserves its behavior

- **WHEN** a code block is edited in the document editor
- **THEN** typing updates the node's `code` attribute, switching the language updates its
  `language` attribute, and the copy control still copies the source
- **AND** the editing surface is the `@editor` `CodeMirrorPane`, framed by the shared
  design-system `Disclosure` compound

#### Scenario: The read-only render uses the design-system read-only code block

- **WHEN** the same code block is rendered by the static viewer or serialized by the
  export codec
- **THEN** it renders through the read-only `@zeroxsolutions/ui` `CodeBlock`, keeping the
  Shiki highlight and copy control
