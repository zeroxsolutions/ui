## Scope

Full Phase-1 delivery of `@zeroxsolutions/editor` — the `document` surface (L1–L3): package scaffold, core façade/builder/backend, declarative feature API + compiler, per-node serialization (export + import), theming, both Viewers, the L1–L3 feature blocks, editor chrome, and Migrate. The `code` surface and Yjs collaboration are out of scope (interfaces only).

## Covers

- Task groups `1`–`11` in `tasks.md`.
- Validation Focus: engine-free `.d.ts`, single engine instance, delta size, serialization fidelity, reported import, SSR-safe Viewer, theme sync.

## Plan Type

full

High-risk, cross-module, and validation-intensive: a new SemVer-stable public contract other packages will depend on, an engine-hiding invariant, and fidelity/performance guarantees.

## Execution Strategy

tdd-preferred

## Ordered Steps

1. **Scaffold + guardrail (red first).** Generate the package (nx generator, `--dry-run` then real), wire deps/exports/skeleton, and add a failing check that public `.d.ts` (excluding `advanced`) contain no engine types. — `1.1`–`1.5`
2. **Freeze the public contract.** Author `document/core/types/*` (`IEditor`, `EditorFeature`, `NodeSpec`/`MarkSpec`, `NodeViewProps`, `NodeCodec`, command descriptor, `IDocumentBackend`). Treat this as the interface-freeze gate before any parallel work. — `2.1`
3. **Core runtime.** Façade + builder + command layer (Zod arg validation) + `PmStepsBackend` (delta + snapshot). — `2.2`–`2.5`
4. **Feature API + compiler.** `defineFeature`, feature compiler, `NodeViewProps` adapter, registry + `dependsOn`, the isolated `advanced` escape, boundary-only validation. — `3.1`–`3.6`
5. **Serialization registry.** Export walker + fallback; Markdown/HTML/React codecs; Markdown token import + HTML DOM import; Zod-gated `ImportResult`; open format registration. — `4.1`–`4.7`
6. **Theming.** `IEditorTheme`, default theme on house tokens, `EditorThemeProvider` light/dark sync, extend/replace. — `5.1`–`5.4`
7. **Viewers.** Static SSR-safe `<Viewer/>` (no engine in module graph) and read-only `<ViewerLive/>`; shared registry; independent theme. — `6.1`–`6.3`
8. **Feature blocks (parallel).** Each L1–L3 block as a self-contained `defineFeature` + codec + view + spec; heavy blocks lazy and behind the `CodeMirrorPane` seam. — `7.1`–`7.9`
9. **Chrome.** Slash, bubble, floating "+", drag-handle block menu, toolbar — all from `@zeroxsolutions/ui`. — `8.1`–`8.4`
10. **Migrate.** `IMigrator` + source adapters surfacing the reported result. — `9.1`–`9.2`
11. **Stories/e2e/docs, then full validation.** — `10.1`–`10.3`, `11.1`–`11.7`

## Validation Per Step

1. Generator dry-run file list reviewed; `nx build` green; the `.d.ts` engine-type check exists and initially fails.
2. Types compile; a review of the frozen interfaces confirms no engine type is exposed (except `advanced`).
3. Unit: valid command mutates + emits delta; invalid args reject without mutation; a localized edit on a large doc emits a step-sized delta; on-demand snapshot reconstructs exactly.
4. Unit: a declarative feature compiles without engine imports; attribute type derives from its Zod schema; missing dependency errors; `advanced` is the only engine-exposing path.
5. Unit: new-block export via its codec with no core edit; missing-codec fallback; JSON↔JSON lossless; JSON→HTML→JSON near-lossless; custom block reconstructs via Markdown token import; import returns `{ doc, warnings[], dropped[] }`.
6. Unit/story: default theme renders with no config; dark toggle switches prose + code + Mermaid + math together.
7. Test: static Viewer renders JSON server-side with no engine instance; both Viewers render a block consistently.
8. Per-feature spec + Storybook story; minimal-editor bundle does not pull lazy heavy deps.
9. Interaction test: slash inserts, input rule creates, drag-handle menu operates.
10. Test: unmappable source content is reported, not silently dropped.
11. `pnpm nx run-many -t lint build test` green; all Validation Focus assertions pass; rule-audit clean.

## Files / Owners

- `packages/editor/package.json`, `packages/editor/vite.config.ts` — scaffold/build/exports
- `packages/editor/src/document/core/**` — interfaces, façade, builder, compiler, backend
- `packages/editor/src/document/serialize/**` — codec registry, export/import
- `packages/editor/src/document/features/**` — L1–L3 blocks
- `packages/editor/src/document/ui/**`, `src/document/react/**` — chrome + `<Editor/>`/`<Viewer/>`
- `packages/editor/src/shared/{code-mirror,theme}/**` — CodeMirror seam, theme
- `packages/editor/src/migrate/**` — migrator + sources
- `apps/storybook/**` — stories

## Completion Checkpoint

All `tasks.md` items checked; `lint build test` green workspace-wide; every Validation Focus assertion demonstrated; public `.d.ts` engine-free (excluding `advanced`); rule-audit of the staged diff clean.

## Completion Verification

Verification Mode is retained-recommended: retain evidence (test output or a short `verification.md`) for the contract-critical checks — engine-free `.d.ts`, no second engine instance, step-sized delta, round-trip fidelity + custom-block Markdown import, SSR-safe Viewer render, dark-toggle sync — so they can be re-checked before archive.

## Delegation Units

- **Core+API (owner: lead):** steps 2–4 (`core/**`, feature compiler). Must complete the interface-freeze (step 2) before delegating features. Writeback: frozen types + green core tests.
- **Serialization (owner: A):** step 5 (`serialize/**`). Depends on frozen `NodeCodec`.
- **Theming (owner: B):** step 6 (`shared/theme/**`).
- **Viewers (owner: C):** step 7 (`react/viewer*`, `serialize/react-renderer`).
- **Feature blocks (owners: pooled):** step 8, one unit per feature folder.
- Each unit writes back its files + co-located specs; the integration owner re-runs `run-many` and updates `tasks.md`.

## Parallel Units

After step 4 (interface freeze + compiler): steps 5, 6, 7 run concurrently; step 8 features fan out one-per-folder. Serial before that point: steps 1→2→3→4.

## Isolation Boundaries

- Each feature owns only its `features/<name>/` folder + its codec registration; no feature edits `core/` or the serializer walker.
- Serialization, theming, and viewer units own disjoint directories; shared contract changes route back through the Core+API owner, never edited in a leaf unit.
- Validation boundary: each unit's co-located specs must pass independently before integration.

## Worktree Units

- `feat/document-editor` primary worktree owns scaffold + core (steps 1–4).
- Post-freeze units (serialization, theming, viewers, feature batches) may branch to sibling worktrees off the integrated core.

## Isolation Reason

Feature blocks and cross-module units mutate many files in parallel; a shared tree would collide on index/HEAD. The one generator run (step 1) edits shared root config and must be serialized and integrated before parallel worktrees branch (`worktree-per-task`, `gen-via-generator`).

## Integration Owner

The Core+API lead integrates all units: rebases each onto the releasable branch, re-runs `pnpm nx run-many -t lint build test`, reconciles `tasks.md`, and owns the public-contract surface.

## Execution Notes

- Resolved decisions (from `design.md`): exports use the per-file `./*` map (engine hiding is type-level, not the exports map); columns/layout deferred to Phase 2; Markdown dialect = GitHub Alerts (`> [!NOTE]`) for callouts + Notion-flavored tags/HTML fallback for structural blocks. Apply these in steps 1 and 5.
- Remaining open question: which heavy features ship in the `starter` bundle vs opt-in subpaths — decide in step 1 (leaning L1-light default).
