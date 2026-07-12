## Why

The `@zeroxsolutions/editor` package already depends on the house design system
(`@zeroxsolutions/ui`) and composes its atoms (`Button`, `Separator`, `Popover`,
`Checkbox`) in most chrome — but it also **hand-rolls shells that re-implement
components the design system already ships**, and one surface (the slash menu) is
built entirely from raw `<div>`/`<button>` markup. Concretely:

- **Slash menu** (`slash-menu.tsx`, 256 lines) re-implements a command palette by
  hand: raw popup container, `<button>` rows, grouping, filtering, keyboard nav,
  **and its own viewport clamp/flip positioning** — all of which the design
  system's `command`, `popover`, `item`, `empty`, and `scroll-area` already
  provide. The `bg-popover border shadow-md` container is a copy of the design
  system's popover surface.
- **Bubble menu / toolbar / block menu** compose `Button` inside hand-styled
  floating `<div>`s and reflect pressed state with `Button + aria-pressed`
  instead of the design system's `toggle`/`toggle-group`; icon buttons use a raw
  `title` attribute instead of `tooltip`.
- A full sweep of the ~70-component design system against the editor's 11
  features found **~25–30 applicable components going unused** — spanning chrome,
  per-feature UIs (link/image/embed/code-block/mention/table forms and pickers),
  and empty/loading/feedback states.

Two forces make this debt worth paying **now**: (1) a hand-rolled look-alike
silently drifts from the component it copies (tokens, a11y, dark mode, focus
management), and (2) the refactor is **mostly code deletion** — the design
system's `Popover` (Base UI) accepts a **virtual anchor** (`getBoundingClientRect`),
so a caret/selection-anchored menu drops its custom positioning math, and `command`
(cmdk) runs headless (`shouldFilter=false`, controlled `value`) so the list markup
and keyboard-driven filtering collapse into composed components.

There is also a **governance gap**: the rule that should prevent this,
`ui-from-design-system`, is scoped to *"a frontend app"* and *"every screen"* — a
publishable UI library's chrome falls outside its wording, and its bespoke
boundary (*"write bespoke only when nothing there fits"*) is too weak to forbid
re-implementing an existing component.

## What Changes

- **Establish a UI-composition contract** for the editor: every UI surface is
  composed from the house design system; the only sanctioned bespoke UI is a
  positioning/focus **shell** the design system cannot express (a floating
  surface anchored to a coordinate/virtual point, or a surface whose keyboard
  focus is owned by another component) — and even then only the shell is bespoke,
  everything inside it is a design-system component on design-system tokens.
- **Amend the `ui-from-design-system` rule** (replace, not duplicate) to broaden
  its scope from "a frontend app" to any workspace code that renders UI —
  including a publishable UI library / composite component — and sharpen the
  bespoke boundary to the two mechanism-based exceptions above. The rule stays
  **generic / project-agnostic** (it is one of the shared rules synced from the
  origin `classify` repo), naming no project or component.
- **Refactor the editor's UI to satisfy the contract**, staged:
  - **Phase 1 — chrome**: slash menu → `Popover` (virtual anchor) + headless
    `Command`/`item`/`empty`/`scroll-area`; bubble menu + toolbar → `toggle`/
    `toggle-group` + `tooltip` inside a shared floating shell; block menu →
    `dropdown-menu`/`context-menu` + `tooltip`; extract one shared floating-shell
    primitive so `bg-popover border shadow` is declared once.
  - **Phase 2 — per-feature UIs**: link/image/embed/code-block/mention/table
    surfaces composed from `field`/`input`/`combobox`/`tabs`/`hover-card`/`kbd`/
    `sonner`/`aspect-ratio`/`dialog`.
  - **Phase 3 — node-view shells**: callout → `alert`, toggle → `collapsible`
    (gated by an engine/`NodeViewContent` compatibility spike).

## Success Criteria

- A `specs/editor-ui-composition/spec.md` capability defines the composition
  contract and the exact bespoke exceptions, as testable requirements.
- `ui-from-design-system` reads correctly for a UI library (not only an app) and
  forbids re-implementing a shipped component, with the two mechanism exceptions —
  and contains no project- or component-specific names (safe to sync to `classify`).
- **Phase 1** complete: the slash, bubble, toolbar, and block surfaces render
  from design-system components; the custom viewport-positioning math in the slash
  menu is deleted (replaced by the `Popover` virtual anchor); pressed/tooltip/
  empty states are design-system components; one floating-shell primitive replaces
  the duplicated `bg-popover border shadow` containers.
- No visual/behavioral regression: existing chrome behaviors (inline `/` trigger,
  delete-on-select, bubble over text-only selection, viewport-aware positioning,
  keyboard nav) still pass; `nx run-many -t build test` and the engine-free
  `.d.ts` assertion stay green.

## Non-Goals

- **Sync back to the `classify` origin repo** — the amended rule will be applied
  in this repo; mirroring it to `classify` is handled separately by the user and
  is out of scope here (no sync tooling is added).
- **Phase 2 and Phase 3 execution** are scoped and tasked but may land in
  separate `apply` cycles; only Phase 1 + the contract are committed here.
- **Node-view refactor without a spike** — replacing the callout/toggle shells
  depends on confirming design-system components compose inside a ProseMirror
  `NodeViewContent`; if the spike fails, those shells stay bespoke and are
  documented as an allowed exception, not force-fit.
- No new UI dependency (the design system is already a dependency) and no change
  to the editor's engine-hiding boundary or its façade (`IEditor`) contract.

## Capabilities

### New Capabilities

- `editor-ui-composition`: the contract governing how the editor renders its UI —
  design-system components are the default for every surface (chrome, per-feature
  UIs, node-view shells); the sanctioned bespoke boundary is limited to
  positioning/focus shells the design system cannot express; and those shells
  still render design-system components inside, on design-system tokens.

### Modified Capabilities

<!-- None — openspec/specs/ is empty; the ui-from-design-system rule amend is a
     .agents/rules change tracked in Impact/tasks, not an OpenSpec spec delta. -->

## Impact

- **Code** — `packages/editor/src/document/ui/*` (slash-menu, bubble-menu,
  editor-toolbar, block-menu, plus a new shared floating-shell module and its
  `chrome.spec.tsx`); Phase 2 touches `packages/editor/src/document/features/*`;
  Phase 3 touches the callout/toggle node views.
- **Governance** — `.agents/rules/ui-from-design-system.md` (replaced body);
  `.claude/rules` is a symlink so it updates automatically. The change is one of
  the shared generic rules (origin `classify`).
- **Dependencies** — none added; broader use of existing `@zeroxsolutions/ui`
  subpaths (`command`, `tooltip`, `toggle-group`, `dropdown-menu`, `item`,
  `empty`, `scroll-area`, `field`, `combobox`, `tabs`, …).
- **Contracts unchanged** — the engine-free `.d.ts` boundary, the `IEditor`
  façade, and the `assert-engine-free-dts` build gate are preserved.
