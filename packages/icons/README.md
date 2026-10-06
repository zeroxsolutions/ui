# @zeroxsolutions/icons

Two kinds of icon, each exposed as a real import subpath:

- **`brand-mark`** - brand **marks** (logos [lucide-react](https://lucide.dev)
  doesn't ship): one `<BrandMark name="...">` component that draws any of about 200
  brands, spanning the AI ecosystem, dev/cloud/infra, social / communication and
  workspace / productivity. The artwork is SVG files served from a CDN, not inline
  components, so no mark costs bundle size and there is no runtime dependency on an icon library.
- **`material/`** - the [Material Icon Theme](https://github.com/material-extensions/vscode-material-icon-theme)
  **file-type icons** (language / framework / tooling glyphs). Reach here for a
  file-kind icon; use lucide for generic UI glyphs.

```tsx
import { BrandMark } from '@zeroxsolutions/icons/brand-mark';
import { TypescriptIcon } from '@zeroxsolutions/icons/material/typescript';

<BrandMark name="facebook" />; // variant 'color': the brand's own colours
<BrandMark name="openai" variant="mono" />; // one colour, the text colour around it
<BrandMark name="claude" variant="avatar" size={32} />;
<BrandMark name="google" label="Google" />; // named; without `label` it is decorative
<TypescriptIcon size="1.5rem" />; // full-color file icon
```

## Install

```sh
pnpm add @zeroxsolutions/icons react react-dom
```

`react` / `react-dom` are peer dependencies (React 19).

## Brand marks

- `name` is `BrandMarkName`, a union generated from the manifest; a mistyped name does not compile.
- `variant` is `'color' | 'mono' | 'avatar' | 'combine'`, default `'color'`.
- `size` is a number of pixels or a CSS length, default `'1em'`; the mark keeps its own aspect ratio.
- `label` gives the mark an accessible name. Without it the mark is `alt=""` / `aria-hidden`, since
  in a button or a link the text beside it is the name.
- `shape` (`'circle' | 'square'`, default `'circle'`) rounds an `avatar`; no other variant reads it.
- `base` serves one call from another origin; see **Serving the artwork**.

`BrandMarkStyleProvider` (`defaultStyle`, `style`, `onStyleChange`) makes the variant ambient for
every `<BrandMark>` below it; a call's own `variant` wins. `useBrandMarkStyle()` reads and sets it.
A `<BrandMark>` outside any provider reads the module default. Outside React,
`setBrandMarkStyle(variant)` sets that default and
`brandMarkUrl(name, { variant, base })` returns a file's URL, or `undefined` where the brand has no
file for that variant.

```tsx
import { BrandMark, BrandMarkStyleProvider, brandMarkUrl, useBrandMarkStyle } from '@zeroxsolutions/icons/brand-mark';

function StyleToggle() {
  const { style, setStyle } = useBrandMarkStyle();
  return (
    <button type="button" onClick={() => setStyle(style === 'color' ? 'mono' : 'color')}>
      <BrandMark name="github-mark" /> {style}
    </button>
  );
}

<BrandMarkStyleProvider defaultStyle="mono">
  <BrandMark name="openai" /> {/* mono, from the provider */}
  <BrandMark name="openai" variant="color" /> {/* the call wins */}
  <StyleToggle />
</BrandMarkStyleProvider>;

const url = brandMarkUrl('facebook', { variant: 'color' });
```

### How each variant draws

| Variant   | Element                                                                                                                                    |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `color`   | `<img src="<base>/color/<name>.svg">`                                                                                                      |
| `combine` | a `<span>` masked by `<base>/combine/<name>.svg` over `currentColor`: the mark beside its wordmark, drawn as `mono` is                     |
| `mono`    | a `<span>` whose `mask-image` is `<base>/mono/<name>.svg` over `background-color: currentColor`, so it takes the text colour and the theme |
| `avatar`  | `<img src="<base>/avatar/<name>.svg">`, rounded by `border-radius` per `shape`                                                             |

An `<img>` cannot take `currentColor`, which is why `mono` and `combine` are masks. A mask gives no
load or error event, so a masked mark also renders a hidden `<img>` of the same URL whose `onError`
drives the fallback below; the browser fetches the file once.

### When a variant is missing or fails

The manifest says which variants a brand has, so a missing one is resolved before any request:
`combine` and `avatar` fall to `color`, and `color` falls to `mono`. A file the manifest lists that
fails to load falls the same way, after the attempt. When `mono` itself fails, the mark renders the
first letter of its name in a round `<span>`, so nothing is ever blank. A file that fails before
React hydrates is caught on mount: an `<img>` that is `complete` with a `naturalWidth` of 0 counts
as failed.

### Serving the artwork

By default every file is read from `https://icons.zeroxsolutions.com/brands`, keyed
`<variant>/<name>.svg`. To serve them yourself, copy `dist/assets/brands` from the package to your
own origin and point the module at it:

```tsx
import { BrandMark, setBrandMarkBase } from '@zeroxsolutions/icons/brand-mark';

setBrandMarkBase('/vendor/brands'); // module-wide; `base` on one call wins over it
<BrandMark name="slack" base="https://cdn.example.com/brands" />;
```

Call `setBrandMarkBase` in a module both the server and the client evaluate, or pass `base`: a base set
on one side alone gives a server-rendered `src` the client's does not match. A base on another origin
must answer with `Access-Control-Allow-Origin`, since `mono` and `combine` are fetched in CORS mode.

Files are cached with `Cache-Control: public, max-age=31536000, immutable` and keys are not
content-hashed. Artwork re-sourced under the same key therefore serves stale for the year that
header allows: upload it under a `v2/` prefix and move the default base to it. Old URLs keep
working and nothing is purged.

### Adding a brand

Add its files under `assets/brands/<variant>/<name>.svg` (`color`, `mono`, `avatar`, `combine`;
a brand needs only the variants it has), run `nx brand-manifest @zeroxsolutions/icons`, and commit
both the files and the regenerated `src/lib/brand-manifest.ts`. A `mono` file is filled black,
since a mask reads only its alpha. `nx rclone:sync @zeroxsolutions/icons` uploads `assets/` to the
bucket named by `ICONS_BUCKET`; CI runs it on every push to `production`.

### Sources

| Domain                    | Source                           | Examples                                                                                                                                                                                                   |
| ------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Model labs / providers    | lobehub                          | `openai`, `anthropic`, `claude`, `gemini`, `mistral`, `deepseek`, `grok`, `qwen`, `perplexity`, `cohere`, `nvidia`, ...                                                                                    |
| Inference / hosting       | lobehub                          | `huggingface`, `groq`, `cerebras`, `ollama`, `together`, `fireworks`, `replicate`, `fal`, ...                                                                                                              |
| Voice / speech            | lobehub                          | `elevenlabs`, `assemblyai`, `livekit` (+ existing `deepgram`, `pipecat`, `inworld`)                                                                                                                        |
| Generative media          | lobehub                          | `midjourney`, `ideogram`, `runway`, `luma`, `flux`, `suno`, `sora`, `kling`, ... (+ `leonardo`)                                                                                                            |
| Agent / tooling           | lobehub                          | `langchain`, `llamaindex`, `crewai`, `dify`, `n8n`, `zapier`, `mcp`, ...                                                                                                                                   |
| Vector / data             | Simple Icons + others            | `qdrant`, `milvus`, `redis`, `mongodb`, `supabase`, `pinecone`, `chroma`, ...                                                                                                                              |
| Dev / cloud / infra       | lobehub + Simple Icons + others  | `aws`, `azure`, `gcp`, `docker`, `kubernetes`, `terraform`, `stripe`, `twilio`, `heroku`, `sendgrid`, `segment`, `github-mark`, ...                                                                        |
| Social / communication    | Simple Icons + gilbarbara        | `facebook`, `messenger`, `instagram`, `threads`, `x`, `linkedin`, `youtube`, `tiktok`, `reddit`, `pinterest`, `snapchat`, `mastodon`, `bluesky`, `whatsapp`, `telegram`, `signal`, `wechat`, `line`        |
| Workspace / collaboration | Simple Icons + gilbarbara + svgl | `slack`, `discord`, `microsoft-teams`, `zoom`, `google-meet`, `notion`, `figma`, `trello`, `asana`, `jira`, `confluence`, `linear`, `miro`, `airtable`, `monday`, `clickup`, `dropbox`, `loom`, `calendly` |
| Mail / office             | Simple Icons + gilbarbara + svgl | `gmail`, `google-drive`, `google-docs`, `google-calendar`, `outlook`, `onedrive`                                                                                                                           |
| App stores                | gilbarbara                       | `apple`, `google-play`                                                                                                                                                                                     |
| AI Gateway providers      | lobehub + vendor                 | `bedrock`, `vertexai`, `xai`, `parallel` (closing the [Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/usage/providers/) provider gap)                                                 |

Marks are vendored from [`@lobehub/icons`](https://github.com/lobehub/lobe-icons)
(MIT - the AI brands, with full variants), [Simple Icons](https://simpleicons.org)
(CC0 - most dev/infra + social/workspace),
[gilbarbara/logos](https://github.com/gilbarbara/logos) (`linkedin`,
`microsoft-teams`, `onedrive`, `monday`, `apple`, `google-play`, and existing `hume`, `pinecone`, `heroku`,
`twilio`, `sendgrid`, `segment`), [svgl](https://svgl.app) (`outlook`), and
`parallel.ai` / vendor SVGs. A full-colour / gradient mark (`microsoft-teams`, `outlook`, `onedrive`, `monday`,
`google-play`) has a `color` file and no `mono`. Which variants a brand has follows its source,
and the manifest records them.

## `material/`

The Material Icon Theme **file icons** - 587 full-color components at
`@zeroxsolutions/icons/material/<name>`, of which 46 also expose a `.Light`
sub-component. Folder icons are not included. The export symbol is the
PascalCase of the name plus `Icon` (`typescript` -> `TypescriptIcon`,
`3d` -> `ThreeDIcon`).

## Attribution & trademarks

The `material/` icons are from the
[Material Icon Theme](https://github.com/material-extensions/vscode-material-icon-theme),
**MIT-licensed** - vendored as React components; the MIT license and copyright
are retained by that project.

The brand artwork under `assets/brands/` is vendored from [`@lobehub/icons`](https://github.com/lobehub/lobe-icons)
(**MIT**) and [Simple Icons](https://simpleicons.org) (**CC0**), from
[gilbarbara/logos](https://github.com/gilbarbara/logos) and [svgl](https://svgl.app),
plus vendor-supplied / hand-inlined SVGs (`inworld`, `leonardo`, `github-mark`,
`parallel`); the avatar and combine drawings adapt lobehub's `IconAvatar` and `IconCombine` (MIT).
There is **no runtime dependency** on any icon library. Each mark is the trademark of its
owner, included for identification/attribution only - not affiliation or
endorsement; follow each owner's brand guidelines when you use them. This applies
with particular care to the trademark-restrictive families - LinkedIn (whose logo
Simple Icons no longer ships), the Meta family (Facebook, Instagram, WhatsApp,
Messenger, Threads), and the Microsoft family (Teams, Outlook, OneDrive).

## Development

```sh
nx build @zeroxsolutions/icons           # build to dist/ (subpaths, plus dist/assets)
nx typecheck @zeroxsolutions/icons       # type-check the source
nx test @zeroxsolutions/icons            # unit + render tests via Vitest
nx brand-manifest @zeroxsolutions/icons  # regenerate src/lib/brand-manifest.ts from assets/brands
nx rclone:sync @zeroxsolutions/icons     # upload assets/ to the icons bucket
```
