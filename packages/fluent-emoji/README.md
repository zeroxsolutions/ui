# @chiselart/fluent-emoji

Self-hosted Microsoft **Fluent 3D** emoji for Chisel — a committed Unicode CLDR
catalog plus the artwork, resolved by codepoint. No third-party CDN.

```tsx
import { FluentEmoji, EMOJI_CATEGORIES } from '@chiselart/fluent-emoji';

<FluentEmoji glyph="🤯" name="exploding head" />;
```

## Serving the artwork

The `.webp` files ship in the package under `dist/assets/` (keyed by codepoint,
e.g. `1f92f.webp`). `fluentEmojiUrl(glyph)` / `<FluentEmoji>` resolve
`<base>/<codepoint>.webp`. Because Vite library mode force-inlines bundled
assets, the artwork is shipped as raw files instead — the consuming app serves
them and points the resolver at the base:

```ts
import { setFluentEmojiBase } from '@chiselart/fluent-emoji';

// e.g. after copying `@chiselart/fluent-emoji/dist/assets` to `public/fluent-emoji`,
// or pointing at a CDN:
setFluentEmojiBase('/fluent-emoji');
```

A missing asset (or a load error) falls back to the native glyph, so nothing
renders blank.

## Regenerating the artwork

`node scripts/sync-assets.mjs` rebuilds `assets/` from `@lobehub/fluent-emoji-3d`
(a dev-only dependency), copying one `.webp` per catalog glyph under our codepoint
key.

## Attribution & licensing

The emoji artwork is **Microsoft Fluent Emoji** (MIT), redistributed here via
**[@lobehub/fluent-emoji-3d](https://github.com/lobehub/fluent-emoji)** (MIT).
This package only repackages those assets for self-hosting; the wrapper
code/catalog is Chisel's. Both upstream MIT notices are reproduced verbatim in
[`THIRD_PARTY_LICENSES`](./THIRD_PARTY_LICENSES) and travel in the published
tarball. Microsoft trademarks (e.g. Clippy, Windows-logo glyphs) are not
included and no Microsoft endorsement is implied.
