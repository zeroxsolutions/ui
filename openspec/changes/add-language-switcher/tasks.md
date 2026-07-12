## 1. Dependency wiring

- [x] 1.1 Add `@zeroxsolutions/icons` as a dependency of `@zeroxsolutions/ui` (workspace reference per `house-libs-catalog-scope`; `icons` is a leaf, no cycle).
- [x] 1.2 Run `pnpm install` and confirm the lockfile resolves cleanly; verify `@zeroxsolutions/icons/material/*` subpaths are importable from `@zeroxsolutions/ui`.

## 2. Option data (code + locale)

- [x] 2.1 Build a shiki-id → Material-icon map: statically import the ~30 icons the shiki registry (`src/lib/shiki.ts`) needs into `Record<shikiId, FC>`, with the known aliases (`dockerfile→docker`, `shellscript→console`, `jsx→react`, `tsx→react`) and a defined fallback for any unmapped id. Do NOT reuse `file-type-icon.tsx`.
- [x] 2.2 Implement `codeLanguageOptions()` — enumerate the shiki registry ids, attach each icon (2.1), and label each (small display-name table, id fallback) → `LanguageOption[]`.
- [x] 2.3 Implement `localeOptions(codes)` — map each BCP-47 code to its native name via `Intl.DisplayNames`, with the raw code as fallback → `LanguageOption[]`.

## 3. LanguageSwitcher component

- [x] 3.1 Create `packages/ui/src/components/language-switcher.tsx` with `LanguageOption` and the controlled `value` / `onValueChange` / `options?` / `placeholder?` contract; resolve options as explicit `options` → else the `kind` builder.
- [x] 3.2 Implement the `dropdown` form on the shipped `Combobox` (the in-popup `ComboboxInput` search field shows when `searchable`, hides otherwise); `kind="code"` defaults `searchable=true`; current selection shown in the trigger with its icon.
- [x] 3.3 Implement the `segmented` form over `toggle-group` (single-select, all options inline); its props type omits `searchable`.
- [x] 3.4 Implement the `icon` form: icon-only trigger (globe default / current option icon) opening the same `Combobox` (via the Base UI `Combobox.Trigger` primitive so no chevron crowds the icon); supports `searchable`.
- [x] 3.5 Expose the display forms through a `form` prop (a `ComboboxFormProps | SegmentedFormProps` discriminated union) defaulting to `"dropdown"` so a bare `LanguageSwitcher` renders the dropdown form; ensure keyboard + accessible-name coverage on every form.

## 4. Editor code-block wiring

- [x] 4.1 In the code-block, replace the raw `<input>` language field with `<LanguageSwitcher kind="code" searchable value={attrs.language} onValueChange={(l) => updateAttrs({ language: l })} />` (dropdown is the default form), leaving the `language` attr, fenced-Markdown codec, and HTML export unchanged.

## 5. Tests & story

- [x] 5.1 Co-locate `packages/ui/src/components/language-switcher.spec.tsx` (Vitest + jsdom): controlled selection; all three forms render; `kind="code"` lists shiki langs with icons; `kind="locale"` renders native names; explicit `options` overrides; the `segmented` form exposes no `searchable`.
- [x] 5.2 Add `apps/storybook/src/language-switcher.stories.tsx` at the storybook root covering all three forms × both kinds (`Icons/…`-style grid), including a searchable code dropdown.
- [x] 5.3 Update/extend the editor's code-block spec if it asserts on the language control, keeping the attr round-trip assertions green.

## 6. Validation

- [x] 6.1 `nx typecheck/build/test @zeroxsolutions/ui` and `@zeroxsolutions/editor` all green.
- [x] 6.2 `nx build-storybook` (storybook host) green.
- [x] 6.3 Confirm every shiki-registry id resolves an icon (or defined fallback); confirm the code-block language round-trips through codec + HTML export unchanged.
- [x] 6.4 Rule-audit the staged diff against `.agents/rules/*` (esp. `lib-public-exports-and-semver`, `ui-from-design-system`, `naming-files-and-symbols`, `green-before-commit`).
