# zui native: the ai-provider-picker block

The first spec, `2026-11-09-zui-native-zui-ports-design.md`, governs this port. Waves 2 to 4 set how tests are
written and how a copied lib is checked against its source; this port keeps both. After it, `NOT_PORTED` in
`web-twins.spec.ts` is empty.

The block was left out because the native registries published no block and the native docs had no blocks page
of their own. This spec decides those two, and where the block's provider marks come from on React Native.

## The brand-mark subpath

The web block draws each provider's mark with `AiProviderIcon` from `@zeroxsolutions/icons`, which renders DOM
`<img>` and `<span>` elements and cannot run on React Native. The marks themselves are SVG files on the brand-mark
CDN, `<base>/<variant>/<name>.svg`, and the package knows which files exist from its manifest. React Native can
draw them through `expo-image`, as the native fluent-emoji lib draws its artwork.

What the native side needs from the package is pure:

- `resolveAiProviderMark` and `aiProviderMappings`, already exported at `@zeroxsolutions/icons/ai-provider-mappings`;
- the manifest, the fallback chain, the aspect ratio and the URL builder, in `src/lib/brand-mark-url.ts` and
  `src/lib/brand-manifest.ts`, which the package's `exports` blocks (`"./lib/*": null`).

The package gains a top-level module, `@zeroxsolutions/icons/brand-mark-url`, re-exporting
`DEFAULT_BRAND_MARK_BASE`, `BRAND_MARKS`, `brandMarkChain`, `brandMarkRatio`, `brandMarkUrlFor` and the types
`BrandMarkName` and `BrandMarkVariant`.

- The package already builds one entry per source file and exports `./*`, so a file in `src/` is all it takes.
- A spec finds no `import.meta`, `document` or `window` read in the built module or any chunk it imports, as
  fluent-emoji's catalog spec does.
- It lands in its own pull request from master and is published before the port merges, on the person's go-ahead;
  `shadcn add` of the native block would otherwise install 0.1.1, which lacks it.

## The native marks

A native lib, `brand-mark` (`registry:lib`), holds two parts:

- `BrandMark`, with the web's `name`, `variant`, `size`, `label`, `base` and `shape`. It walks the same chain,
  `combine`/`avatar` to `color` to `mono`, falling to the next variant when `expo-image` reports an error, and past
  `mono` to the name's first letter on a tinted circle, so the mark is never blank.
  - `mono` and `combine` are one-colour files the web paints in the text colour through a CSS mask. React Native
    has no mask; `expo-image`'s `tintColor` paints them in the foreground colour instead.
  - The web's ambient style provider and `setBrandMarkBase` are not ported: the block names its variant.
- `AiProviderIcon`, with the web's `provider`, `type`, `size` and `label`, resolving the key through
  `resolveAiProviderMark` and drawing the web's sparkle placeholder for an unknown key, through
  `lucide-react-native`'s static `Sparkle`.

A spec compares the lib with the package over the whole manifest: for every mark and variant, the chain and the
URL the native lib uses equal the package's, and every provider key in `aiProviderMappings` resolves to the same
mark.

## The block

- `AiProviderPicker` keeps the web's props, `entries` and `onSelect`, and its sample,
  `AI_PROVIDER_PICKER_SAMPLE_ENTRIES`, copied and compared with the web's in a spec.
- Each card composes the native `AiProviderCard`, `AiProviderCardDescription`, `AiProviderCardLabel` and
  `AiProviderCardTrigger`, with `onPress` for the web's `onClick`, and the mark at 32 in its `avatar` variant beside
  the title.
- The web's grid is one column, two from `sm` and three from `lg`. The native block lays the cards out in a
  wrapping row at the same breakpoints, which NativeWind and Uniwind read from the window width; a card in a row
  keeps the height of the tallest beside it, as a grid row does.
- It is published as `registry:block` in the 16 native registries, with `@zeroxsolutions/icons` and `expo-image`
  in its dependencies.

## The native docs

- The native blocks page, `/native/blocks/<engine>`, lists the native blocks as the web's blocks page does, in
  place of its "No native blocks yet" state.
- The block has a docs page beside the components' pages, with its demo, its install line and the differences
  above: no mask, no ambient style, and a key the CDN serves no mark for drawing the letter.

## Tests

As in waves 2 to 4: behaviour only, through `userEvent`, never a class; each case seen red before its code; a
copied lib compared with its source.

- **brand-mark:** a mark draws its first variant's URL; an error moves it along the chain and past `mono` to the
  letter; a label names it and no label hides it from a screen reader.
- **ai-provider-icon:** a known key draws its mark; an unknown key draws the placeholder.
- **ai-provider-picker:** a card per entry, named "Select <name>"; a press calls `onSelect` with that entry's
  `provider`; the footer shows only where an entry has `meta`; no `entries` shows the sample.
- **Browser, in the native zone's e2e:** the block's demo draws a mark from the CDN, and the blocks page links the
  block's page.

The Expo Go list: the marks in each variant on iOS and Android, `mono` tinted in light and dark, and the grid at
phone and tablet widths.

## Order

1. Pull request A, from master: the `brand-mark-url` module and its spec. Then the publish, on the person's
   go-ahead.
2. Pull request B: the lib, the block, the blocks page and the docs page. `NOT_PORTED` becomes empty.
