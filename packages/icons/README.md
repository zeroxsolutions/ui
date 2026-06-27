# @zeroxsolutions/icons

Brand and vendor **marks** as inline-SVG React components — the logos
[lucide-react](https://lucide.dev) no longer ships. One mark per subpath, sized
and colored like any icon. Use lucide for every non-brand icon; reach here only
for a logo.

```tsx
import { GithubMark } from '@zeroxsolutions/icons/github-mark';
import { DeepgramMark } from '@zeroxsolutions/icons/deepgram';

<GithubMark className="size-5" />;
<DeepgramMark size="1.25rem" />;
```

## Install

```sh
pnpm add @zeroxsolutions/icons react react-dom
```

`react` / `react-dom` are peer dependencies (React 19).

## Marks

Each mark is its own subpath: `@zeroxsolutions/icons/<name>`. Most are monochrome
(inherit `currentColor`); `LeonardoMark` keeps its brand gradients.

| Subpath       | Export         | Source                                        |
| ------------- | -------------- | --------------------------------------------- |
| `github-mark` | `GithubMark`   | hand-inlined SVG                              |
| `deepgram`    | `DeepgramMark` | [Simple Icons](https://simpleicons.org) (CC0) |
| `pipecat`     | `PipecatMark`  | [Simple Icons](https://simpleicons.org) (CC0) |
| `inworld`     | `InworldMark`  | Inworld's own SVG                             |
| `leonardo`    | `LeonardoMark` | seeklogo (full-color)                         |

`GithubMark` takes standard SVG props (`React.ComponentProps<'svg'>`) — size it
with `className` (e.g. `size-5`), like a lucide icon. The vendor marks under
`brand-marks/` follow the [`@lobehub/icons`](https://github.com/lobehub/lobe-icons)
API instead — a single `size` prop (`size="1em"` by default), scaled by the
consumer's wrapper — so they drop straight into a provider→mark registry.

## Trademarks

These marks are the trademarks of their respective owners and are included for
identification/attribution only — their inclusion here is not affiliation or
endorsement. The SVG paths are sourced from Simple Icons (CC0), vendor-supplied
artwork, or hand-inlined; follow each owner's brand guidelines when you use them.

## Development

```sh
nx build @zeroxsolutions/icons    # build to dist/ (flat subpaths)
nx test @zeroxsolutions/icons     # unit tests via Vitest
```
