## Context

The `model-list` surface shipped `ModelListItem` / `ModelList` / `IconChip` but
deliberately excluded the model detail panel. chiselhub has that panel as an app
component `ModelInfoCard` (in `model-picker.tsx`), shown inside a `HoverCard`:
an identity header (logo + name + vendor + `modelId`), then titled sections
(Context Length, Abilities, Pricing), each an accent-bar header over lines of
`IconChip` + label + optional value.

`@zeroxsolutions/ui` already ships `HoverCard`, `Item` / `ItemGroup`, `Tooltip`,
and (from `model-list`) `IconChip`. The missing piece is the domain-free
**layout**: the identity header and the titled sections. The design is the
design system's own (not a byte copy of chiselhub); the naming and file split
follow the shadcn convention exactly (`components.json` aliases + the `card.tsx`
compound pattern).

## Goals / Non-Goals

**Goals:**

- Ship a domain-free `ModelInfoCard` compound (`ModelInfoCard` +
  `ModelInfoCardSection`) that renders inside the shipped `HoverCard`.
- Compose shipped primitives; add no `HoverCard` wrapper and no line/row
  component (a line is an `Item` by role).
- Keep the surface capability/pricing-taxonomy-agnostic.

**Non-Goals:**

- The app's data mapping (capabilities, credit pricing, context formatting) -
  stays in chiselhub.
- Wiring chiselhub onto the DS component - a follow-up PR.

## Decisions

### D1 - One compound file, `ModelInfoCard*` sub-parts (card.tsx convention)

The compound lives in one file `packages/ui/src/components/model-info-card.tsx`
(a composed surface -> `components/`, per `components.json` `aliases.components`,
not `components/ui/`). It exports two `function` sub-parts named `<Parent><Part>`,
each `data-slot`-tagged, with `export { ModelInfoCard, ModelInfoCardSection }` at
the end - exactly the `card.tsx` shape (`Card` + `CardHeader` + ...).

```ts
export interface ModelInfoCardProps extends React.ComponentProps<'div'> {
  /** Leading logo slot, rendered verbatim (e.g. an `AiProviderIcon`). */
  media?: React.ReactNode
  /** Model display name. */
  name: React.ReactNode
  /** Model vendor / maker. */
  vendor?: React.ReactNode
  /** The model id, shown mono under the identity. */
  modelId?: React.ReactNode
  /** The section body. */
  children?: React.ReactNode
}

export interface ModelInfoCardSectionProps
  extends Omit<React.ComponentProps<'div'>, 'title'> {
  /** Consumer class for the accent bar (background colour). The DS ships none. */
  accent?: string
  /** Section title. */
  title: React.ReactNode
  /** Optional trailing value (e.g. a context length). */
  value?: React.ReactNode
  /** The section rows. */
  children?: React.ReactNode
}
```

`ModelInfoCardSectionProps` omits `title` from the div base because it widens
`title` to `ReactNode` (the same clash `ModelList` hit).

### D2 - The header is an identity block, not an Item

`ModelInfoCard` renders its header as a plain identity block - a leading media
slot, the `name` over the `vendor`, then a mono `modelId` line - the card
header's own role (akin to `CardHeader`), not a list line. `data-slot`s:
`model-info-card` on the root, and the header uses ordinary layout. The body is
`children`.

### D3 - `ModelInfoCardSection`: accent bar + title + value, over its rows

A section is the repeated titled-group visual: a small accent bar (a
consumer-classed pill) + a title, an optional right-aligned value, then its
`children`. The accent colour is a **consumer class** (e.g. `bg-blue-500`), so
the DS itself stays monochrome (see the monochrome-DS rule); the DS ships the
layout, the caller supplies the hue. `data-slot="model-info-card-section"`.

### D4 - Detail lines reuse the shipped `Item`; no line/row component

A detail line is an icon + a label + an optional value - which is the shipped
`Item` by role (`ItemMedia` + `ItemContent` + a trailing value). So the surface
adds **no** line/row component (a `*Row`/`*Line` would be an `Item` look-alike,
the MonoChip-vs-Badge mistake, and re-introduces the rejected "Row" term). A
consumer composes each line as `Item` (`size="xs"`) + `IconChip`:

```tsx
<ModelInfoCardSection accent="bg-violet-500" title="Abilities">
  <Item size="xs">
    <ItemMedia><IconChip icon={<Eye className="size-3" />} label="Vision input" tint="..." /></ItemMedia>
    <ItemContent><ItemTitle>Vision input</ItemTitle></ItemContent>
  </Item>
</ModelInfoCardSection>
```

### D5 - The hover trigger is the shipped `HoverCard`; no wrapper

No `ModelHoverCard` is added - the hover mechanism is the shipped `HoverCard`.
The consumer wraps the trigger and renders the panel as content:

```tsx
<HoverCard>
  <HoverCardTrigger render={<ModelListItem name="GPT-4o" media={<AiProviderIcon provider="openai" />} /* ... */ />} />
  <HoverCardContent side="right" align="start" className="w-80">
    <ModelInfoCard media={<AiProviderIcon provider="openai" size={36} />} name="GPT-4o" vendor="OpenAI" modelId="gpt-4o">
      <ModelInfoCardSection accent="bg-blue-500" title="Context Length" value="128K tokens" />
      {/* Abilities / Pricing sections with Item lines */}
    </ModelInfoCard>
  </HoverCardContent>
</HoverCard>
```

### D6 - Domain-free; data via props / slots / children

No `AvailableModel`, `ModelCapability`, or pricing/credit type enters the DS.
The consumer maps its data (capabilities -> ability lines, credit pricing ->
pricing lines, context length -> a formatted value) and passes props, slots, and
children. The DS imports only its own primitives, `IconChip`, and React.

### D7 - Placement, exports, tests

`components/model-info-card.tsx` (public path
`@zeroxsolutions/ui/components/model-info-card` via the existing `./*` map, no
`package.json` edit), a co-located `model-info-card.spec.tsx` (vitest + Testing
Library), and a Storybook story wiring `ModelListItem` in a `HoverCard` trigger
with `ModelInfoCard` content.

## Risks / Trade-offs

- **`Item size="xs"` lines are slightly more padded than a bespoke tight line.**
  Accepted: density is tunable via `className`, and reusing `Item` avoids a
  look-alike; a bespoke tight line is exactly the banned duplication.
- **`ModelInfoCardSection` is thin** (an accent-bar header + a slot). Justified by
  the pattern repeating per section; the consumer can drop it and compose a
  header inline if preferred (overridable in review).
- **`accent` / chip `tint` are consumer classes.** They leak a styling contract
  but keep the DS monochrome and the taxonomy app-side.
- **HoverCard content mounts on open** (Base UI): a spec asserting the panel's
  content must open the card first, or assert the closed trigger only.

## State Model

`ModelInfoCard` and `ModelInfoCardSection` are stateless presentational layout.
The only runtime state is the shipped `HoverCard`'s open/close, owned by that
primitive; the panel content mounts when the card opens.

## Migration Plan

1. Ship `ModelInfoCard` + `ModelInfoCardSection` + a story + a spec; green
   `lint build test`; `nx release`.
2. (Out of scope, chiselhub PR) Bump `@zeroxsolutions/ui`; wrap the app's model
   item in `HoverCardTrigger` and render `ModelInfoCard` in `HoverCardContent`,
   mapping abilities/pricing/context to `Item` lines + `ModelInfoCardSection`;
   delete the app's `ModelInfoCard` / `SectionHeader` / `DetailRow`, keeping the
   data mapping.

## Open Questions

- Whether `ModelInfoCardSection` earns its place or the header should be composed
  inline by the consumer. Resolvable in review; not blocking.
