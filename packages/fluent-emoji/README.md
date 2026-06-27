# @zeroxsolutions/fluent-emoji

Self-hosted Microsoft **Fluent Emoji** for Chisel — a committed Unicode CLDR
catalog plus the artwork in four styles, resolved by codepoint. No third-party
CDN.

```tsx
import { FluentEmoji, EMOJI_CATEGORIES } from '@zeroxsolutions/fluent-emoji';

<FluentEmoji glyph="🤯" name="exploding head" />;
{
  /* 3D (default) */
}
<FluentEmoji glyph="🤯" name="exploding head" variant="flat" />;
```

## Styles

Four static styles ship in the package, each in its own `assets/<style>/`
subfolder. Pick one per call with `variant` (component) / `style`
(`fluentEmojiUrl`), or set a default with `setFluentEmojiStyle`.

| `variant` | source style         | format |
| --------- | -------------------- | ------ |
| `3d`      | Fluent 3D (default)  | webp   |
| `flat`    | Fluent Flat          | svg    |
| `modern`  | Fluent Color (2D)    | svg    |
| `mono`    | Fluent High Contrast | svg    |

The **animated** style is intentionally not bundled — animated webp average
~300 KB/glyph (~527 MB for the catalog), too large to self-host. To add it later,
resolve it lazily from a CDN; see the implementation note in the workspace plan.

## Serving the artwork

The files ship under `dist/assets/<style>/` (keyed by codepoint, e.g.
`3d/1f92f.webp`, `flat/1f92f.svg`). `fluentEmojiUrl(glyph, { style })` /
`<FluentEmoji>` resolve `<base>/<style>/<codepoint>.<ext>`. Because Vite library
mode force-inlines bundled assets, the artwork is shipped as raw files instead —
the consuming app serves them and points the resolver at the base:

```ts
import { setFluentEmojiBase } from '@zeroxsolutions/fluent-emoji';

// e.g. after copying `@zeroxsolutions/fluent-emoji/dist/assets` to `public/fluent-emoji`
// (recursively — keep the style subfolders), or pointing at a CDN:
setFluentEmojiBase('/fluent-emoji');
```

A missing asset (or a load error) falls back to the native glyph, so nothing
renders blank.

## Regenerating the artwork

Run both, in order:

```sh
node scripts/sync-assets.mjs   # copy each style from its @lobehub/* dev dep
node scripts/fill-gaps.mjs     # fill the few gaps from microsoft/fluentui-emoji
```

`sync-assets.mjs` rebuilds `assets/<style>/` from the `@lobehub/fluent-emoji-*`
dev deps (3d/flat/modern/mono), one file per catalog glyph under our codepoint
key. Those sets are built from an older Microsoft snapshot, so they miss some
glyphs; `fill-gaps.mjs` pulls the missing artwork that exists in Microsoft's
source repo (3D png → webp via `sharp`; the rest as svg) and reports the
remainder — newest-Unicode glyphs, country/subdivision flags, and family/couple
sequences that have **no** Fluent artwork anywhere and stay on the native-glyph
fallback by design.

## Attribution & licensing

The emoji artwork is **Microsoft Fluent Emoji** (MIT), redistributed here via
**[@lobehub/fluent-emoji](https://github.com/lobehub/fluent-emoji)** (MIT,
the `-3d`/`-flat`/`-modern`/`-mono` packages) and, for gap-fills, directly from
**[microsoft/fluentui-emoji](https://github.com/microsoft/fluentui-emoji)**
(MIT). This package only repackages those assets for self-hosting; the wrapper
code/catalog is Chisel's. Both upstream MIT notices are reproduced verbatim in
[`THIRD_PARTY_LICENSES`](./THIRD_PARTY_LICENSES) and travel in the published
tarball. Microsoft trademarks (e.g. Clippy, Windows-logo glyphs) are not
included and no Microsoft endorsement is implied.
