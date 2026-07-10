# @zeroxsolutions/icons

Inline-SVG React icons organized into **categories**, each exposed as a real
import subpath. One icon per subpath, imported as
`@zeroxsolutions/icons/<category>/<name>`:

- **`brands/`** — brand and vendor **marks** (logos [lucide-react](https://lucide.dev)
  doesn't ship). Reach here for a logo.
- **`material/`** — the [Material Icon Theme](https://github.com/material-extensions/vscode-material-icon-theme)
  **file-type icons** (language / framework / tooling glyphs). Reach here for a
  file-kind icon; use lucide for generic UI glyphs.

```tsx
import { GithubMark } from '@zeroxsolutions/icons/brands/github-mark';
import { DeepgramMark } from '@zeroxsolutions/icons/brands/deepgram';
import { TypescriptIcon } from '@zeroxsolutions/icons/material/typescript';
import { BunIcon } from '@zeroxsolutions/icons/material/bun';

<GithubMark className="size-5" />;      {/* currentColor mark, sized via className */}
<DeepgramMark size="1.25rem" />;        {/* full-color mark, sized via size prop */}
<TypescriptIcon size="1.5rem" />;       {/* full-color file icon */}
<BunIcon.Light size="1.5rem" />;        {/* light-background variant */}
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
  color-mark API (`size="1em"`), except `GithubMark`, which paints with
  `currentColor` and takes standard SVG props (size it with `className`).

```tsx
import { BunIcon } from '@zeroxsolutions/icons/material/bun';

<BunIcon size={24} />;        // default artwork
<BunIcon.Light size={24} />;  // light-background artwork (present on light-pair icons only)
```

## Categories

### `brands/`

Each mark is `@zeroxsolutions/icons/brands/<name>`.

| Subpath              | Export         | Source                                        |
| -------------------- | -------------- | --------------------------------------------- |
| `brands/github-mark` | `GithubMark`   | hand-inlined SVG                              |
| `brands/deepgram`    | `DeepgramMark` | [Simple Icons](https://simpleicons.org) (CC0) |
| `brands/pipecat`     | `PipecatMark`  | [Simple Icons](https://simpleicons.org) (CC0) |
| `brands/inworld`     | `InworldMark`  | Inworld's own SVG                             |
| `brands/leonardo`    | `LeonardoMark` | seeklogo (full-color)                         |

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

The `brands/` marks are the trademarks of their respective owners, included for
identification/attribution only — not affiliation or endorsement. Their SVG paths
are sourced from Simple Icons (CC0), vendor-supplied artwork, or hand-inlined;
follow each owner's brand guidelines when you use them.

## Development

```sh
nx build @zeroxsolutions/icons      # build to dist/ (nested category subpaths)
nx typecheck @zeroxsolutions/icons  # type-check the source
nx test @zeroxsolutions/icons       # unit + render smoke tests via Vitest
```
