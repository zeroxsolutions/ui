# zui native, wave 4: the pickers - implementation plan

**Spec:** `docs/superpowers/specs/2026-11-11-zui-native-ports-wave-4-design.md`, under the first spec and waves 2-3's
test rules.

**Goal:** `@zeroxsolutions/fluent-emoji/catalog` exists and is published; emoji-picker and avatar-picker are in the
16 native registries; `PENDING` is empty.

## Global constraints

- Pull request A from master (`feat/fluent-emoji-catalog`), pull request B on wave 3's branch
  (`feat/native-zui-ports-wave-4`). Nothing is deployed.
- The npm publish runs only on the person's go-ahead, after A merges.
- Specs: behaviour only, `userEvent`, red first; copied code compared with its source.

## Review focus

- A chunk of `dist/catalog.js` that pulls `fluent-emoji-url` and with it `import.meta`.
- A FlatList whose `scrollToIndex` fails for rows not yet measured (needs `getItemLayout` or a failure handler).
- An `onUpload` that throws or resolves null leaving the pane stuck uploading.

## Task 1 (pull request A): the catalog subpath

- `packages/fluent-emoji/src/catalog.ts` re-exports `emoji-categories`, `emoji-manifest`, `emoji-to-unicode`.
- `vite.config.mts`: entries `index` and `catalog`; `package.json` exports `./catalog` (types, import, default).
- A spec builds nothing itself: it reads `dist/catalog.js` and every chunk it imports and finds no `import.meta`,
  run after `nx build fluent-emoji` (wire the spec's target to depend on build, or put the check in a script the
  build target runs, whichever the package's targets allow).
- Checks: fluent-emoji build, test, lint, typecheck; ui typecheck and test (the root entry is unchanged).
- Push, pull request, CI. After merge: `pnpm nx release --projects=fluent-emoji --dry-run`, report the version,
  and publish only on the go-ahead.

## Task 2: the lib reads the manifest (B)

Native `lib/fluent-emoji.tsx` imports the manifest from `@zeroxsolutions/fluent-emoji/catalog`; no request for a
glyph without artwork. Its comparison spec adds a glyph with no artwork. `@zeroxsolutions/fluent-emoji` moves to
native-ui's dependencies and into both preview apps.

## Task 3: emoji-picker (B)

Native lib copy of `emojiPickerRows` with its comparison spec; the parts over a FlatList with sticky headers and
`scrollToIndex`; demo, docs, registry, e2e lists, out of `PENDING`.

## Task 4: avatar-picker (B)

`expo-image-picker` into the `expo` catalog (exact latest `58.0.x`), native-ui and both preview apps; the parts; the
hex colour field; demo, docs, registry, e2e lists, out of `PENDING`.

## Task 5: browser cases, screenshots, pull request B

Emoji nav scrolling and search typed in a real field, in the three browsers; screenshots of both pickers in vega
and nova, opened; push, pull request with the Expo Go list.
