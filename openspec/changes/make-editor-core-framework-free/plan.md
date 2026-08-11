## Scope

The full change: make `@zeroxsolutions/editor-core` framework-free (zero `react`
in source, types, and `package.json`) by narrowing the React-bearing contract
slots to `unknown`, relocating the React serialization walker + `toReact` codecs
into the chrome, dropping `'react'` from the core `Format` union, correcting the
overclaiming prose, and moving the one React-exercising spec into `docs-ui`.

## Covers

Task IDs: `1.1`-`1.6`, `2.1`-`2.5`, `3.1`-`3.6`, `4.1`-`4.2`, `5.1`-`5.3`,
`6.1`-`6.3`, `7.1`, `8.1`-`8.7`, `9.1`-`9.2`, `10.1`-`10.2`.

Validation Focus items carried forward from `review.md`:
- `VF-source-grep`: `grep -rn "from 'react'" packages/editor-core/src` -> empty.
- `VF-dist-grep`: `grep -rn "ReactNode" packages/editor-core/dist` -> empty.
- `VF-packagejson`: no `react` in core `package.json` deps/peer/dev.
- `VF-moved-spec`: relocated serialize spec observed red-then-green.
- `VF-gate`: `nx run-many -t lint typecheck build test` + `nx e2e` green.
- `VF-purpose`: post-archive manual Purpose fix in two specs.

## Plan Type

full - cross-module (core contract types + chrome re-typing + file relocation +
spec move + prose + dependency drop), with a published-`.d.ts` verification bar.
A lightweight plan would under-state the contract-tightening risk.

## Execution Strategy

tdd-preferred - the behavioral proof is the relocated `serialize` spec, observed
red-then-green. The framework-free guarantee itself is asserted by the gate
greps (source + `dist/**/*.d.ts` + `package.json`), not by a behavioral test.

## Ordered Steps

1. **Baseline** - confirm the starting state: `grep -rn "from 'react'" packages/editor-core/src` shows 7 hits; `nx typecheck @zeroxsolutions/editor-core` green.
2. **Narrow core contract (§1)** - in one pass, change the six `ReactNode`-typed slots to `unknown` and drop their `import type { ReactNode }`: `node-spec.ts` (`render`), `node-view.ts` (`children`), `ui-contribution.ts` (3x `icon`), `composer-types.ts` (3x `icon`), `trigger-token.ts` (`icon`).
3. **Core typecheck after narrowing** - `nx typecheck @zeroxsolutions/editor-core` green (core internally consistent with opaque slots).
4. **Relocate React serialization (§2)** - `git mv render-to-react.tsx` into `apps/docs-ui/registry/bases/base-ui/editor/document/serialize/`; split `built-in-codecs.tsx` (core keeps md/html/import codecs as `.ts`, `toReact` bodies move to chrome); remove `'react'` from `Format`; drop the `renderToReact` re-export from the serialize barrel.
5. **Source-grep proof** - `grep -rn "from 'react'" packages/editor-core/src` empty; `grep -rn "'react'" packages/editor-core/src` shows no Format literal.
6. **Chrome adapts (§3)** - re-type `node-view-adapter.tsx` against opaque core (local `ReactNodeViewProps` alias + cast `spec.render`); add the typed-alias barrel (`IconLike = ReactNode` + node-view aliases); fix `chat-message-view.tsx` import to the relocated walker; move `inline-token.tsx`'s `toReact` to a chrome React-codec shape; fix the `styles.css` comment.
7. **Chrome typecheck** - `nx typecheck @zeroxsolutions/docs-ui` green (chrome compiles against narrowed core + own React types).
8. **Drop `react` from core deps (§4)** - remove `react` from `editor-core` `peerDependencies`/`devDependencies`; `nx build @zeroxsolutions/editor-core` green; `grep -rn "ReactNode" packages/editor-core/dist` empty.
9. **Relocate the spec (§5)** - `git mv serialize.spec.tsx` into `docs-ui` editor chrome test tree; fix imports to relocated walker + chrome registry.
10. **Spec red-then-green** - break the chrome walker on purpose, run `nx test @zeroxsolutions/docs-ui`, confirm the React-output assertion fails for its own reason; restore; confirm green.
11. **Prose correction (§6)** - README, `AGENTS.md`, `src/index.ts` doc-comment: replace the "headless / types only / renders no React itself" overclaims with the accurate framework-free statement; drop the `react` peer note.
12. **Cosmetic rename (§7)** - confirm `create-document-editor.tsx` and `compile-features.tsx` have no JSX, rename to `.ts`, fix relative import specifiers.
13. **Full gate (§8)** - `nx run-many -t lint typecheck build test` green; `nx e2e @zeroxsolutions/docs-ui-e2e` green; `openspec validate make-editor-core-framework-free --strict` passes.
14. **Rule-audit + commit (§10)** - two-direction rule-audit of the staged diff; commit only when the user asks, conventional `refactor!:` with `BREAKING CHANGE:` footer.

## Validation Per Step

1. Baseline grep = 7 hits; typecheck green (records the before-state).
2. Six files edited; no `import type { ReactNode }` remains in them.
3. `nx typecheck @zeroxsolutions/editor-core` green.
4. Files relocated (history preserved via `git mv`); `Format` has no `'react'`; serialize barrel has no `renderToReact`.
5. `grep -rn "from 'react'" packages/editor-core/src` = empty (`VF-source-grep`).
6. Chrome compiles; `chat-message-view` resolves `renderToReact`; `inline-token` declares React rendering via chrome codec shape.
7. `nx typecheck @zeroxsolutions/docs-ui` green.
8. `editor-core` `package.json` has no `react` (`VF-packagejson`); `grep -rn "ReactNode" packages/editor-core/dist` empty (`VF-dist-grep`).
9. Spec relocated; imports resolve.
10. Test observed red for its own reason, then green (`VF-moved-spec`, `test-proves-by-failing`).
11. README/AGENTS.md/index.ts carry no "renders no React" / "types only" claim.
12. Two `.tsx` -> `.ts`; no broken import specifiers.
13. Gate + e2e + strict validate green (`VF-gate`).
14. Rule-audit recorded (both directions); commit message well-formed.

## Files / Owners

Core (narrowed):
- `packages/editor-core/src/document/core/types/node-spec.ts`
- `packages/editor-core/src/document/core/types/node-view.ts`
- `packages/editor-core/src/document/core/types/ui-contribution.ts`
- `packages/editor-core/src/document/core/types/codec.ts` (`Format` union)
- `packages/editor-core/src/composer/composer-types.ts`
- `packages/editor-core/src/composer/triggers/trigger-token.ts`
- `packages/editor-core/src/document/serialize/index.ts` (drop `renderToReact`)
- `packages/editor-core/src/document/serialize/built-in-codecs.ts` (-> `.ts`, md/html only)
- `packages/editor-core/package.json` (drop `react`)
- `packages/editor-core/README.md`, `src/index.ts` (prose)

Core deleted (relocated):
- `packages/editor-core/src/document/serialize/render-to-react.tsx` (-> chrome)
- `packages/editor-core/src/document/serialize/serialize.spec.tsx` (-> docs-ui)

Core renamed:
- `packages/editor-core/src/document/core/create-document-editor.tsx` -> `.ts`
- `packages/editor-core/src/document/core/feature-compiler/compile-features.tsx` -> `.ts`

Chrome (adapts):
- `apps/docs-ui/registry/bases/base-ui/editor/document/serialize/render-to-react.tsx` (new - relocated)
- `apps/docs-ui/registry/bases/base-ui/editor/document/serialize/*` (chrome React codec for built-ins)
- `apps/docs-ui/registry/bases/base-ui/editor/document/node-view-adapter.tsx` (re-type + cast)
- `apps/docs-ui/registry/bases/base-ui/editor/composer/chat-message-view.tsx` (import path)
- `apps/docs-ui/registry/bases/base-ui/editor/composer/triggers/inline-token.tsx` (chrome codec shape)
- `apps/docs-ui/registry/bases/base-ui/editor/composer/styles.css` (comment)
- chrome typed-alias barrel (new)
- relocated serialize spec (new under docs-ui)

Repo-level:
- `AGENTS.md` (prose)
- `openspec/specs/editor-serialization/spec.md`, `openspec/specs/editor-viewer/spec.md` (post-archive Purpose)

Owner: single implementer (serial; subagent-eligible with a lean brief pointing at this change's artifacts).

## Completion Checkpoint

Implementation is complete when ALL of these hold:
- `grep -rn "from 'react'" packages/editor-core/src` is empty.
- `grep -rn "ReactNode" packages/editor-core/dist` is empty after build.
- `packages/editor-core/package.json` has no `react` in dependencies, peerDependencies, or devDependencies.
- `nx run-many -t lint typecheck build test` is green and `nx e2e @zeroxsolutions/docs-ui-e2e` is green.
- The relocated serialize spec has been observed red-then-green.
- README, AGENTS.md, and `src/index.ts` no longer overclaim "headless / types only / renders no React".
- `openspec validate make-editor-core-framework-free --strict` passes.

## Completion Verification

Retained evidence required before the work is presented as complete (Verification
Mode = retained-required):

- The relocated `serialize` spec is retained in `docs-ui` and green - it is the
  proof the chrome React rendering path still works after relocation. Record in
  the verification companion: the spec file path, the red-then-green observation,
  and the gate output.
- The three gate greps (source, `dist/**/*.d.ts`, `package.json`) recorded with
  their actual (empty / absent) output - not asserted from memory.
- The `nx run-many` and `nx e2e` output recorded.
- Post-archive: the two Purpose paragraphs corrected, with the before/after
  recorded (archive does not sync free-text Purpose).

## Review Follow-Up

- The user's review of proposal + specs + design may adjust D1's depth (ES1 vs
  ES2). If the reviewer prefers ES2 for the icon surface (keeping `icon?:
  ReactNode` to avoid author friction), step 2 drops the three `icon` sites and
  step 3 drops the `IconLike` alias; the framework-free bar then applies to the
  node-view + serialization surfaces only, and the `editor-feature-api` delta's
  icon clause is softened. Record the decision here before step 2.

## Execution Notes

- (apply-time writeback appends here without overwriting Manual Adjustments.)

## Manual Adjustments

- The post-archive Purpose fix (steps 9.1/9.2 in tasks) is a manual step the
  `openspec archive` sync will not perform; it must be done by the implementer
  immediately after archive, with the before/after recorded.
- `editor-feature-api` line 25's stale `@zeroxsolutions/editor` package name is a
  pre-existing prose issue, not introduced by this change; left as a flagged
  follow-up.
