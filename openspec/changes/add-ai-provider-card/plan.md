## Scope

Implement the `AiProviderCard` component in `@zeroxsolutions/ui`, its Storybook story, and its co-located spec — the full change.

## Covers

`1.1`, `1.2`, `1.3`, `1.4`, `2.1`, `2.2`, `3.1`, `3.2`, `3.3` — and the review Validation Focus items (click vs action-island, status/meta, domain-free, browser alignment + tokens).

## Plan Type

lightweight

## Execution Strategy

tdd-preferred

## Ordered Steps

1. Write `ai-provider-card.spec.tsx` first: click -> `onSelect`; activating `action` -> NOT `onSelect`; `status` replaces `meta` with a tone class; renders without `icon`/`description`. (Red.)
2. Implement `ai-provider-card.tsx`: `Card size="sm"` (`data-slot`, `onClick`, `cursor-pointer`, hover ring) > `CardHeader`/`CardTitle` (icon + truncated name) > `CardDescription` (`line-clamp-2 min-h-11`) > `CardFooter` (`mt-auto justify-between`) with footer-left status/meta (tone map reusing `StatusTone`) and footer-right `{action}` in a stop-propagation span. No icons import, no preset map, `className` layout-only. (Green.)
3. Add `ai-provider-card.stories.tsx` with mock data incl. a 1-line vs 3-line grid, each status tone, and a no-`onSelect` variant; pass brand marks + a `Switch` only in the story.
4. Run lint/build/test; then browser-verify the stories and record evidence.

## Validation Per Step

1. `nx test @zeroxsolutions/ui` shows the new spec failing for the right reason.
2. `nx test @zeroxsolutions/ui` green; the spec's behavior assertions pass.
3. `nx build @zeroxsolutions/storybook` (or the story renders in dev) with no type/lint error.
4. `nx run-many -t lint build test -p @zeroxsolutions/ui @zeroxsolutions/storybook` green; browser check passes (below).

## Files / Owners

- `packages/ui/src/components/ai-provider-card.tsx`
- `packages/ui/src/components/ai-provider-card.spec.tsx`
- `apps/storybook/src/ai-provider-card.stories.tsx`

## Completion Checkpoint

All tasks in `tasks.md` checked; lint/build/test green for `@zeroxsolutions/ui` and `@zeroxsolutions/storybook`; the spec proves the interaction contract; the component imports nothing from `@zeroxsolutions/icons` and defines no preset map; staged diff rule-audited.

## Completion Verification

Verification Mode is retained-required, so record a companion note at `openspec/changes/add-ai-provider-card/verification.md` capturing:

- Command output for `lint build test` (green).
- Real-browser evidence (screenshot or measured DOM) from `storybook-static` driven headlessly: two cards with 1-line vs 3-line descriptions with aligned footers, each `status` tone rendered, and correct surface/text tokens under both light and `.dark`.
- A note confirming the Storybook Vite cache was cleared if a rebuild initially did not reflect.

Do not present the work as complete on green build/test alone — the browser evidence is required.

## Review Follow-Up

- Accepted (from design/review): use `CardDescription` not raw `<p>`; drop forced `text-base` title override; drop `border-t-0`/`bg-transparent` footer; `action` slot over `enabled`/`onEnabledChange`; keep whole-card click a mouse affordance (no `role="button"`).

## Execution Notes

<!-- appended at apply time -->

## Manual Adjustments

<!-- none -->
