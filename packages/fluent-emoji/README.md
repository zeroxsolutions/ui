# @zeroxsolutions/fluent-emoji

Self-hosted Microsoft **Fluent Emoji** — a committed Unicode CLDR
catalog plus the artwork in five styles (four static + animated), resolved by
codepoint. No third-party CDN.

```tsx
import { FluentEmoji, EMOJI_CATEGORIES } from '@zeroxsolutions/fluent-emoji';

<FluentEmoji glyph="🤯" name="exploding head" />;
{
  /* 3D (default) */
}
<FluentEmoji glyph="🤯" name="exploding head" variant="flat" />;
```

## Styles

Five styles ship in the package, each in its own `assets/<style>/` subfolder.
Pick one per call with `variant` (component) / `style` (`fluentEmojiUrl`), or set
a default with `setFluentEmojiStyle`.

| `variant` | source style         | format        |
| --------- | -------------------- | ------------- |
| `3d`      | Fluent 3D (default)  | webp          |
| `flat`    | Fluent Flat          | svg           |
| `modern`  | Fluent Color (2D)    | svg           |
| `mono`    | Fluent High Contrast | svg           |
| `anim`    | Fluent Animated      | webp (animated) |

```tsx
<FluentEmoji glyph="🎉" name="party popper" variant="anim" />;
```

The **animated** (`anim`) artwork is by far the heaviest set — animated webp run
hundreds of KB/glyph (~280 MB total). It is committed in the repo and self-hosted
like the rest, but it is **deliberately excluded from the npm tarball** so a plain
`npm install` stays small (~28 MB) for consumers that only need the static styles.
To use `anim`, host `assets/anim/` on a CDN and point that one style at it with
{@link setFluentEmojiStyleBase} — see **Deploying the animated style to a CDN**
below. Without an `anim` base configured, animated glyphs fall back to the native
glyph (as do any glyphs with no animated artwork upstream, by design).

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

## Deploying the animated style to a CDN

The four static styles ship inside the package (`dist/assets/{3d,flat,modern,mono}/`);
the animated `anim` set does **not** — it is excluded from the tarball to keep
installs small. So `anim` has to be hosted separately and routed to its own base,
while the static styles keep resolving from the package or your public dir.

1. **Upload the artwork.** The committed `assets/anim/` (or `dist/assets/anim/`
   after a build) holds the files keyed by codepoint. Sync it first if it's not
   present, then push it to any static host / bucket / CDN:

   ```sh
   node scripts/sync-anim.mjs                                   # (re)build assets/anim/
   aws s3 sync assets/anim s3://my-bucket/fluent-emoji/anim     # or Cloudflare R2 / GCS / …
   ```

2. **Point only `anim` at that CDN.** The resolver appends `/<style>/<codepoint>.<ext>`,
   so the upload target above is `<animBase>/anim/`:

   ```ts
   import {
     setFluentEmojiBase,
     setFluentEmojiStyleBase,
   } from '@zeroxsolutions/fluent-emoji';

   setFluentEmojiBase('/fluent-emoji'); // 3d/flat/modern/mono from your public dir
   setFluentEmojiStyleBase('anim', 'https://cdn.example.com/fluent-emoji'); // anim from the CDN
   // <FluentEmoji glyph="🎉" variant="anim" /> →
   //   https://cdn.example.com/fluent-emoji/anim/1f389.webp
   ```

   A per-call `base` still wins; `setFluentEmojiStyleBase('anim', undefined)`
   clears the override. (If you'd rather serve **all** styles from one CDN, upload
   the whole `assets/` tree and use `setFluentEmojiBase` alone — no per-style base
   needed.)

## Regenerating the artwork

The four static styles, in order:

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

The animated style is owned by a separate script (it has no dev dep — the set is
~700 MB, split across four npm packages):

```sh
node scripts/sync-anim.mjs     # rebuild assets/anim/ from @lobehub/fluent-emoji-anim-1..4
```

`sync-anim.mjs` streams each `@lobehub/fluent-emoji-anim-{1..4}` tarball straight
from the npm registry, extracts its `assets/*.webp`, and copies the catalog
matches under our codepoint key — normalizing the upstream zero-padded, FE0F-bearing
names to ours. Pass `--dry` to preview the source packages without downloading.
Microsoft only animated a subset of the catalog: most faces/objects carry real
animation frames, while many symbols, keycaps, and flags ship as static webp so
every glyph still resolves; the rest fall back to the native glyph, as above.

## Attribution & licensing

The emoji artwork is **Microsoft Fluent Emoji** (MIT), redistributed here via
**[@lobehub/fluent-emoji](https://github.com/lobehub/fluent-emoji)** (MIT,
the `-3d`/`-flat`/`-modern`/`-mono` static packages and the
`-anim-1`…`-anim-4` animated packages) and, for gap-fills, directly from
**[microsoft/fluentui-emoji](https://github.com/microsoft/fluentui-emoji)**
(MIT). This package only repackages those assets for self-hosting; the wrapper
code/catalog is Chisel's. Both upstream projects are MIT-licensed — see their
repositories' `LICENSE` files for the full notices
([lobehub](https://github.com/lobehub/fluent-emoji/blob/master/LICENSE),
[microsoft](https://github.com/microsoft/fluentui-emoji/blob/main/LICENSE)).
Microsoft trademarks (e.g. Clippy, Windows-logo glyphs) are not included and no
Microsoft endorsement is implied.
