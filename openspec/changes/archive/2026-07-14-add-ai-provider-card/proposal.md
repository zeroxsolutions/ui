## Why

chiselhub's `apps/web-app` ships a `ProviderCard` molecule - an AI-provider tile for its settings overview grid (brand mark + name, a two-line blurb with reserved height so rows align, and a footer whose right edge carries an enable control). It is composed entirely from `@zeroxsolutions/ui` primitives (`Card`, `Switch`), yet the arrangement itself - the reserved-height clamp, the whole-card click target with a stop-propagation island around the trailing control, the tone-styled footer status - is re-derived per app.

That arrangement is a genuinely reusable design-system surface: any LLM/AI app has a "provider tile in a grid". Today it lives only in one app, so a second surface would copy the look and drift from it (tokens, spacing, dark mode). Bringing a domain-free version into `@zeroxsolutions/ui` gives every app one faithful card, while the AI-provider domain (which vendors exist, brand-logo resolution, connection state) stays in the consuming app.

## What Changes

- Add a new composed component `AiProviderCard` to `@zeroxsolutions/ui` (`packages/ui/src/components/ai-provider-card.tsx`), authored to the house shadcn/Base-UI conventions and composed from the shipped `Card` + house tokens.
- The card is domain-free: the brand mark is a passed `icon: ReactNode` slot and the trailing control is a passed `action: ReactNode` slot - no provider registry, no `@zeroxsolutions/icons` coupling inside the card.
- Add a Storybook story (`apps/storybook/src/ai-provider-card.stories.tsx`) with mock data and a co-located behavior spec (`ai-provider-card.spec.tsx`).

## Success Criteria

- `AiProviderCard` renders a provider tile - icon slot + name, a clamped two-line description with reserved height, and a footer carrying a muted meta note (or a tone-styled status) on the left and the `action` slot on the right.
- The component is domain-free: it imports nothing from `@zeroxsolutions/icons` and defines no provider/preset registry; a consumer supplies both the mark and the trailing control.
- Clicking the card fires `onSelect`; interacting with the `action` slot does not also trigger `onSelect` (propagation stopped).
- The component consumes house primitives at their variants - `Card size="sm"`, `CardTitle`/`CardDescription`/`CardFooter` - with `className` limited to layout; no primitive-internal overrides (no forced `text-base`, no `border-t-0`), colour only via tokens.
- Storybook story + co-located spec exist; `lint`, `build`, and `test` are green for `@zeroxsolutions/ui` and `@zeroxsolutions/storybook`, and the card is verified rendering in a real browser.

## Non-Goals

- No preset -> brand-mark resolver, and no changes to `@zeroxsolutions/icons` (only one consumer needs resolution today; that stays in the app).
- No changes to chiselhub. Refactoring chiselhub's `ProviderCard` to consume the new component is separate, downstream work.
- No new `Card`/`Switch` primitive changes; the shipped primitives already cover everything the card needs.
- No full compound part-set (`AiProviderCardHeader`/`...Title`/`...Footer`); a focused component with slots is the chosen altitude for one consumer.

## Capabilities

### New Capabilities

- `ai-provider-card`: a domain-free design-system card for presenting one AI provider in a grid - icon slot, name, clamped description, footer meta/status, a trailing action slot, and whole-card selection.

### Modified Capabilities

<!-- None. No existing spec-level behavior changes. -->

## Impact

- New source: `packages/ui/src/components/ai-provider-card.tsx` (+ `ai-provider-card.spec.tsx`).
- New story: `apps/storybook/src/ai-provider-card.stories.tsx`.
- Public surface: `@zeroxsolutions/ui` gains one exported component via its dist-mirrored `./*` subpath map (`@zeroxsolutions/ui/components/ai-provider-card`); additive, no breaking change.
- Dependencies: none added - composes existing `Card`/`Switch`, `cn`, and house tokens.
