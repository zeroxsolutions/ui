# Implementation Tasks

Source of truth for `make-editor-core-framework-free`. Dependency-ordered: core
contract narrows first, React serialization relocates, the chrome adapts against
the narrowed contract, then the dependency is dropped and the gate runs. Each
task carries its own verification.

## 1. Narrow core contract types to opaque (`unknown`)

- [x] 1.1 `document/core/types/node-spec.ts`: change `NodeSpec.render?(props: NodeViewProps<A>): ReactNode` to return `unknown`; drop `import type { ReactNode }`; keep the doc-comment accurate (the slot is opaque, chrome types it).
- [x] 1.2 `document/core/types/node-view.ts`: change `NodeViewProps.children?: ReactNode` to `unknown`; drop the `react` import.
- [x] 1.3 `document/core/types/ui-contribution.ts`: change the three `icon?: ReactNode` slots (`SlashItem`, `ToolbarItem`/`BubbleItem`, `BlockMenuItem`) to `icon?: unknown`; drop the `react` import.
- [x] 1.4 `composer/composer-types.ts`: change the `icon?: ReactNode` slots to `icon?: unknown`; drop the `react` import.
- [x] 1.5 `composer/triggers/trigger-token.ts`: change `icon?: ReactNode` to `icon?: unknown`; drop the `react` import.
- [x] 1.6 Verify: `nx typecheck @zeroxsolutions/editor-core` is green (core is internally consistent with opaque slots). `grep -rn "from 'react'" packages/editor-core/src` returns empty once §2 lands.

## 2. Relocate React serialization from core to chrome

- [x] 2.1 Move `packages/editor-core/src/document/serialize/render-to-react.tsx` to `apps/docs-ui/registry/bases/base-ui/editor/document/serialize/render-to-react.tsx` (history preserved with `git mv`).
- [x] 2.2 Keep the `toMarkdown`/`toHTML`/`fromMarkdown`/`fromHTML` codec bodies in core (`built-in-codecs.ts`, no JSX remains); the `toReact` bodies (paragraph `<p>`, doc `renderChildren`) live in the relocated chrome walker (`BUILTIN_NODE_REACT`).
- [x] 2.3 Remove `'react'` from the `Format` union in `document/core/types/codec.ts` (now `markdown` | `html` | `(string & {})`).
- [x] 2.4 Drop the `renderToReact` re-export from `document/serialize/index.ts`; no React-bearing symbol remains in the barrel.
- [x] 2.5 Verify: `grep -rn "from 'react'" packages/editor-core/src` returns **empty**.

## 3. Adapt the chrome to the narrowed contract

- [x] 3.1 `document/node-view-adapter.tsx`: reads `spec.render?.(props) as ReactNode` at the call site; keeps `import type { ReactNode } from 'react'` here (chrome owns React).
- [x] 3.2 Chrome typed-alias barrel `editor/react-types.ts` exporting `ReactSerializeContext`, `ReactNodeCodec`, `ReactMarkCodec` (the chrome codec shapes feature authors write `toReact` against).
- [x] 3.3 `composer/chat-message-view.tsx`: import of `renderToReact` split to the relocated chrome path; `renderToReact(message.doc, registry)` resolves against the core-owned codec registry (opaque `toReact` slot).
- [x] 3.4 Feature codecs that call `ctx.renderChildren` (standard, table, callout, toggle, link) retyped to `ReactNodeCodec`/`ReactMarkCodec` and registered with an `as NodeCodec`/`as MarkCodec` cast; atom codecs (code-block, embed, math, image, mention, mermaid, inline-token) compile unchanged (JSX return fits `unknown`).
- [x] 3.5 The `styles.css` comment that referenced the `toReact` codec reflects chrome ownership.
- [x] 3.6 Verify: `nx build @zeroxsolutions/docs-ui` is green (chrome compiles against the narrowed core + its own React types).

## 4. Drop `react` from `editor-core` dependencies

- [x] 4.1 `packages/editor-core/package.json`: `react` removed from `peerDependencies` (field dropped entirely) and `react`/`react-dom` from `devDependencies`. `@tiptap/*`, `zod`/`remark`/`katex`/`mermaid` left as-is.
- [x] 4.2 Verify: `nx build @zeroxsolutions/editor-core` is green; `grep -rn "ReactNode" packages/editor-core/dist` is empty.

## 5. Relocate the React-exercising spec

- [x] 5.1 Move `packages/editor-core/src/document/serialize/serialize.spec.tsx` into `apps/docs-ui/registry/bases/base-ui/editor/document/serialize/serialize.spec.tsx` (history preserved with `git mv`).
- [x] 5.2 Imports in the moved spec repointed to the relocated walker + core codec registry.
- [x] 5.3 Observed the test fail for its own reason: broke both codec dispatches in the chrome walker, ran `nx test @zeroxsolutions/docs-ui`, confirmed the React-output assertion failed (`Expected "<strong>world</strong>" / Received "<span data-mark="bold">..."`), then restored (per `test-proves-by-failing`).

## 6. Prose correction

- [x] 6.1 `packages/editor-core/README.md`: the false "Peer: `react` (types only)" note replaced with the framework-free contract; the lead "headless core" reframed as "framework-free core: zero `react`".
- [x] 6.2 `AGENTS.md` (the real file behind the `CLAUDE.md` symlink): the `editor-core` bullet reframed to "framework-free" (zero `react` - no runtime, types, or peer dep).
- [x] 6.3 `packages/editor-core/src/index.ts`: doc-comment states the framework-free contract precisely (zero `react` in source, types, and deps). Comment mentions of chrome alias names (`ReactNodeViewRenderer`/`ReactNodeSpec`/`ReactNodeCodec`) removed from the published `.d.ts` so `grep ReactNode dist` is empty.

## 7. Cosmetic `.tsx` -> `.ts` (no JSX)

- [x] 7.1 `document/core/create-document-editor.tsx` and `document/core/feature-compiler/compile-features.tsx` confirmed JSX-free and renamed to `.ts` (importers use `.js` specifiers, which resolve to `.ts`/`.tsx` interchangeably - no import edits needed).

## 8. Validation

- [x] 8.1 `grep -rn "from 'react'" packages/editor-core/src` -> empty.
- [x] 8.2 `grep -rn "@tiptap/react\|react-dom" packages/editor-core/src` -> comment/doc matches only (no imports) - unchanged from today.
- [x] 8.3 `grep -rn "ReactNode" packages/editor-core/dist` -> empty (after build).
- [x] 8.4 `packages/editor-core/package.json` -> no `react` in dependencies / peerDependencies / devDependencies (peerDependencies field absent).
- [x] 8.5 `nx run-many -t lint typecheck build test` green across the workspace.
- [x] 8.6 `nx e2e @zeroxsolutions/docs-ui-e2e` green (chrome still renders documents end-to-end via its own React walker + codecs).
- [x] 8.7 `openspec validate make-editor-core-framework-free --strict` passes.

## 9. Post-archive prose (after `openspec archive`)

- [ ] 9.1 Manually correct the Purpose paragraph of `openspec/specs/editor-serialization/spec.md` to drop "React" from "export to Markdown/HTML/React" (archive syncs requirement bodies, not free-text Purpose).
- [ ] 9.2 Manually correct the Purpose paragraph of `openspec/specs/editor-viewer/spec.md` to state React codecs are chrome-owned and core supplies JSON only.

## 10. Commit gate

- [ ] 10.1 Rule-audit the staged diff against `.agents/rules/*` (two directions: obey the rules; and per check added/leaned-on, name what becomes reachable if it is deleted).
- [ ] 10.2 Commit only when the user asks; conventional form (e.g. `refactor(editor-core)!: make core framework-free - move react to chrome`), with a `BREAKING CHANGE:` footer noting the published `.d.ts` no longer names `ReactNode` and `react` is removed from peerDependencies.
