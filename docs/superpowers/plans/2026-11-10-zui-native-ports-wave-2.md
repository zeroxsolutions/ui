# zui native, wave 2: the inputs - implementation plan

**Spec:** `docs/superpowers/specs/2026-11-10-zui-native-ports-wave-2-design.md`, under
`docs/superpowers/specs/2026-11-09-zui-native-zui-ports-design.md`.

**Goal:** number-field, tag-input, language-toggle-group, language-combobox, frontmatter-form,
emoji-appearance-toggle-group and command-menu are in the 16 native registries, and wave 1's three
untested behaviours have real-browser cases.

## Global constraints

- One pull request, on `feat/native-zui-ports-wave-2`. Nothing is deployed.
- An item is registered where wave 1's are: `packages/native-ui/registry.json`, `src/examples/<name>-demo.tsx`
  and `src/examples/index.ts`, its docs page with `meta.json` and the `index.mdx` row, the native e2e's page
  and registry lists, and its name out of `PENDING` in `src/build/web-twins.spec.ts`.
- Specs follow the testing skills: no class assertions, `userEvent` only, each case seen red before the code
  that passes it. A behaviour jest cannot show is a case in `apps/registry-native-ui-docs-zone-e2e`.
- New npm dependency: `expo-image`, through the `expo` catalog.

## Review focus

- A key handled in `onKeyPress` that a touch keyboard never sends, with no other way to the same result.
- A native lib copied from the web (expr-eval, language options, emoji URL) drifting from its source with
  no spec comparing them.
- A demo whose new state changes what the docs page shows a reader.

## Task 1: the libs

- `src/registry/lib/expr-eval.ts`, the web's verbatim, with the web's spec cases.
- `src/registry/lib/language-options.ts`: the code table and aliases with no icons, `findLanguageOption`,
  locale labels with the web's try and fallback. A spec compares ids, labels and aliases against the web
  table (`packages/ui/registry/bases/base-ui/lib/language-options.tsx`).
- `src/registry/lib/fluent-emoji.tsx`: `fluentEmojiUrl(glyph, style)` with the CDN base, and `FluentEmoji`
  over `expo-image`, falling back to the glyph as text on error. A spec compares the URL with the package's
  `fluentEmojiUrl` given the same base, over a plain glyph, a ZWJ sequence and a flag, in every style.
- Each lib is a `registry:lib` entry its items name.

## Task 2: the seven items

In three batches, each ending with native-ui test, typecheck, lint and build-registry and a commit:
language-toggle-group, emoji-appearance-toggle-group, command-menu; then number-field, tag-input; then
language-combobox, frontmatter-form. `cn-number-field` goes in `UNDRAWN_SLOTS`.

## Task 3: real-browser cases

In `apps/registry-native-ui-docs-zone-e2e`, driving each demo in its preview frame:

- number-field's Escape and arrows, and tag-input's Backspace;
- editor-tab's close not activating its tab, chat-suggestion-item's and copy-button's prevented default,
  their demos gaining the state that shows it.

Run against a local build of the zone in Chromium.

## Task 4: screenshots and the pull request

Screenshots of the seven in vega and nova from the web export, each looked at. Then push and open the pull
request, with the Expo Go list from the spec.
