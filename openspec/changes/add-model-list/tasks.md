## 1. Confirm assumptions (readiness conditions)

- [x] 1.1 Read `packages/ui/package.json` and confirm the export map for `components/*` (a `./*` wildcard needs no edit; a curated map needs a per-file entry per new file). Confirm `@zeroxsolutions/icons`, `lucide-react`, and the vitest + Testing Library test setup are already wired for `@zeroxsolutions/ui`.
- [x] 1.2 Re-read `packages/ui/src/components/ai-provider-card.tsx` and the shipped `Item` (`components/ui/item.tsx`), `Badge`, `Empty`, `Skeleton`, `Switch`, `Tooltip` primitives to lock the exact sub-component names, variant/size props, and the `data-slot` + `export {}`-at-end conventions to mirror.

## 2. IconChip (atom, no dependency on the others)

- [x] 2.1 `icon-chip.tsx`: `IconChip({ icon, label, tint, className, ...props })` - a `Tooltip` wrapping a tinted `span` (tint = consumer className) holding the `icon` node, with `label` as the `TooltipContent`; `data-slot="icon-chip"`; no built-in capability set.
- [x] 2.2 `icon-chip.spec.tsx` (vitest + Testing Library): renders the icon node, applies the `tint` class to the container, exposes `label` via the tooltip, and declares no predefined capability list.

## 3. ModelListItem (composed surface, built on Item)

- [x] 3.1 `model-list-item.tsx`: `ModelListItem({ name, modelId, media, meta, enabled, onEnabledChange, onRemove, action, unavailable, className, ...props })` built on `Item`/`ItemMedia`/`ItemContent`/`ItemTitle`/`ItemDescription`/`ItemActions`; renders the enable `Switch` (`disabled = !onEnabledChange || unavailable`) and a remove `Button` when `onRemove` is set; dims on `unavailable`; `data-slot="model-list-item"`.
- [x] 3.2 `model-list-item.spec.tsx`: name as primary line + modelId as secondary line; media/meta/action slots render; `AiProviderIcon` in `media` renders verbatim; `unavailable` dims and disables the `Switch`; `onEnabledChange`/`onRemove` fire; optional slots omit cleanly without throwing.

## 4. ModelList frame + ModelListSkeleton

- [x] 4.1 `model-list.tsx`: `ModelList({ title, controls, tabs, children, className, ...props })` - header (title + controls) + optional tabs slot + a scrollable region for children; holds no list state (no filter/group/sort/paginate); `data-slot="model-list"`.
- [x] 4.2 `model-list-skeleton.tsx`: `ModelListSkeleton({ count = 6, className, ...props })` - `count` placeholder items composed from `Skeleton`, each matching `ModelListItem`'s shape (media placeholder + two text lines + trailing control); `data-slot="model-list-skeleton"`.
- [x] 4.3 `model-list.spec.tsx` + `model-list-skeleton.spec.tsx`: frame renders title/controls/tabs/children and does not reorder or transform children; skeleton renders `count` placeholder items with the expected sub-shape.

## 5. Storybook

- [x] 5.1 `apps/storybook/src/.../model-list-item.stories.tsx`: Playground (controls) + states (enabled/disabled/read-only/unavailable) + a real `AiProviderIcon` in the media slot + `IconChip` capability chips + `Badge` token pills in `meta`.
- [x] 5.2 `apps/storybook/src/.../model-list.stories.tsx`: the assembled frame - title + a search/refresh `controls` slot + a `tabs` slot + several `ModelListItem`s, plus loading (`ModelListSkeleton`) and empty (`Empty`) states.
- [x] 5.3 `apps/storybook/src/.../icon-chip.stories.tsx`: a small gallery of tinted chips (consumer-supplied icon/label/tint).

## 6. Validation

- [x] 6.1 `nx build test @zeroxsolutions/ui` green (202 tests; ui has no `lint` target, same as `icons`).
- [x] 6.2 Domain-free check: the 4 shipped components import only `@/components/ui/*`, `@/lib/utils`, `react`, and `lucide-react` - no `@zeroxsolutions/agents`, `AvailableModel`, `ModelCapability`, or pricing/credit import.
- [x] 6.3 `nx typecheck @zeroxsolutions/storybook` clean for the new files (2 real type errors found + fixed: IconChip span-props onto TooltipTrigger, ModelList `title` clash - both resolved); only pre-existing unrelated story errors remain.
- [x] 6.4 Real-browser check: built storybook-static, served it, and screenshot the stories in chrome-headless-shell. Verified ModelListItem states (logos via AiProviderIcon, IconChip tints, Badge token pills, Switch on/off/disabled, remove, unavailable dimming), the ModelList frame (title + search + refresh + line tabs + item group), the IconChip gallery, and the ModelListSkeleton (6 items matching the item shape).
- [x] 6.5 `openspec validate add-model-list` passes.
- [x] 6.6 chiselhub follow-up recorded in proposal/design Non-Goals + Migration Plan (bump `@zeroxsolutions/ui`; collapse the app model item + list section + skeleton + chip atoms onto the DS; keep the stateful container app-side); tracked in chiselhub, out of scope here.
