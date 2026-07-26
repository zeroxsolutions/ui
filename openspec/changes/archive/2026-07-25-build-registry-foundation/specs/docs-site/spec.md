## MODIFIED Requirements

### Requirement: Each documented component renders in an isolated live preview

A documented registry item MUST render in a complete doc page that matches the
`ui.shadcn.com` shape: a live **Preview**, a **Code/Usage** section (the `shadcn add`
command plus an import snippet), a **Props** table, a **Composition** tree, and a
**dark-mode** toggle. The isolated live preview is the Preview section of this page - the
page as a whole is the documentation, not just the render. (See the `registry-ecosystem`
capability for the complete contract.)

#### Scenario: A documented item's page

- **WHEN** a registry item is documented
- **THEN** its page renders the live Preview, the `shadcn add` command and import snippet,
  the Props table, the Composition tree, and a dark-mode toggle.

#### Scenario: A consumer copies the install path

- **WHEN** a consumer opens a documented item's page
- **THEN** they can copy the `shadcn add` command and the import snippet straight from the
  page and install/use the item.

### Requirement: The registry app hosts the component registry

The registry app MUST host the registry, where every item declares a `type` and a
`category`, `shadcn registry validate` runs in the build gate, and the ecosystem grows
from single components to composed `registry:block` and `registry:page` items. (See the
`registry-ecosystem` capability for the type/category/validate/growth contract.)

#### Scenario: The registry ships typed, categorized items

- **WHEN** the registry app is built and deployed
- **THEN** every registry item carries a `type` and a `category`, the build gate runs
  `shadcn registry validate`, and at least one `registry:block` composes existing items.
