## MODIFIED Requirements

### Requirement: Each documented registry item renders in an isolated, responsive live preview

A documented registry item - a composed component, a block, or a page (never a
shadcn primitive) - MUST render in a doc page whose live preview is a real
viewport: the component inside MUST respond to the chosen device width as it
would on a real device, so media queries and viewport-relative units behave
correctly. The page MUST present the live preview and its source as tabs (a
Preview tab and a Code tab) with tab semantics, and MUST offer a fullscreen view
that opens the preview as a standalone page in a new tab. The Code tab shows the
source of the item's `registry:example`, fetched from the built registry item
JSON (single source of truth - the file a consumer installs).

#### Scenario: the live preview reflects real responsive behavior at device widths

- **WHEN** a visitor selects a narrower device width on a documented item's preview
- **THEN** the live component inside re-flows exactly as it would at that viewport on a
  real device (media queries and viewport-relative units respond)
- **AND** the preview is rendered in a viewport-isolated surface (an iframe sized to the
  device width), not a width-constrained container div

#### Scenario: Preview and Code are tabs

- **WHEN** a visitor views a documented item's preview block
- **THEN** the live render and the source code are presented as a tabbed view (a Preview
  tab and a Code tab) using tab semantics (`aria-selected`)
- **AND** the Code tab shows the source of the item's `registry:example`, fetched from
  `/r/<example>.json`

#### Scenario: Fullscreen opens a standalone route in a new tab

- **WHEN** a visitor opens the preview fullscreen
- **THEN** it opens a dedicated standalone route (rendering only the example) in a new
  browser tab
- **AND** no in-page dialog or overlay is used for fullscreen

#### Scenario: only composed components, blocks, and pages are documented

- **WHEN** the docs catalog is inspected
- **THEN** it contains only composed components, blocks, and pages
- **AND** no shadcn primitive (e.g. Button) has a doc page, a catalog entry, or a home
  feature card (primitives remain installable dependencies in `registry.json`, just not
  documented here)

## ADDED Requirements

### Requirement: The docs site uses RESTful section routes

The docs site MUST use section-scoped routes: a home route (`/`), and per-section
list and detail routes for each registry tier - `/components`, `/components/:slug`,
`/blocks`, `/blocks/:slug`, `/pages`, `/pages/:slug`. It MUST also expose standalone
preview routes (`/preview/components/:slug`, `/preview/blocks/:slug`,
`/preview/pages/:slug`) that render one example raw, for use as an iframe source and
as the fullscreen target. The flat `/preview/<slug>` tree MUST NOT exist.

#### Scenario: each section has a list page and per-item detail

- **WHEN** a visitor navigates to `/components`, `/blocks`, or `/pages`
- **THEN** a section list page renders the items in that tier
- **AND** each item links to its detail route (`/<section>/<slug>`)

#### Scenario: standalone preview routes render one example raw

- **WHEN** a visitor opens `/preview/<kind>/<slug>`
- **THEN** the route renders only the example for that item, with no docs chrome
- **AND** it is usable as an iframe source and as a fullscreen/new-tab target

### Requirement: Docs navigation is a top nav, not a sidebar

The docs site MUST navigate via a top header (links to each section plus the home
and the theme toggle) and MUST NOT carry a persistent left sidebar. The catalog is
reached through section list pages, not a rail.

#### Scenario: no left sidebar; section navigation is in the header

- **WHEN** any docs page is rendered
- **THEN** navigation is a top header with links to the sections (Components, Blocks,
  Pages)
- **AND** no persistent left sidebar is present

### Requirement: The package-manager toggle shows brand icons

The Installation section's package-manager toggle (pnpm / npm / yarn / bun) MUST
show each runner's brand icon alongside its label.

#### Scenario: each runner shows its brand mark

- **WHEN** the Installation section renders the package-manager toggle
- **THEN** each runner item shows its brand icon (pnpm, npm, yarn, bun)
- **AND** selecting a runner still updates the install command accordingly
