## Context

`@zeroxsolutions/ui` is a tier-2 design system: raw Base UI wrappers live in
`src/components/ui/*` (stories under `apps/storybook/src/primitives/`), and opinionated
composed components live in `src/components/*` (stories at the storybook root). The
closest precedents for this work are `select-field.tsx` (a controlled labelled select:
`value` + `onValueChange` + `options`) and `command-switcher.tsx` (a trigger-and-menu
switcher). The display form is selected by a discriminated-union `form` prop (as `select-field`
selects behaviour by props), so each form types only the props that fit it.

Two ingredients already exist to back a code-language picker: the curated shiki registry
in `src/lib/shiki.ts` (~30 languages behind lazy `import('@shikijs/langs/…')` grammars)
and the 587 full-color Material file-type icons at `@zeroxsolutions/icons/material/*`
(each a single dist-mirrored subpath, no barrel). Today the editor code block
(`packages/editor/.../code-block/code-block.tsx`) selects its language through a raw
`<input>` bound to `updateAttrs({ language })`.

## Goals / Non-Goals

**Goals:**

- One controlled, i18n-agnostic `LanguageSwitcher` with three display forms (a `form` prop) and
  a `kind` domain prop, covering both UI-locale and code-language selection.
- Built-in-but-overridable option data per `kind`, reusing the shiki registry and the
  Material icon set for `kind="code"`.
- Replace the code block's raw `<input>` with the switcher, without changing the block's
  stored `language` attr or its serialization.

**Non-Goals:**

- No i18n framework, no persistence, no direction/RTL handling, no locale detection.
- No new shiki languages or Material icons; no general-purpose select replacement.

## Decisions

### D1 — Display form = a `form` prop (discriminated union), not a `variant` prop

`LanguageSwitcher` takes a `form` prop — `"dropdown" | "segmented" | "icon"` — typed as a
discriminated union (`PopoverFormProps | SegmentedFormProps`) so each form carries only the
props that fit it (see D6). `form` defaults to `"dropdown"`, so a bare `LanguageSwitcher`
renders the dropdown form.

### D2 — Domain = a `kind` prop (`"locale" | "code"`), not `variant`

`variant` is reserved across shadcn/this repo for *appearance* (e.g. `SelectTrigger
variant="borderless"`). The display form is the `form` axis, so the domain axis takes
a distinct name, `kind`. `kind` defaults to `"locale"` (the more generic case).

### D3 — One Base UI primitive per form

- `dropdown` → a `Popover` + `Command`: the `CommandInput` search field shows when `searchable`
  and hides otherwise; the options stay a scrollable `CommandList`. One primitive across the
  `searchable` boundary; the public prop is just `searchable`.
- `segmented` → `toggle-group` (single-select), every option rendered inline.
- `icon` → the same `Popover` + `Command` body with an icon-only trigger (a globe by default, or
  the current option's icon when present).

### D4 — Built-in option builders, overridable

Two internal builders produce `LanguageOption[]`:

- `codeLanguageOptions()` — iterates the shiki registry ids, maps each to its Material icon
  (D5), and labels it (a small display-name table; fall back to the id).
- `localeOptions(codes: string[])` — maps each BCP-47 code to its native name via
  `new Intl.DisplayNames([code], { type: 'language' })`.

A form resolves its options as: explicit `options` prop → else the builder for its `kind`.
`kind="code"` needs no argument; `kind="locale"` needs the `codes`/`locales` to display, so
the locale form accepts that list (or an explicit `options`).

### D5 — A dedicated shiki-id → Material-icon map (do not reuse `file-type-icon.tsx`)

`file-type-icon.tsx` maps extensions to generic gray lucide glyphs — wrong for a colorful
language picker. Instead, a new module statically imports the ~30 Material icons the shiki
registry needs and builds `Record<shikiId, FC>`. Most ids match an icon file 1:1
(`typescript`, `python`, `rust`, `go`, `json`, …); the known aliases are
`dockerfile→docker`, `shellscript→console`, `jsx→react`, `tsx→react`, with `cpp`, `csharp`,
`c`, `php`, `ruby`, `lua`, etc. present directly. Static imports (not dynamic) because the
set is small and bounded, keeping the picker synchronous.

### D6 — `searchable` typed onto the `dropdown`/`icon` forms only

The prop types differ per form via the `form` discriminated union: the `dropdown` and `icon`
forms accept `searchable?: boolean`; the `segmented` form's props omit it. The spec constraint
("segmented has no search") is thus a compile-time guarantee, not a runtime check.

### D7 — Add `@zeroxsolutions/icons` to `@zeroxsolutions/ui`

`@zeroxsolutions/ui` doesn't yet depend on `@zeroxsolutions/icons`; add it as a workspace
dependency (per `house-libs-catalog-scope`). `icons` is a leaf (no dep on `ui`), so there
is no cycle.

### D8 — Editor wiring is attr-preserving

In `code-block.tsx`, replace the `<input>` with
`<LanguageSwitcher kind="code" searchable value={attrs.language} onValueChange={(l) => updateAttrs({ language: l })} />` (dropdown is the default form).
The stored `language` attr, the fenced-Markdown codec, and the HTML export are untouched —
only the editing control changes.

## Risks / Trade-offs

- **Bundle cost of static icon imports.** ~30 Material components are pulled into the
  `language-switcher` module regardless of `kind`. Bounded and small; acceptable versus the
  complexity of dynamic per-subpath loading. If it matters later, the code builder can move
  behind a lazy import.
- **`searchable` toggle within one primitive.** The `dropdown`/`icon` forms show/hide the
  `CommandInput` across the `searchable` boundary inside one `Popover` + `Command`; the story must
  exercise both states so focus/keyboard behaviour stays consistent.
- **`Intl.DisplayNames` availability.** Ubiquitous in modern browsers/runtimes; a missing
  native name falls back to the raw code. Consumers needing exact wording pass `options`.
- **Icon coverage gaps.** A shiki id with no good Material match falls back to a generic
  icon (or none) rather than blocking the option.

## State Model

The component is stateless with respect to selection (fully controlled via `value`). The
only internal state is transient UI: the open/closed state of the menu and the current
search query (both owned by the underlying Base UI primitive, reset on close). No effects,
no async in the render path.

## Migration Plan

Single-step, in-place: the new component ships in `@zeroxsolutions/ui`, and the code block
switches to it in the same change. Because the block's `language` attr and serialization are
unchanged, existing documents load and export identically; only the in-editor control looks
different. No consumer migration is required for the component itself (new surface, additive).

## Open Questions

- Should the locale form accept `locales={string[]}` as its primary input, or only the
  generic `options`? (Leaning: accept `locales` for ergonomics, with `options` as override.)
- Final display-name labelling for code languages — a curated table vs. Title-cased ids.
  (Leaning: a small curated table for the common cases, id fallback otherwise.)
