# Verification — refactor-ui-drop-classname-piling

## Completion Decision

**implemented + verified.** All composite edits, the two heavy re-tunes, and the
four deletions are applied; the unit gate + storybook build are green; and
real-browser visual parity is confirmed on every changed and adjacent surface
(retained-required — jsdom cannot measure layout, so this is a Chrome/playwright
pass over `storybook-static`).

## Commands Run

- `nx run-many -t build test -p @zeroxsolutions/ui` → **build + test green; 45 files, 209 tests passed**.
- `nx build-storybook @zeroxsolutions/storybook` → green (`storybook-static`, 428 MB, `index.json` present).
- Real browser: `playwright@1.61.1` launched with `channel: 'chrome'` (system Google Chrome — no browser download) against `storybook-static` served on `:6100` (`python3 -m http.server`). Per-story `getBoundingClientRect` readings on the affected surfaces, at `deviceScaleFactor: 2`.

## Manual Checks (real-browser computed sizes)

| Surface (story) | Task | Measured | Intended | ✓ |
| --- | --- | --- | --- | --- |
| `tag-input` remove-X | 2.1 / 3.1 | Button 24×24, svg 12×12 | icon-xs 24 / svg 12 | ✓ |
| `tree-row` toggle | 3.2 | Button 24×24, svg 12 | icon-xs 24 / svg 12 | ✓ |
| `tree-item` name region | 4.1 | tag = **`div`**, `button:has(input)` = 0 | a `div`, not a neutralised `Button` | ✓ |
| `conversation` scroll btn | 3.3 | Button 32×32, svg 16 | icon-sm 32 | ✓ |
| `code-block` copy btn | 3.4 | Button 24×24, svg 12 | icon-xs 24 | ✓ |
| `LanguageSwitcher` default trigger (what `code-block:259` now uses) | 4.2 | button role=combobox, h **32**; no chip | default `sm outline`, not a chip pile | ✓ |
| `avatar-editor` action btn | 3.5 | icon-sm variant = 32 (proven via `conversation`; instance needs a loaded image to render) | icon-sm 32 | ✓* |
| `sidebar-group` icons | 5.1 | svg 16 ×6 | 16 (primitive-applied) | ✓ |
| `sidebar-menu` icons | 5.1 | svg 16 ×7 | 16 (primitive-applied) | ✓ |
| `split-button` | 5.4 | svg 16 (menu item) + 10 (caret kept) | 16 default + keep 10px caret | ✓ |

Screenshots for every surface saved during the run; the two heavy re-tunes were
eyeballed — `tree-item` renders as ordinary clickable `div` rows (no ghost-Button
artefact), `code-block` header is a clean language label + 24px copy button.

## Evidence

- No horizontal overflow / native scrollbar introduced on any composite surface.
  The **only** overflowing element found was `div.w-full.base-ui-disable-scrollbar`
  inside `code-block` (a long code line, `scrollWidth 540 > clientWidth 512`) — the
  code block's **by-design** horizontal scroll rail, untouched by this refactor
  (which changed the copy button + language control, not the code scroll container).
- Every USE-VARIANT swap lands on the primitive's declared size (icon-xs 24 / svg 12,
  icon-sm 32 / svg 16); every redundant-removal icon renders at the primitive's
  enforced size (Button `[&_svg]:size-4`, Badge `[&>svg]:size-3!`).

## Residual Risks

- **`avatar-editor` icon-sm button** (3.5) is only shown once an image is loaded, so
  no story renders it without interaction; the icon-sm variant itself is proven at
  32px on `conversation`, and the site uses the identical `size="icon-sm"`.
- **`code-block` LanguageSwitcher** (4.2) renders only in the editable/`onLanguageChange`
  mode (the ai-elements stories are read-only); its default trigger is verified at
  32px via the `LanguageSwitcher` dropdown stories, which is exactly the trigger the
  refactored `code-block` now accepts.
- **Task 6.4** (regression-test-discriminates) is **N/A** — no override-removal
  regression test was added; the change only *removes* redundant classes/components
  (four component+spec deletions), leaving the pre-existing co-located specs green.
- Deletions removed **public `./*` exports** (`mono-chip`/`dirty-dot`/`status-dot`/
  `tab-close-button`) → a breaking surface change (`lib-public-exports-and-semver`);
  the SemVer major bump is handled separately per the change's Impact.

## Manual Adjustments

None.
