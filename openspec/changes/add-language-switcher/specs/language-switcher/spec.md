## ADDED Requirements

### Requirement: Selection is fully controlled

The component **SHALL** be controlled: it renders the language named by `value` and
reports every user selection through `onValueChange`, holding no selection state of
its own. The consumer owns the value and decides whether and how it changes.

#### Scenario: Rendering the current value

- **WHEN** the component is rendered with `value` set to one of its option values
- **THEN** that option is presented as the current selection

#### Scenario: Reporting a selection

- **WHEN** the user picks a different option
- **THEN** `onValueChange` is called with the picked option's value
- **AND** the displayed selection does not change unless the consumer updates `value`

### Requirement: Display form is chosen through compound sub-components

The component **SHALL** expose three display forms as compound sub-components —
`LanguageSwitcher.Dropdown`, `LanguageSwitcher.Segmented`, and `LanguageSwitcher.Icon`
— and the bare `LanguageSwitcher` **SHALL** render the same form as `.Dropdown`. Each
form presents the same controlled selection over the same options; only the presentation
differs (a trigger-and-menu, an inline segmented control, and an icon-only trigger-and-menu
respectively).

#### Scenario: Selecting a display form

- **WHEN** a consumer renders `LanguageSwitcher.Segmented` (or `.Dropdown`, or `.Icon`)
- **THEN** the selection is presented in that form
- **AND** the same `value` / `onValueChange` contract applies to every form

#### Scenario: Bare component defaults to the dropdown form

- **WHEN** a consumer renders `LanguageSwitcher` with no sub-component
- **THEN** it renders the dropdown form

### Requirement: The domain kind supplies built-in option data

The `kind` prop **MUST** select the built-in option set when no explicit `options` is
given: `kind="code"` lists the programming languages the design system can highlight,
each labelled and shown with its full-color Material file-type icon; `kind="locale"`
lists UI locales, each labelled with its native language name derived from its BCP-47
code. The component itself hard-codes no human-facing label text — code labels and
icons come from the shared language registry and the Material icon set, and locale
names are computed from the platform's locale-display facility.

#### Scenario: Code languages with icons

- **WHEN** a `kind="code"` switcher is rendered with no `options`
- **THEN** its options are exactly the languages the design system supports for
  highlighting, each carrying its full-color Material icon

#### Scenario: Locale native names

- **WHEN** a `kind="locale"` switcher is given a set of BCP-47 codes and no explicit labels
- **THEN** each option is labelled with that locale's native language name

### Requirement: Explicit options override the built-in data

An explicit `options` array **SHALL** override the built-in data for either `kind`, so a
consumer can supply its own languages, labels, and per-option icons (bring-your-own data).
Each option carries a `value`, a `label`, and an optional leading `icon`.

#### Scenario: Overriding the option set

- **WHEN** a consumer passes an `options` array
- **THEN** the switcher presents exactly those options, using their supplied labels and icons,
  regardless of `kind`

### Requirement: Search is an affordance of the dropdown and icon forms only

The `searchable` affordance **SHALL** filter the option list by user-typed text on the
`.Dropdown` and `.Icon` forms; the `.Segmented` form **MUST NOT** expose a `searchable`
option, because it presents every option inline with nothing to filter.

#### Scenario: Filtering a long code-language list

- **WHEN** a searchable `.Dropdown` (or `.Icon`) switcher is open and the user types text
- **THEN** only options whose label matches the text remain visible

#### Scenario: Segmented form has no search

- **WHEN** the `.Segmented` form is used
- **THEN** no search affordance is present and all options are shown inline

### Requirement: The component is keyboard- and screen-reader-operable

Every display form **SHALL** be operable by keyboard and **SHALL** expose an accessible
name for its control and for each option, so the switcher is usable without a pointer and
announced by assistive technology.

#### Scenario: Keyboard operation

- **WHEN** a user navigates the switcher with the keyboard
- **THEN** the control can be focused, opened where applicable, and a new value selected
  without a pointer

#### Scenario: Accessible naming

- **WHEN** the switcher is inspected by assistive technology
- **THEN** the control and its options expose accessible names
