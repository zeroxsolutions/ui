# component-testing Specification

## Purpose

Define where `@zeroxsolutions/ui` coverage runs after the nx split: component and pure-logic unit tests stay on the single jsdom Vitest project, while real-browser interaction, accessibility, and visual coverage move to the registry app's Playwright e2e. The library stays jsdom-only and carries no browser-mode Vitest project or coupling.

## Requirements

### Requirement: Component and logic unit tests run in jsdom Vitest

`@zeroxsolutions/ui` MUST keep its component and pure-logic unit tests on the standard
jsdom Vitest project - the workspace's single test runner - run through the project's
inferred `test` target and discovered by the root `vitest.config.ts` aggregator. The
library MUST NOT carry a second, browser-mode Vitest project.

#### Scenario: Unit tests run in jsdom via nx

- **WHEN** `nx test @zeroxsolutions/ui` runs
- **THEN** the component and logic specs execute in the jsdom Vitest project
- **AND** they are included in `nx run-many -t test`

### Requirement: Interaction, a11y, and visual coverage lives in the app e2e, not the library

Real-browser interaction, accessibility, and visual coverage MUST run as e2e through the
registry app's `registry-e2e` (Playwright), driving the app's isolated component
previews - and MUST NOT run as a Vitest browser-mode project inside `packages/ui`. This
is the coverage the removed `test-storybook` provided, rehomed per the nx split
(a library is unit-tested, an app is e2e-tested).

#### Scenario: Interaction/visual asserted via the app e2e

- **WHEN** a component's real-browser interaction or layout needs coverage
- **THEN** it is exercised by `registry-e2e` against the registry app's component preview
- **AND** `packages/ui` introduces no Vitest browser project and no `test-storybook` target

### Requirement: The library is not coupled to a browser test runner

`packages/ui` MUST NOT depend on `@vitest/browser` / `@vitest/browser-playwright` or
carry a bespoke `test-browser` target; jsdom is its only test surface. jsdom cannot
measure layout, so any coverage that needs real geometry belongs to the app e2e above.

#### Scenario: No browser-test coupling in the library

- **WHEN** `packages/ui` dependencies and nx targets are inspected
- **THEN** there is no `@vitest/browser*` dependency and no `test-browser` target
