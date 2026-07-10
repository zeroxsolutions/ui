## Readiness Decision

ready with conditions

The scope, specs, and architecture are coherent and implementable for Phase 1 (`document` surface, L1–L3). The prior Open Questions are now resolved in `design.md` (per-file `./*` exports; columns deferred to Phase 2; Markdown dialect = GitHub Alerts + Notion-flavored/HTML fallback). One minor open question remains — which heavy features ship in the `starter` bundle vs opt-in subpaths — decided during scaffolding; not a blocker.

## Execution Mode

tdd-preferred

The workspace co-locates `*.spec.tsx` with every component and gates commits on `lint build test` (`green-before-commit`). Codecs, the feature compiler, attribute validation, and import mapping are naturally test-first; interactive views are covered by component + Storybook.

## Verification Mode

retained-recommended

Retain evidence for the contract-critical success criteria (engine-free `.d.ts`, no duplicate engine instance, delta size, round-trip fidelity, SSR-safe Viewer) so they can be re-checked before archive.

## Delegation Mode

subagent-eligible

The package decomposes into weakly-coupled slices (core/façade, feature-api, per-node codecs, viewers, theming, per-feature blocks) that can be delegated once the core interfaces are frozen.

## Parallelization Mode

parallel-eligible

After the core interfaces and the feature compiler exist, individual features (each a self-contained `defineFeature`) and their codecs parallelize cleanly.

## Worktree Mode

worktree-eligible

Feature work runs on a `feat/document-editor` worktree per `worktree-per-task`. The one nx generator run that scaffolds the package (and touches shared root config) must be serialized — run it first, integrate, then parallelize feature work.

## Blocked By

none

## Validation Focus

- **Engine hiding:** emitted `dist/**/*.d.ts` (excluding `advanced`) contain no `@tiptap/*` / `prosemirror-*` types.
- **Single engine instance:** registering an external declarative feature adds no second ProseMirror/document-model instance.
- **Delta size:** one localized edit in a large document emits a step-sized delta, not a full snapshot.
- **Serialization fidelity:** JSON↔JSON lossless; JSON→HTML→JSON near-lossless; Markdown import reconstructs a custom block via the token path.
- **Reported import:** import returns `{ doc, warnings[], dropped[] }` and never admits unvalidated attributes.
- **SSR-safe Viewer:** the static Viewer renders JSON without instantiating the engine and imports server-side.
- **Theme sync:** toggling dark switches prose, code, Mermaid, and math together.

## Key Risks

- **Framework-not-wrapper cost:** owning `defineFeature` + compiler + façade + a primitive layer rich enough to avoid pushing users to `advanced`. Largest effort centre; front-load the interface design.
- **Leaky schema abstraction:** `content`/DOM-parse cannot be fully hidden; keep the controlled vocabulary small and route the tail to `advanced` deliberately.
- **Markdown lossiness:** engine-only blocks have no standard Markdown; decide dialect vs HTML-fallback before writing those codecs.
- **Stable-contract lock-in:** the public interfaces are hard to change once external features depend on them; design and review them before broad feature work.
- **Bundle weight:** Mermaid/KaTeX/Shiki/tables must stay lazy and code-split; verify a minimal editor's bundle does not pull them.

## Findings Summary

No external review findings yet. The Open Questions in `design.md` are carried forward as scaffolding-time decisions, not blockers.
