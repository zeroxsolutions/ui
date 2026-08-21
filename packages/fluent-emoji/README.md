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
It is still committed in the repo, and the house CDN serves it alongside the other
four (see **Serving every style from one base** below).
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

## Serving every style from one base

`anim` is not in the tarball, so a consumer that wants animated glyphs needs a host
for it. Hosting the **whole** `assets/` tree is what removes the second base entirely:
the resolver appends `/<style>/<codepoint>.<ext>` to one root, so one base covers all
five styles and `setFluentEmojiStyleBase` becomes unnecessary.

Inside ZeroXSolutions that host is `https://fluent-emoji.zeroxsolutions.com`, an R2
bucket this repo publishes to (`nx rclone:sync fluent-emoji`).

```ts
import { setFluentEmojiBase } from '@zeroxsolutions/fluent-emoji';

setFluentEmojiBase('https://fluent-emoji.zeroxsolutions.com');
// <FluentEmoji glyph="🎉" variant="anim" /> ->
//   https://fluent-emoji.zeroxsolutions.com/anim/1f389.webp
```

**A different host per style** is still available where you want one - `anim` remote and
the static styles from your own public directory, say:

```ts
setFluentEmojiBase('/fluent-emoji');                                   // 3d/flat/modern/mono
setFluentEmojiStyleBase('anim', 'https://cdn.example.com/fluent-emoji'); // anim only
```

A per-call `base` still wins over both, and `setFluentEmojiStyleBase('anim', undefined)`
clears the override.

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
