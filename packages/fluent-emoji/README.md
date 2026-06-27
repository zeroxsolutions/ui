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

Five styles are available, each in its own `assets/<style>/` subfolder. Pick one
per call with `variant` (component) / `style` (`fluentEmojiUrl`), or set a default
with `setFluentEmojiStyle`. (Four ship in the npm tarball; `anim` is self-hosted
separately — see below.)

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

The **animated** (`anim`) artwork is the heaviest set — animated webp run hundreds
of KB/glyph (~280 MB total) — so it is **excluded from the npm tarball** to keep a
plain `npm install` small (~28 MB) for consumers that only need the static styles.
It is still committed in the repo for self-hosting; serve it from a CDN with
`setFluentEmojiStyleBase` (see **Deploying the animated style to a CDN** below).
Without an `anim` base configured, animated glyphs fall back to the native glyph
(as do any glyphs with no upstream artwork, by design).

## Serving the artwork

The four static styles ship under `dist/assets/<style>/` (keyed by codepoint, e.g.
`3d/1f92f.webp`, `flat/1f92f.svg`; `anim` is the exception — see below).
`fluentEmojiUrl(glyph, { style })` / `<FluentEmoji>` resolve
`<base>/<style>/<codepoint>.<ext>`. Because Vite library mode force-inlines
bundled assets, the artwork is shipped as raw files instead — the consuming app
serves them and points the resolver at the base:

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

1. **Upload the artwork.** The committed `assets/anim/` holds the files keyed by
   codepoint — push it to any static host / bucket / CDN:

   ```sh
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

## Artwork provenance

The artwork under `assets/<style>/` is **pre-generated and committed** — there is
no in-repo regeneration tooling. It is keyed by codepoint and sourced from
LobeHub's repackages of Microsoft Fluent Emoji — the static
`@lobehub/fluent-emoji-{3d,flat,modern,mono}` and animated
`@lobehub/fluent-emoji-anim-1`…`-anim-4` packages — plus a few gap-fills from
`microsoft/fluentui-emoji`. Microsoft only animated a subset of the catalog, so in the `anim` set
most faces/objects carry real animation frames while many symbols, keycaps, and
flags are static; glyphs with no upstream artwork fall back to the native glyph,
by design.
