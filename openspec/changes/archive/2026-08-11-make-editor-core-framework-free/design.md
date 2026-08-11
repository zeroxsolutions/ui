## Context

`@zeroxsolutions/editor-core` is the published, engine-free rich-text core. The
prior change (`restructure-ui-to-registry-source`) already established the seam
this change extends: core declares a slot typed `unknown`, and the chrome supplies
the concrete `@tiptap/react` implementation. That seam is `NodeViewRenderer` -
`createDocumentEditor` takes a `nodeViewRenderer?: (spec, { as }) => unknown`, and
the chrome's `document/node-view-adapter.tsx` injects one built from
`ReactNodeViewRenderer`. Core therefore already imports no `@tiptap/react`.

The seam was applied to the **engine binding** only. React still reaches core
through three other surfaces (audited with `file:line` evidence in the proposal):

1. Runtime serialization - `render-to-react.tsx`, `built-in-codecs.tsx:33`
   (`toReact` JSX), and `'react'` in the `Format` union.
2. The node-view contract - `NodeSpec.render?: ... => ReactNode`,
   `NodeViewProps.children?: ReactNode`.
3. UI contribution icons - `icon?: ReactNode` on six contribution/command types.

Seven `src` files import from `react` (six `import type { ReactNode }`, one
runtime `Fragment`). The README and `AGENTS.md` claim the core "renders no React"
and is "types only" - false today.

**Confirmed facts grounding the design (no external API depends on a version):**

- `import type { ReactNode }` is erased entirely by the TS compiler / esbuild -
it carries no runtime cost, but it **does** surface in the emitted `.d.ts`, so the
framework-free bar is the published declaration file, not just the runtime graph.
- The two consumers of the React serialization surface already live in the chrome:
`composer/chat-message-view.tsx:42` (calls `renderToReact`) and
`composer/triggers/inline-token.tsx:123` (declares a `toReact` codec). The
`document/node-view-adapter.tsx` already reads `spec.render` and already imports
`ReactNode` from `react` on the chrome side. So this is an **intra-chrome
relocation plus a core removal**, not a cross-package migration.
- `editor-core` has **no out-of-repo consumers** (not yet published; only `dist/`
and the registry import it). The change is therefore non-breaking externally.

## Goals / Non-Goals

**Goals:**

- `editor-core` ships zero `react`: no runtime import, no type-only import, no
  `package.json` dependency/peerDependency, and no `ReactNode` in the emitted
  `.d.ts`.
- React serialization (walker + `toReact` codecs) and React typing for the opaque
  contract slots are owned by the chrome, reusing the existing injection seam.
- Docs and specs stop overclaiming "headless / types only / renders no React".

**Non-Goals:**

- Redesigning the feature authoring model (ES2 - moving `render`/`icon`/`toReact`
  off the core types entirely into chrome-side declarations). The opaque-`unknown`
  seam meets the bar without it.
- Changing the engine contract, aggregates, command bus, schema, or the
  Markdown/HTML/JSON codecs.
- Touching `math/core` or `mermaid/core` (already framework-free) or building a
  second (Vue/Svelte) chrome.

## Decisions

### D1 - End-state ES1: opaque `unknown` at core, chrome re-types

Core contract slots that currently name `ReactNode` become `unknown`; the chrome
re-exports React-typed aliases and performs the concrete rendering. This is the
minimal change that achieves "zero React in core" and is the **direct extension**
of the proven `NodeViewRenderer => unknown` seam: same principle (core declares an
opaque slot; chrome injects the concrete), applied to the view return, the content
slot, the icons, and the React serialization format.

Rejected: ES2 (split the slots off the core types into chrome-side feature
declarations keyed by node type). It is a larger authoring-model redesign, not
required to meet "framework-free", and it would force every feature into a
two-file authoring shape. Deferred.

### D2 - React serialization relocates intra-chrome; `'react'` leaves the core `Format` union

`render-to-react.tsx` (the walker) and the `toReact` bodies in
`built-in-codecs.tsx` move to `apps/docs-ui/registry/bases/base-ui/editor/document/serialize/`.
The `'react'` literal is removed from the core `Format` union
(`document/core/types/codec.ts`). The string walker `serialize-to-string.ts` only
ever maps `markdown`/`html` (`NODE_METHOD`/`MARK_METHOD`), so it is unaffected;
`'react'` was consumed only by the moving walker's `ctx.format` and by the
`fallback?: Partial<Record<Format, ...>>` map, which loses the `'react'` key
harmlessly (React fallback becomes a chrome concern).

### D3 - The chrome owns one typed-alias barrel for feature authors

To preserve author ergonomics, the chrome exports React-typed aliases for the
slots core now declares opaque - e.g. `type IconLike = ReactNode`, and a
React-typed node-view contract alias. Feature authors import these from the
chrome, not `react` via core. (Exact barrel location decided at implementation;
one barrel is preferred over scattering.)

### D4 - Icon opacity is folded into the framework-free contract, not split per-capability

The six `icon?: ReactNode` sites (`ui-contribution.ts`, `composer-types.ts`,
`trigger-token.ts`) become `icon?: unknown` together, surfaced by the single new
`Framework-Free Published Contract` requirement in `editor-feature-api`. They do
not each get their own capability delta; the guarantee is cross-cutting.

### D5 - The verification bar is the emitted `.d.ts`, not just the source grep

Because `import type` is erased at runtime, a source-only grep of `from 'react'`
is necessary but not sufficient. The gate also greets `dist/**/*.d.ts` for
`ReactNode` and confirms `package.json` carries no `react`. A change that passes
the source grep but leaks a `ReactNode` through a re-exported type fails the bar.

## Risks / Trade-offs

- **Author ergonomics**: opaque `unknown` forces the chrome to cast/re-type.
  Mitigation: D3's typed-alias barrel (`react-types.ts`) keeps feature authoring
  ergonomic; the casts land at the registration boundaries
  (`as NodeCodec`/`as MarkCodec`), the render read in `node-view-adapter`, and the
  icon read sites (`option.icon as ReactNode` across the menus).
- **Moved test**: `serialize.spec.tsx` is the only editor-core spec exercising
  React (`react-dom/server` + `renderToReact`). It must land in `docs-ui` and stay
  asserting the React output, observed red-then-green per `test-proves-by-failing`.
  Risk: dropping it silently during the move. Mitigation: move, then run, then
  deliberately break the walker to confirm the test fails for its own reason.
- **Stray `ReactNode` in a re-exported type**: a type barrel could re-export a
  symbol whose declaration still mentions `ReactNode`, leaking it into `.d.ts`
  even after the direct imports are gone. Mitigation: D5's `.d.ts` grep catches
  it; the type barrel is audited at implementation.
- **`Format` union narrowing**: any non-core code branching on
  `format === 'react'` would break. Verified: the only such branch is the moving
  walker. Low risk.

## State Model

The meaningful state is the **contract's framework coupling**, before and after:

- **Before**: core's public contract names `ReactNode` on three surfaces
  (serialization runtime + `'react'` format; node-view return + content slot; six
  icon slots). `react` is a peerDependency. The published `.d.ts` carries
  `ReactNode`.
- **After**: every React-bearing slot is `unknown` at core; `react` is gone from
  `package.json`; the published `.d.ts` carries no React type. The coupling moves
  one tier out, into the chrome, behind the same opaque-seam the engine binding
  already uses.

There is no runtime state machine in this change; it is a compile-time contract
tightening plus an intra-chrome file relocation.

## Migration Plan

`editor-core` is unpublished with zero out-of-repo consumers, so there is no
external migration. The rollout is atomic within the change:

1. Core contract types narrowed to `unknown`; runtime serialization files move to
   chrome; `'react'` leaves `Format`; `react` leaves `package.json`.
2. Chrome re-exports typed aliases and consumes its own React walker/codecs.
3. The React-exercising spec moves to `docs-ui` and stays green.
4. Gate green, specs synced, prose corrected.

No fallback is needed; if the chrome relocation reveals a missed consumer, it is
fixed in the same change. **Writeback (post-implementation):** the blast radius
was larger than the two-file estimate above - ~15 chrome files landed in the end
(6 icon-read casts across 5 menus, 5 feature-codec re-typings to
`ReactNodeCodec`/`ReactMarkCodec`, `node-view-adapter`, `chat-message-view`,
`styles.css`, the relocated spec, the `react-types` barrel). The decision D1
(opaque `unknown` at core, chrome re-types - ES1) still holds unchanged; only the
file count was underestimated.

## Open Questions

- **Typed-alias barrel location**: one barrel vs per-surface aliases (D3).
  Decided: one barrel, `editor/react-types.ts`, exporting `ReactSerializeContext`,
  `ReactNodeCodec`, and `ReactMarkCodec`.
- **Pre-existing stale package name**: `editor-feature-api` line 25 still says a
  third-party feature "depends only on `@zeroxsolutions/editor`" - a leftover from
  the rename to `editor-core`. Out of scope for this change (not introduced here);
  flagged as a follow-up prose fix.
