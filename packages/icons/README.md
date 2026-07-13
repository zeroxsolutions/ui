# @zeroxsolutions/icons

Inline-SVG React icons organized into **categories**, each exposed as a real
import subpath. One icon per subpath, imported as
`@zeroxsolutions/icons/<category>/<name>`:

- **`brands/`** — AI + dev/infra **marks** (logos [lucide-react](https://lucide.dev)
  doesn't ship). A self-sufficient set of **129** vendored marks — model labs,
  inference hosts, voice, generative media, agent tooling, vector/data stores, and
  dev/cloud/infra — each a compound component with the [`@lobehub/icons`](https://github.com/lobehub/lobe-icons)
  variant surface (`.Color` / `.Mono` / `.Avatar` / `.Text` / `.Combine`) **where
  each variant exists**. No runtime dependency on any icon library.
- **`material/`** — the [Material Icon Theme](https://github.com/material-extensions/vscode-material-icon-theme)
  **file-type icons** (language / framework / tooling glyphs). Reach here for a
  file-kind icon; use lucide for generic UI glyphs.

```tsx
import { OpenaiMark } from '@zeroxsolutions/icons/brands/openai';
import { GeminiMark } from '@zeroxsolutions/icons/brands/gemini';
import { GithubMark } from '@zeroxsolutions/icons/brands/github-mark';
import { TypescriptIcon } from '@zeroxsolutions/icons/material/typescript';

<OpenaiMark size="1.25rem" />;          {/* base mark (mono, currentColor) */}
<GeminiMark.Color size="1.5rem" />;     {/* full brand-colour artwork */}
<GeminiMark.Avatar size={32} />;        {/* icon on a filled background */}
<GithubMark className="size-5" />;      {/* the one exception: currentColor, sized via className */}
<TypescriptIcon size="1.5rem" />;       {/* full-color file icon */}
```

## Install

```sh
pnpm add @zeroxsolutions/icons react react-dom
```

`react` / `react-dom` are peer dependencies (React 19).

## Component pattern

An icon is a base component; its variants are attached as PascalCase
**sub-components** (the compound pattern). The base renders the default variant;
a sub-component exists only when that variant exists for the icon.

- **Material** icons are full-color: `<Icon size="1em" />`, colors intrinsic (no
  `currentColor`), each keeps its source `viewBox`. Icons with a light-background
  artwork expose it as `Icon.Light` (theme variant).
- **Brand marks** follow the [`@lobehub/icons`](https://github.com/lobehub/lobe-icons)
  variant surface. The base renders the default (mono, `currentColor`); a mark
  exposes the variants it has:
  - `.Color` — full brand-colour artwork (intrinsic colours)
  - `.Mono` — monochrome, inherits `currentColor`
  - `.Avatar` — icon on a filled background (`size`, `background`, `color`, `iconMultiple`)
  - `.Text` — the brand wordmark (`size`, `text`, `textColor`)
  - `.Combine` — icon + wordmark (`size`, `text`, `textColor`)

  A variant absent for a brand is a type error, not a stub. `GithubMark` is the one
  exception — it paints with `currentColor` and takes standard SVG props (size it
  with `className`).

```tsx
import { OpenaiMark } from '@zeroxsolutions/icons/brands/openai';

<OpenaiMark size={24} />;         // base (mono)
<OpenaiMark.Avatar size={40} />;  // icon on the brand background
<OpenaiMark.Text />;              // wordmark (Avatar/Text/Combine default size = 24)
```

## Categories

### `brands/`

Each mark is `@zeroxsolutions/icons/brands/<name>`; the export symbol is the
PascalCase of the name plus `Mark` (`openai` → `OpenaiMark`). **129** marks span
the AI ecosystem and dev/infra:

| Domain | Source | Examples |
| --- | --- | --- |
| Model labs / providers | lobehub | `openai`, `anthropic`, `claude`, `gemini`, `mistral`, `deepseek`, `grok`, `qwen`, `perplexity`, `cohere`, `nvidia`, … |
| Inference / hosting | lobehub | `huggingface`, `groq`, `cerebras`, `ollama`, `together`, `fireworks`, `replicate`, `fal`, … |
| Voice / speech | lobehub | `elevenlabs`, `assemblyai`, `livekit` (+ existing `deepgram`, `pipecat`, `inworld`) |
| Generative media | lobehub | `midjourney`, `ideogram`, `runway`, `luma`, `flux`, `suno`, `sora`, `kling`, … (+ `leonardo`) |
| Agent / tooling | lobehub | `langchain`, `llamaindex`, `crewai`, `dify`, `n8n`, `zapier`, `mcp`, … |
| Vector / data | Simple Icons + others | `qdrant`, `milvus`, `redis`, `mongodb`, `supabase`, `pinecone`, `chroma`, … |
| Dev / cloud / infra | lobehub + Simple Icons + others | `aws`, `azure`, `gcp`, `docker`, `kubernetes`, `terraform`, `stripe`, `twilio`, `heroku`, `sendgrid`, `segment`, `github-mark`, … |

Marks are vendored from [`@lobehub/icons`](https://github.com/lobehub/lobe-icons)
(MIT — the AI brands, with full variants), [Simple Icons](https://simpleicons.org)
(CC0 — dev/infra, base + `.Color`/`.Mono`/`.Avatar`), and a few from
[svgl](https://svgl.app) / [gilbarbara/logos](https://github.com/gilbarbara/logos)
(`hume`, `pinecone`, `chroma`, `heroku`, `twilio`, `sendgrid`, `segment` — base +
`.Color`/`.Avatar`). Which variants a mark ships
follows its source; `.Text`/`.Combine` exist mainly on the lobehub AI marks.

### `material/`

The Material Icon Theme **file icons** — 587 full-color components at
`@zeroxsolutions/icons/material/<name>`, of which 46 also expose a `.Light`
sub-component. Folder icons are not included. The export symbol is the
PascalCase of the name plus `Icon` (`typescript` → `TypescriptIcon`,
`3d` → `ThreeDIcon`).

## Attribution & trademarks

The `material/` icons are from the
[Material Icon Theme](https://github.com/material-extensions/vscode-material-icon-theme),
**MIT-licensed** — vendored as React components; the MIT license and copyright
are retained by that project.

The `brands/` marks are vendored from [`@lobehub/icons`](https://github.com/lobehub/lobe-icons)
(**MIT**) and [Simple Icons](https://simpleicons.org) (**CC0**), a few from
[svgl](https://svgl.app) and [gilbarbara/logos](https://github.com/gilbarbara/logos),
plus vendor-supplied / hand-inlined SVGs (`inworld`, `leonardo`, `github-mark`); the
composition helpers under `brands/internal/` adapt lobehub's `useFillId`,
`IconAvatar`, and `IconCombine` (MIT). The marks are vendored — there is **no
runtime dependency** on any icon library. Each mark is the trademark of its owner,
included for identification/attribution only — not affiliation or endorsement;
follow each owner's brand guidelines when you use them.

## Development

```sh
nx build @zeroxsolutions/icons      # build to dist/ (nested category subpaths)
nx typecheck @zeroxsolutions/icons  # type-check the source
nx test @zeroxsolutions/icons       # unit + render smoke tests via Vitest
```
