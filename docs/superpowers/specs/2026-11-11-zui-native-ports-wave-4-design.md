# zui native, wave 4: the pickers

The first spec, `2026-11-09-zui-native-zui-ports-design.md`, governs this wave, and waves 2 and 3 set how tests are
written. This spec decides what those left open for the last two items, emoji-picker and avatar-picker. It also
decides where emoji-picker's catalog comes from, which the first spec left to the person: from a new subpath of
`@zeroxsolutions/fluent-emoji`.

## The catalog subpath

The native registries cannot import `@zeroxsolutions/fluent-emoji`. Its one entry also loads `fluent-emoji-url`,
whose module body reads `import.meta.url`, and that crashes on React Native as the module loads. The data the
picker needs has no such read:

- `emoji-categories`: 1914 emoji in 8 categories, each with its glyph, name and search text;
- `emoji-manifest`: which glyphs have artwork in each style;
- `emoji-to-unicode`.

The package gains a second entry, `@zeroxsolutions/fluent-emoji/catalog`, exporting those three and nothing that
reads `import.meta`. In detail:

- `src/catalog.ts` re-exports them.
- `vite.config.mts` builds it as a second library entry.
- `package.json` exports `./catalog`.
- A spec reads the built `dist/catalog.js` and finds no `import.meta` in it or in any chunk it imports.
- The web keeps importing the package root; nothing it does changes.

The subpath lands in its own pull request from master and is published to npm before the wave 4 ports merge.
Without that, `shadcn add` of a native picker installs 0.1.1, which lacks the subpath.

- The version is read off `nx release`'s dry run.
- The publish itself waits for the person's go-ahead, since it cannot be taken back.

In the repo, native-ui takes the package as `workspace:*`, now in its dependencies, so the ports build before the
publish.

## The emoji artwork on native

The native `fluent-emoji` lib (wave 2) builds a URL for any glyph and falls back to text only after the CDN
answers an error. A picker drawing 1914 glyphs would send a request for every one without artwork. The lib now
reads the manifest from the subpath, as the package's own `fluentEmojiUrl` does, and draws a glyph with no
artwork as text without a request. Its spec keeps comparing it with the package's builder, now over a glyph
with artwork and one without.

## emoji-picker

- The parts and props are the web's: `EmojiPicker` (`onSelect`, `frequent`), `EmojiPickerSearch`,
  `EmojiPickerContent` (`size`), `EmojiPickerEmpty` and `EmojiPickerNav`, plus any other part the web exports.
- The web lays the rows out with `emojiPickerRows`, eight to a row with a header per category, which is pure.
  It is copied into a native lib, with a spec comparing it with the web's over the whole catalog.
- `EmojiPickerContent` draws those rows in a FlatList, which mounts only what is near the screen, as the web's
  own virtualization does:
  - each category header sticks to the top;
  - `EmojiPickerNav` scrolls to a category through `scrollToIndex`.
- `EmojiPickerNav`:
  - a single-select native ToggleGroup across the full width;
  - a press on the active category does nothing, as on the web;
  - hidden while searching.
- `EmojiPickerSearch`:
  - filters as the web does, by the catalog's search text;
  - its animated search icon becomes lucide's static `Search`.

## avatar-picker

- The parts, the value (`emoji`, `imageUrl`, `color`) and its setters are the web's, over the native Popover and
  Tabs.
- The emoji pane composes the native emoji-picker.

**Upload.**

- `expo-image-picker`'s photo library replaces the hidden file input, the `FileReader` and the drop zone.
- `onUpload` keeps its name and its result, a URL or null, maybe as a promise. Its argument is the picked
  `ImagePickerAsset`, since React Native has no `File`.
- Without `onUpload`, the asset's `uri` becomes the image.
- The uploading state reaches the pane's children through the context, where the web uses group-data classes.
- Dragging a file in has no source on a phone and is dropped.
- The docs page says all of this.

**Colour.**

- The swatch group and the WCAG check colour are the web's.
- The web's `<input type="color">` has no React Native control, so `AvatarPickerColorField` is a text field for a
  `#rrggbb` hex value. It sets the colour once the value is valid.

## Dependencies

- `expo-image-picker` joins the `expo` catalog at the version Expo 58 bundles, `~58.0.10`, pinned exactly to its
  latest patch.
- It goes into native-ui and both preview apps, and avatar-picker's registry dependencies.
- `@zeroxsolutions/fluent-emoji` moves from native-ui's dev dependencies to its dependencies, and both preview
  apps declare it.

## Tests

As in waves 2 and 3:

- behaviour only, through `userEvent`, never a class;
- each case seen red before its code;
- a copied lib compared with its source.

The cases, per item:

- **emoji-picker:** search narrows and empties; a press selects; the frequent row shows; the nav moves to a
  category.
- **avatar-picker:**
  - each setter, including that remove keeps the colour;
  - the upload path with `onUpload` and without, through jest's mock of `expo-image-picker`'s native module (the
    one boundary a spec cannot cross);
  - the hex field.

Browser cases in the native zone's e2e: the emoji nav scrolling the list in a real FlatList, and a search typed
into a real field.

The Expo Go list:

- the photo library on iOS and Android;
- scrolling 1914 emoji;
- sticky headers;
- the emoji artwork in each style;
- the keyboard over a popover.

## Order

1. Pull request A, from master: the catalog subpath and its spec. Then the publish, on the person's go-ahead.
2. Pull request B, on wave 3's branch until that merges: the lib's manifest, emoji-picker, avatar-picker. Once
   it merges, `PENDING` is empty and `NOT_PORTED` holds only the block ai-provider-picker.
