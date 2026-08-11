## Why

`@zeroxsolutions/editor-core` is documented as "headless", but by the meaning that
label carries across the rich-text-editor field - `@tiptap/core`, Lexical, Slate,
ProseMirror all ship **zero** `react`, not even type-only - it is not. The package
leaks React into its shipped source on three surfaces:

1. **Runtime serialization** - `document/serialize/render-to-react.tsx` imports
   `Fragment` and builds JSX; `document/serialize/built-in-codecs.tsx` ships a `<p>`
   JSX in a `toReact` codec; the `'react'` literal sits inside the core `Format`
   union (`document/core/types/codec.ts`).
2. **Node-view contract** - `NodeSpec.render?(props): ReactNode` and
   `NodeViewProps.children?: ReactNode` pin the feature view contract to React.
3. **UI contribution icons** - `icon?: ReactNode` on `SlashItem` / `ToolbarItem` /
   `BlockMenuItem` and on composer command / trigger option types.

Seven files in `src` import from `react` (six type-only `ReactNode`, one runtime).
The README and `AGENTS.md` overclaim "headless / types only / renders no React
itself / ships no React surfaces" - prose that is now false.

This matters because "headless" is a load-bearing promise for a published engine
core: a consumer who reads it expects to be able to take the engine contract
without React in their graph. Today they cannot - the published `.d.ts` carries
`ReactNode`, and feature authors are forced to write React-returning functions
against what is supposed to be the engine-free contract.

## What Changes

`editor-core` becomes genuinely framework-free: **zero** `react` in its source,
its type declarations, and its `package.json` dependencies/peerDependencies -
matching the bar set by `@tiptap/core`. React does not leave the product; it
moves one tier out, into the chrome (the ui registry), which already owns React.
The mechanism is the same opaque-seam already proven for the editing engine:
core declares a slot that returns `unknown`, and the chrome supplies the concrete
React typing and rendering (exactly as `NodeViewRenderer => unknown` lets core
call a `@tiptap/react` node-view without importing it).

Concretely:

- The React serialization walker (`renderToReact`) and the `toReact` codec bodies
  move from core into the chrome; `'react'` leaves the core `Format` union. Core
  exports Markdown, HTML, and JSON; the React tree is produced by the chrome
  Viewer through chrome-owned React codecs.
- `NodeSpec.render` and `NodeViewProps.children` return `unknown` at core; the
  chrome re-exports React-typed aliases.
- The `icon?` slots on UI-contribution and composer/trigger types return
  `unknown` at core; the chrome supplies the `ReactNode` alias.
- The false "headless / types only / renders no React itself" prose in the
  README, `AGENTS.md`, and the root `src/index.ts` doc-comment is replaced with
  the accurate "framework-free core; React supplied by the chrome".
- `react` is removed from `editor-core`'s `package.json` peer/dev dependencies.

## Success Criteria

- `grep -rn "from 'react'" packages/editor-core/src` returns **empty** (zero
  type-only, zero runtime).
- `packages/editor-core/package.json` has no `react` entry in `dependencies`,
  `peerDependencies`, or `devDependencies`.
- `nx build @zeroxsolutions/editor-core` is green and the emitted `dist/**/*.d.ts`
  contain no `ReactNode` references.
- `nx run-many -t lint typecheck build test` is green across the workspace, and
  `nx e2e @zeroxsolutions/docs-ui-e2e` is green - the chrome still renders
  documents end-to-end through its own React codecs and walker.
- The README and `AGENTS.md` no longer claim the core "renders no React" or is
  "types only"; they state the framework-free contract accurately.

## Non-Goals

- **Redesigning the feature authoring model.** A deeper split - moving the
  `render` / `icon` / `toReact` slots off the core types entirely so a feature's
  React surface is declared in a separate chrome-side file keyed by node type -
  is explicitly out of scope. The opaque-`unknown` seam achieves "zero React in
  core" without that authoring-model change.
- **Changing the engine contract.** `IEditor`, the aggregates, the command bus,
  the unit-of-work, the schema, and the Markdown/HTML/JSON codecs are untouched.
- **Touching `math/core` or `mermaid/core`.** They are already framework-free
  (`renderMath` / `renderMathHtml` return KaTeX HTML strings); their React halves
  already live in the chrome.
- **Adding new Vue/Svelte chrome.** Framework-freedom makes a second chrome
  possible; building one is not part of this change.

## Capabilities

### New Capabilities

<!-- None. This change tightens an existing published contract; it introduces no new capability. -->

### Modified Capabilities

- `editor-serialization`: the React tree is no longer a core export. Core
  serializes to Markdown, HTML, and JSON; `'react'` leaves the core `Format`
  union, and the React walker + `toReact` codecs are owned by the chrome.
- `editor-viewer`: the static, server-safe Viewer renders document JSON to a
  React tree through **chrome-owned** React codecs (not core codecs); core
  supplies JSON only.
- `editor-feature-api`: `NodeSpec.render` and `NodeViewProps` (and the
  icon-bearing contribution types) become opaque (`unknown`) at core; the chrome
  supplies the concrete React typing. The core published `.d.ts` carries no
  `ReactNode`.

## Impact

- **Code:** ~7 files in `packages/editor-core/src` lose their `react` import and
  have React-typed slots narrowed to `unknown`; 2 files
  (`render-to-react.tsx`, the `toReact` half of `built-in-codecs.tsx`) move to
  `apps/docs-ui/registry/bases/base-ui/editor/`. Two `.tsx` files with no JSX are
  renamed `.ts`. The single `serialize.spec.tsx` (the only React-exercising
  editor-core spec) moves into `docs-ui`, which already has the vitest target.
- **Consumers:** the only consumers of the moved/changed APIs already live in the
  chrome - `composer/chat-message-view.tsx` (calls `renderToReact`) and
  `composer/triggers/inline-token.tsx` (declares a `toReact` codec) - so this is
  an intra-chrome relocation plus a core removal, not a cross-package migration.
  `document/node-view-adapter.tsx` gains React-typed aliases it re-exports to
  feature authors.
- **Dependencies:** `editor-core` `package.json` loses `react` entirely;
  `@tiptap/react` and `react-dom` were already absent from runtime core and stay
  absent.
- **Docs/specs:** README, `AGENTS.md`, and the root `src/index.ts` doc-comment
  corrected; delta specs against `editor-serialization`, `editor-viewer`, and
  `editor-feature-api`.
