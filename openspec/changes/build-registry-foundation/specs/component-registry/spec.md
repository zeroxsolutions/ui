## ADDED Requirements

### Requirement: A registry item declares a type and a category

Every item in `registry.json` MUST declare a `type` (`registry:ui`, `registry:component`,
`registry:block`, `registry:page`, or `registry:example`) and a `category`, alongside the
existing name/files/dependencies fields, so the install channel carries the item's kind
and group and the catalog can grow beyond single components.

#### Scenario: An item is added

- **WHEN** a registry item is authored
- **THEN** its `registry.json` entry carries a `type` and a `category` in addition to its
  name, files, and dependencies.

#### Scenario: The registry validates

- **WHEN** the build runs `shadcn registry validate`
- **THEN** every item's `type` and `category` satisfy the shadcn registry schema, or the
  build fails.
