## ADDED Requirements

### Requirement: Block is collapsible from its header without tearing down the render

The in-document Mermaid block SHALL be collapsible from its header via a collapse control placed alongside the copy control. Activating the control SHALL fold the body (the active view/edit panel) to header-only; activating it again SHALL restore the body. Collapsing SHALL keep the rendered diagram mounted (hidden, not unmounted) so that folding or unfolding never tears down an in-flight render. The collapse control SHALL share the block's header chrome with the view/edit toggle and copy control, consistent with the sibling code block. The collapsed state SHALL be local view state and SHALL NOT be persisted to the document.

#### Scenario: Collapsing folds the block to its header

- **WHEN** the block is expanded and the user activates the collapse control
- **THEN** the body is hidden and only the header (identity, view/edit toggle, copy, collapse control) remains visible

#### Scenario: Expanding restores the body

- **WHEN** the block is collapsed and the user activates the collapse control again
- **THEN** the previously active view/edit panel is restored to view

#### Scenario: Collapsing keeps the diagram render mounted

- **WHEN** the diagram is showing and the user collapses and then expands the block, including repeatedly and across view/edit toggles
- **THEN** the rendered diagram remains available and no render error occurs, because the diagram's rendered node is kept mounted (hidden) rather than unmounted while collapsed

#### Scenario: Collapse state is not persisted

- **WHEN** the user collapses the block
- **THEN** the document content and the block's `source` attribute are unchanged, and the fenced ` ```mermaid ` codec round-trip is unaffected
