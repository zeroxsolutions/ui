## Why

The design system ships no ready-made control for **choosing a language**, and two
real needs collide on that gap:

1. **Host apps** switching UI locale (English / Tiếng Việt / 日本語) have to hand-roll
   a dropdown over the primitives every time.
2. **The editor's code block** picks its syntax-highlight language through a raw
   `<input>` (`packages/editor/.../code-block/code-block.tsx`): you type
   `typescript` by hand, with no suggestions, no icon, and a typo silently kills
   highlighting.

Both are the *same UI shape* — a controlled single-select over labelled options —
differing only in the data behind them. One component covers both, and the code
side gets to reuse two things the repo already has: the curated **shiki language
registry** (`packages/ui/src/lib/shiki.ts`) and the **587 Material file-type icons**
just added under `@zeroxsolutions/icons/material/*`.

## What Changes

- A new tier-2 component `LanguageSwitcher` in `@zeroxsolutions/ui`, controlled and
  i18n-agnostic (the consumer owns every visible string), modelled on the existing
  `select-field` / `command-switcher` components.
- **Two orthogonal axes:**
  - **Display form** as compound sub-components — `LanguageSwitcher.Dropdown`,
    `.Segmented`, `.Icon` (the repo's compound idiom, as with `Icon.Light`). Bare
    `LanguageSwitcher` aliases `.Dropdown`.
  - **Domain** as a `kind` prop — `kind="locale" | "code"`.
- **Built-in data, overridable.** `kind="code"` auto-builds its options from the
  shiki registry and attaches a full-color Material icon per language;
  `kind="locale"` renders native language names via `Intl.DisplayNames`. Either can
  be overridden with an explicit `options` array (bring-your-own data).
- **Editor wiring.** Replace the code block's raw `<input>` language field with
  `<LanguageSwitcher.Dropdown kind="code" searchable>`, so language selection is a
  searchable, icon-labelled picker constrained to the languages the editor can
  actually highlight.
- **Dependency.** Add `@zeroxsolutions/icons` as a dependency of
  `@zeroxsolutions/ui` (currently absent; `icons` is a leaf package, so no cycle).

## Success Criteria

- `LanguageSwitcher.Dropdown`, `.Segmented`, and `.Icon` all render, are keyboard-
  and screen-reader-operable, and are controlled purely via `value` + `onValueChange`.
- `kind="code"` with no `options` lists exactly the shiki-supported languages, each
  showing its full-color Material icon; `kind="locale"` renders native names from
  BCP-47 codes.
- Passing an explicit `options` array overrides the built-in data for either `kind`.
- `searchable` filters the list on `.Dropdown` / `.Icon`; `.Segmented` exposes no
  `searchable` prop.
- The component ships no hard-coded human-facing copy (labels are computed or supplied).
- The editor code block selects its language through the switcher; a chosen language
  round-trips through the block's attrs and its fenced-Markdown serialization exactly
  as before.
- `nx typecheck/build/test @zeroxsolutions/ui` and `@zeroxsolutions/editor`, plus
  `build-storybook`, are green; a Storybook story covers all three forms × both kinds.

## Non-Goals

- No i18n framework and no `react-i18next` — the SDK stays i18n-agnostic; wiring the
  switcher to an app's translation layer is the host's job.
- No persistence, no URL/route syncing, no locale detection.
- No RTL/direction handling — `DirectionProvider` is a separate existing primitive.
- Not a general-purpose replacement for `select-field` / `combobox` / `toggle-group`;
  it is a language-domain preset over them.
- No expansion of the shiki language set or the Material icon set in this change.

## Capabilities

### New Capabilities

- `language-switcher`: a controlled, i18n-agnostic component for selecting a language
  — either a UI locale or a programming language — presented as one of three compound
  display forms, with built-in-but-overridable option data per domain `kind`.

### Modified Capabilities

<!-- None. Wiring the switcher into the editor code block is an implementation change;
     no existing editor spec constrains code-block language selection at the requirement
     level, so no delta spec is required. -->

## Impact

- **New:** `packages/ui/src/components/language-switcher.tsx` (+ co-located
  `language-switcher.spec.tsx`); the shiki-id → Material-icon mapping and the
  code/locale option builders it needs.
- **Modified:** `packages/editor/src/document/features/code-block/code-block.tsx`
  (swap the raw `<input>` for the switcher).
- **Dependency:** `@zeroxsolutions/ui` gains `@zeroxsolutions/icons`.
- **Docs/Story:** `apps/storybook/src/language-switcher.stories.tsx`.
- **Exports:** none to hand-edit — `@zeroxsolutions/ui`'s `./*` dist-mirrored exports
  map surfaces the new module automatically once built.
