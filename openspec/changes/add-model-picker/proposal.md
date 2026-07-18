## Why

The AI model picker is the one searchable, provider-grouped surface for choosing a
model (chat input, per-agent override, generation assignment) in the source app
(chiselhub `ModelPicker`), but it is not in the shared design system - so every
consumer would hand-roll it or couple to the app. It is also the correct home for
the model **hover-info**: hovering a compact picker row reveals the `ModelInfoCard`
(LobeHub model-switch style). The library currently mis-places that hover on
`ModelListItem` - a settings **list** row that has no hover in the source design.

Bringing a presentational `ModelPicker` into `@zeroxsolutions/ui` gives one shared,
domain-free picker and moves the hover to where it belongs.

## What Changes

- Add **`ModelPicker`** to `@zeroxsolutions/ui` (`components/model-picker.tsx`),
  **presentational + domain-free**: a select-style trigger (or a `trigger` slot)
  opening a `Popover` with a searchable, provider-grouped `Command`; each model is
  a **compact `CommandItem`** (logo slot + name + vendor) wrapped in a `HoverCard`
  whose content is the `ModelInfoCard`, opening to the side. Groups, the selected
  value, `onChange`, and each row's info-card content arrive via **props/slots** -
  no store, no capability/pricing/id-composition logic, no domain types.
- **Correct the model hover placement**: the hover-to-`ModelInfoCard` lives on the
  picker's command rows. Update the `model-info-card` `OnHover` story to trigger
  from a picker command row (not `ModelListItem`).
- **`ModelListItem` is unchanged** - it stays a plain settings list row with no
  hover.

## Success Criteria

- `ModelPicker` renders a searchable, provider-grouped popover; hovering a row
  reveals the `ModelInfoCard` to the side; picking a row calls `onChange`.
- Domain-free: imports only `@zeroxsolutions/ui` primitives + React; every model
  value arrives via a prop or slot.
- The `model-info-card` hover demo triggers from a **picker command row**;
  `ModelListItem` has no hover.
- Convention-correct: one file `components/model-picker.tsx`, `data-slot`, composes
  the shipped `Popover` / `Command` / `HoverCard` / `Item` / `Badge`; no look-alike.
- vitest spec + Storybook story; `nx build test @zeroxsolutions/ui` green;
  real-browser verified.

## Non-Goals

- No store / data-fetching, no `capability` filtering, no composite-id (`idOf`)
  logic, no pricing/credit computation - those stay in the consuming app
  (chiselhub keeps a thin domain wrapper over this presentational picker).
- Not part of the `refactor-design-system-conventions` umbrella (that is the
  broader convention refactor of existing components).
- Not changing `ModelListItem`'s list behavior.

## Capabilities

### New Capabilities

- `model-picker`: a presentational, domain-free AI model picker - a trigger opening
  a searchable, provider-grouped popover of models, each row hover-revealing the
  `ModelInfoCard`, selection reported via `onChange`; all data via props/slots.

### Modified Capabilities

- `model-info-card`: the "shown inside the shipped HoverCard" requirement - the
  hover trigger is the **picker's** compact command row, not `ModelListItem`.

## Impact

- **Package**: `@zeroxsolutions/ui` (+1 composed component `model-picker`; a story
  update to `model-info-card`). Resolves via the `./*` subpath map - no
  `package.json` edit; additive -> **minor**.
- **Primitives composed** (existing): `popover`, `command`, `hover-card`, `item`,
  `badge`, `button`.
- **Consumers**: chiselhub's app `ModelPicker` can later become a thin domain
  wrapper over this presentational one (an app-side change, out of scope here).
- **Specs**: new `model-picker`; modified `model-info-card`.
