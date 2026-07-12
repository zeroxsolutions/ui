# Verification — add-language-switcher

## Green gate (the husky pre-commit gate)

`nx run-many -t lint build test` → **Successfully ran targets build, test for 4 projects.**
(No project defines a `lint` target, so the gate runs `build` + `test`; both green.)

- `nx test @zeroxsolutions/ui` (`language-switcher.spec.tsx`) → **14 passed**.
- `nx test @zeroxsolutions/editor` (`code-block.spec.tsx`) → **4 passed** (unchanged).
- `nx build @zeroxsolutions/ui` → built; `dist/components/language-switcher.js` + `.d.ts` emitted; `@zeroxsolutions/icons` stays **external** (no `dist/material/` inside ui).
- `nx build @zeroxsolutions/editor` → built (resolves `@zeroxsolutions/ui/components/language-switcher`).
- `nx build-storybook @zeroxsolutions/storybook` → **completed successfully** (`language-switcher.stories` chunk emitted).

## Behavioural checks

- **No icon drift** — `language-switcher.spec.tsx` asserts `CODE_LANGUAGE_OPTION_IDS` (the picker's own id set) equals the highlighter's exported `CODE_LANGUAGE_IDS` from `src/lib/shiki.ts`. Every highlightable language resolves a Material icon (aliases: `dockerfile→docker`, `shellscript→console`, `jsx/tsx→react`, `sql→database`, `ini→document`, `scss→sass`).
- **Code-block round-trip unchanged** — the editor wiring swaps only the editable control; `attrs.language`, the fenced-Markdown codec, and the `<pre><code class="language-…">` HTML export are untouched. `code-block.spec.tsx` (attr + export + import assertions) stays green. The read-only branch still renders the plain `<span>`.
- **`searchable` type-level guarantee** — the `segmented` form exposes no `searchable` prop; the spec pins this with a `@ts-expect-error` assertion (the spec file is included in `nx typecheck`).
- **Accessibility** — the `Combobox` trigger carries the accessible name from `aria-label` (defaults to "Select language") and exposes `role="combobox"` (Base UI's ARIA combobox pattern); the spec drives every form via `getByRole('combobox', { name: /select language/i })`; verified in-test. The `segmented` form's `ToggleGroup` items carry each option's `aria-label`.

## Known pre-existing issue (out of scope)

`nx typecheck @zeroxsolutions/ui` reports **one** error — `src/components/select-field.tsx(69): TS2322` (`SelectTrigger` no longer accepts `variant`). It predates this change, is unrelated to the language switcher, and does **not** fail the husky gate (`typecheck` is not among lint/build/test) nor the `build` (vite-plugin-dts logs it without failing). All three new files (`language-switcher.tsx`, `language-switcher-data.tsx`, `language-switcher.spec.tsx`) and the code-block edit are typecheck-clean.

## Rule audit (`.agents/rules/*` vs the change)

- `ui-from-design-system` — composed from shipped design-system components (`combobox`/`toggle-group`/`button`), not a hand-rolled `Popover` + `Command` look-alike; the one primitive reach (Base UI `Combobox.Trigger` for the chevron-less icon trigger) is the sanctioned "switch, don't patch" case. No competing UI library. ✓
- `lib-public-exports-and-semver` — new modules surface through ui's existing `./*` dist-mirrored exports map (no barrel edit); additive (a minor). ✓
- `naming-files-and-symbols` — kebab files, PascalCase `LanguageSwitcher`, camelCase helpers. ✓
- `house-libs-catalog-scope` — `@zeroxsolutions/icons` added as `workspace:*` (mirrors `@zeroxsolutions/fluent-emoji`). ✓
- `stack-pnpm` — installed via `pnpm install`. ✓
- `stack-utc-locale-per-request` — i18n-agnostic; locale names computed via `Intl.DisplayNames`, no hardcoded market value; minimal English fallback copy is consumer-overridable (`aria-label`/`placeholder`/`emptyText`). ✓
- `e2e-pairs-each-app` — Storybook host is exempt (has `.storybook/`); no new app. ✓
- `worktree-per-task` — worked on `master` per explicit user directive (no new branch this time). ⚠ by request.
