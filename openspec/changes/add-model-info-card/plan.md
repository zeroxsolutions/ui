## Scope

Implement the `model-info-card` compound in `@zeroxsolutions/ui`: `ModelInfoCard`
+ `ModelInfoCardSection` in one file, with a co-located vitest spec and a
Storybook story wiring it into the shipped `HoverCard` over a `ModelListItem`.
Domain-free; detail lines reuse the shipped `Item` + `IconChip`; no `HoverCard`
wrapper, no line/row component.

## Covers

- `1.1`, `1.2` (readiness), `2.1`-`2.3` (compound), `3.1` (spec), `4.1` (stories),
  `5.1`-`5.7` (validation).
- VF - domain-free; no look-alike / no "Row"; convention exact (card.tsx shape,
  components/); media verbatim; panel inside the shipped HoverCard.

## Plan Type

full

## Execution Strategy

tdd-preferred

## Ordered Steps

1. Readiness (1.1, 1.2): re-read `card.tsx` / `hover-card.tsx` / `Item` / `IconChip`
   to lock the compound convention; confirm the export map + test setup.
2. Spec (3.1): write `model-info-card.spec.tsx` - header slots, section accent/
   title/value, optional value, export surface (only the two components).
3. Compound (2.1, 2.2, 2.3): write `model-info-card.tsx` - `ModelInfoCard` header
   + body, `ModelInfoCardSection` accent/title/value + rows; export at the end; no
   line/row component, no HoverCard wrapper.
4. Stories (4.1): the standalone panel + a `HoverCard` story over a `ModelListItem`
   with real `AiProviderIcon` and `Item` + `IconChip` lines.
5. Validate (5.1-5.6) then record the chiselhub follow-up (5.7).

## Validation Per Step

1. `nx test @zeroxsolutions/ui` runs (baseline green).
2. `nx test @zeroxsolutions/ui` - the new spec fails first (red), for the not-yet-
   written component.
3. `nx test @zeroxsolutions/ui` - the spec passes; `nx build @zeroxsolutions/ui`
   emits `dist/components/model-info-card.*`.
4. `nx typecheck @zeroxsolutions/storybook` shows only pre-existing unrelated
   errors; the story builds.
5. `nx build test @zeroxsolutions/ui` green; domain-free + convention greps clean;
   storybook-static + headless-Chrome shot confirms the panel and the hover;
   `openspec validate add-model-info-card` passes.

## Files / Owners

- `packages/ui/src/components/model-info-card.tsx` (+ `.spec.tsx`)
- `apps/storybook/src/model-info-card.stories.tsx`

## Completion Checkpoint

Both components in one file with the `card.tsx` shape; `nx build test
@zeroxsolutions/ui` green; the domain-free and convention greps clean (no app
type, no line/row export, no HoverCard wrapper, file in `components/`); the new
story adds no new typecheck error; the real-browser check confirms the panel and
the hover-to-reveal; `openspec validate` passes. No commit unless the user asks.

## Completion Verification

- Retained evidence recommended: the storybook-static headless-Chrome screenshot
  of the panel + the hover-over-item, and the `nx build test @zeroxsolutions/ui`
  result.
- The domain-free + convention grep results recorded on tasks 5.2 / 5.3.
