## Scope

The full change: add a crash-safe collapse affordance to the in-document Mermaid block node view. Single file, single node view.

## Covers

`1.1`, `1.2`, `1.3`, `1.4`, `2.1`, `2.2`, `3.1`, `3.2`, `3.3`, `3.4`, plus Validation Focus: crash-safe collapse over the SVG, header-height consistency, read-only path untouched, codec unchanged.

## Plan Type

lightweight

## Execution Strategy

standard

The implementation already exists and is browser-verified; this plan documents the executed steps and the retained verification, and drives the apply/gate catch-up.

## Ordered Steps

1. Import `DisclosureContent` + `DisclosureTrigger`; add the chevron to `DisclosureActions` after copy; set copy to `size="icon-sm"`.
2. Wrap the body (`Separator` + both `TabsContent`) in `DisclosureContent keepMounted`; replace the stale "never collapses" comment with the load-bearing `keepMounted` rationale.
3. Build + test the editor; clear the storybook Vite cache and rebuild; run the browser interaction stress test and measure header heights.

## Validation Per Step

1. TypeScript build compiles; the chevron renders in the actions group.
2. Collapsing while the diagram shows does not throw; the body folds to header-only and the divider folds with it.
3. `build test` green; browser test reports zero page errors across repeated collapse/expand + tab switches; measured heights 36 / 32 / 32.

## Files / Owners

- `packages/editor/src/document/features/mermaid/mermaid.tsx`
- `openspec/specs/mermaid-document-block/spec.md` (synced at archive)

## Completion Checkpoint

The block collapses and expands from its header with the diagram render never unmounted (no `removeChild`), header controls read consistently with the code block, the read-only viewer and the codec are unchanged, and `build test` for `@zeroxsolutions/editor` is green.

## Completion Verification

Retained-required: a real-browser interaction test over `storybook-static` (story `document-editor-mermaid-editor--in-document-block`) that collapses/expands the block repeatedly while the diagram is showing and across view/edit switches, asserting zero page errors and a still-rendered diagram, plus a bounding-box measurement of the three header controls (tabs 36, copy 32, chevron 32). Evidence captured this session: 10 stress steps, 0 page errors; expanded + collapsed screenshots.

## Execution Notes

Implementation and verification completed this session ahead of governance. Storybook Vite cache was cleared before the measuring rebuild to avoid a stale-`dist` false reading.
