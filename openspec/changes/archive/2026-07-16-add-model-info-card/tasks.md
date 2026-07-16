## 1. Confirm assumptions (readiness conditions)

- [x] 1.1 Re-read `packages/ui/src/components/ui/card.tsx` (compound convention), `hover-card.tsx` (the trigger/content props: `HoverCardTrigger` `render`, `HoverCardContent` `side`/`align`), the shipped `Item` sub-parts, and the `IconChip` from `model-list` - to lock the exact sub-part naming, `data-slot`, and `export {}`-at-end pattern to mirror.
- [x] 1.2 Confirm the `./*` export map covers `components/model-info-card` (no `package.json` edit) and the vitest + Testing Library setup is wired for `@zeroxsolutions/ui`.

## 2. ModelInfoCard compound (one file, card.tsx convention)

- [x] 2.1 `model-info-card.tsx`: `ModelInfoCard({ media, name, vendor, modelId, children, className, ...props })` - identity header (media slot + name over vendor + mono `modelId`) over the `children` body; `data-slot="model-info-card"`.
- [x] 2.2 Same file: `ModelInfoCardSection({ accent, title, value, children, className, ...props })` (extends `Omit<ComponentProps<'div'>, 'title'>`) - an accent bar (consumer class) + title + optional trailing value, over `children`; `data-slot="model-info-card-section"`. `export { ModelInfoCard, ModelInfoCardSection }` at the end.
- [x] 2.3 Add no line/row component and no `HoverCard` wrapper - a detail line is the shipped `Item` (`size="xs"`) + `IconChip`, composed by the consumer.

## 3. Tests

- [x] 3.1 `model-info-card.spec.tsx` (vitest + Testing Library): header renders media (verbatim) + name + vendor + modelId + children; `ModelInfoCardSection` renders accent (class applied) + title + value + children, and omits `value` cleanly; the file exports only `ModelInfoCard` + `ModelInfoCardSection` (no line/row/hover-wrapper export).

## 4. Storybook

- [x] 4.1 `apps/storybook/src/model-info-card.stories.tsx`: the panel standalone (header + Context Length / Abilities / Pricing sections, ability + pricing lines as `Item` + `IconChip`), and a `HoverCard` story wiring a `ModelListItem` in `HoverCardTrigger` with `ModelInfoCard` content (real `AiProviderIcon` logo).

## 5. Validation

- [x] 5.1 `nx build test @zeroxsolutions/ui` green (207 tests, 5 new; no `lint` target on this project).
- [x] 5.2 Domain-free check: `model-info-card.tsx` imports only `react` + `@/lib/utils` (`cn`) - no `@zeroxsolutions/agents` / app-model / capability / pricing import.
- [x] 5.3 Convention check: one compound file `components/model-info-card.tsx` (not `components/ui/`), sub-parts `ModelInfoCard` + `ModelInfoCardSection`, each `data-slot`-tagged, `export {}` at the end; no line/row component, no `HoverCard` wrapper (module exports exactly the two).
- [x] 5.4 `nx typecheck @zeroxsolutions/storybook` clean for the new story; only pre-existing unrelated errors remain.
- [x] 5.5 Real-browser check: built storybook-static, served it, screenshot the panel in chrome-headless-shell. Verified header (verbatim AiProviderIcon + name/vendor/mono id), the accent-barred sections (Context Length/Abilities/Pricing with blue/violet/amber consumer accents), the Item+IconChip detail lines with trailing values, and the IconChip tints. Panel renders as a clean LobeHub-style detail card.
- [x] 5.6 `openspec validate add-model-info-card` passes.
- [x] 5.7 chiselhub follow-up recorded in proposal/design Non-Goals + Migration Plan (wrap the model item in `HoverCard` + render `ModelInfoCard`; delete the app `ModelInfoCard`/`SectionHeader`/`DetailRow`, keep data mapping); tracked in chiselhub, out of scope here.
