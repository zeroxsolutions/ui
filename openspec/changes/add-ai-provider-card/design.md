## Context

`@zeroxsolutions/ui` is a shadcn-style design system (`components.json` -> style `base-vega`, Base UI, cva, `data-slot`, lucide, Tailwind v4, neutral base). Composed, hand-authored components live in `packages/ui/src/components/*.tsx` (precedent: `binary-file-card`, `icon-label`, `status-dot`), each with a co-located `.spec.tsx`; vendored shadcn primitives live in `components/ui/*` and are never edited. The shipped `Card` already supports `size="default" | "sm"` (via `data-size`, driving `--card-spacing`) and exposes `CardHeader`/`CardTitle`/`CardDescription`/`CardFooter`/`CardContent`/`CardAction`; `Switch` is shipped. `@zeroxsolutions/icons` ships 176 brand marks, each exporting `<Brand>Mark` with `.Mono`/`.Avatar`/`.Text` variants.

chiselhub's `apps/web-app/.../molecules/provider-card.tsx` is the source design. It is an app molecule: it composes `Card` + `Switch` but is typed by chiselhub's `ProviderEntry` view-model and renders `ProviderMark` (a 60+ entry `preset -> @lobehub/icons` registry). This change lifts the visual/interaction arrangement into the DS, stripped of that domain.

## Goals / Non-Goals

**Goals:**

- One faithful, reusable AI-provider tile in `@zeroxsolutions/ui`, composed from the shipped `Card` at its variants.
- Domain-free: the card knows nothing about providers, presets, or brand resolution - those are consumer concerns.
- Encode the non-obvious bits once: reserved-height two-line clamp for grid alignment, whole-card selection with an action island, tone-styled footer status.

**Non-Goals:**

- No `preset -> mark` resolver and no `@zeroxsolutions/icons` change (rule of three - one consumer today).
- No full compound part-set; a focused component with slots is the altitude.
- No chiselhub refactor in this change.

## Decisions

### Focused component with slots, not a compound part-set

Authored like `binary-file-card`: one component, focused props, two flexible `ReactNode` slots (`icon`, `action`). The DS `Card` compound remains the escape hatch for any arrangement this does not cover, so the focused component need not be a full `Root + parts` compound for its single consumer. No cva: the card carries no `variant`/`size` axis of its own (it forwards `Card size="sm"`), matching `status-dot`/`binary-file-card` which use plain props/maps, not cva.

### Trailing control is an `action: ReactNode` slot, not `enabled`/`onEnabledChange`

An `action` slot is both simpler and more correct than hardcoding a `Switch`:

- The card imports no `Switch` and owns no toggle logic - less code, less coupling.
- It avoids hardcoding a control a consumer cannot swap for a button/menu (shadcn favours composition over a fixed prop-bag control).
- The "switch always present, disabled when the provider is not user-controllable" behavior is chiselhub domain logic and stays in the app, which passes a fully-formed `<Switch .../>` (or any node) as `action`.

The card wraps `{action}` in a span that stops click propagation, so the whole-card `onSelect` and the action never both fire.

### API

```tsx
export type StatusTone = /* reuse from status-dot */ "online" | "offline" | "busy" | "idle"

interface AiProviderCardProps extends React.ComponentProps<'div'> {
  name: string
  icon?: React.ReactNode
  description?: React.ReactNode
  meta?: React.ReactNode                        // footer-left muted note
  status?: { tone: StatusTone; text: string }   // overrides meta, tone-styled
  action?: React.ReactNode                      // footer-right; auto stop-propagation island
  onSelect?: () => void
}
```

Reuse `StatusTone` from `status-dot` rather than inventing a `'warning' | 'error'` union, keeping one tone vocabulary. (chiselhub's `error`/`warning` map to `busy`/`idle` at the call site.) Tone -> class is a small `Record<StatusTone, string>` of semantic tokens (`text-destructive`, `text-warning`, ...), mirroring how `status-dot` maps tone -> `bg-*`.

### Composition and fidelity fixes vs the chiselhub original

```
<Card size="sm" data-slot="ai-provider-card" onClick={onSelect}
      className="h-full cursor-pointer ...hover ring...">
  <CardHeader>
    <CardTitle className="flex items-center gap-2.5">{icon}<span class="truncate">{name}</span></CardTitle>
  </CardHeader>
  <CardDescription className="line-clamp-2 min-h-11">{description}</CardDescription>
  <CardFooter className="mt-auto justify-between">
    <span>{status ? toned status text : meta}</span>
    <span onClick={stopPropagation}>{action}</span>
  </CardFooter>
</Card>
```

- Use `CardDescription`, not a raw `<p>`; add only `line-clamp-2 min-h-11` (layout).
- Drop the forced `text-base font-semibold` on the title - `Card size="sm"` already renders `CardTitle` at `text-sm`. `className` stays layout-only (shadcn convention: variants own internal look, `className` is for layout).
- Drop `border-t-0 bg-transparent` on the footer - the house `CardFooter` has neither by default.

### Accessibility of whole-card click

Keep `onSelect` as the card's `onClick` plus `cursor-pointer`; do NOT add `role="button"`/`tabIndex`. The card contains an interactive `action` control, so a button role on the container would create nested-interactive semantics that are worse for assistive tech, not better. The card click is a mouse convenience; keyboard-accessible navigation is the consuming app's concern (e.g. an adjacent list with proper semantics). This is a deliberate, documented limitation.

### Files

- `packages/ui/src/components/ai-provider-card.tsx` (+ `ai-provider-card.spec.tsx`)
- `apps/storybook/src/ai-provider-card.stories.tsx` (mock data; no chiselhub imports)
- Export flows automatically through the package's dist-mirrored `./*` subpath map (`@zeroxsolutions/ui/components/ai-provider-card`); no barrel edit.

## Risks / Trade-offs

- **Name vs implementation:** the guts are generic (icon + name + blurb + action), so `AiProviderCard` is an intent name, not a structural one. Accepted - the shape reads as "provider" and the name documents the target use. A later generic (`EntityCard`) could subsume it if a second, non-provider use appears.
- **Whole-card click a11y:** not keyboard-operable by design (nested interactive). Accepted as a mouse affordance; consumers own accessible navigation.
- **Two footer concepts (`meta` + `status`):** slightly more surface than a single `footer` slot, but it encodes the tone-styling once (like `status-dot`) instead of pushing it to every consumer.

## State Model

Stateless / controlled. The card holds no internal state: `onSelect` and the `action` node's own handlers are the only interactions, both owned by the consumer.

## Migration Plan

Additive to `@zeroxsolutions/ui` - a new component on the existing `./*` export map, no breaking change, no dependency added. chiselhub can later replace its `ProviderCard` internals with `<AiProviderCard icon={<ProviderMark .../>} action={<Switch .../>} .../>`; that adoption is out of scope here.

## Open Questions

- None blocking. (Confirmed with the user: `action` slot over `enabled` props; keep the `AiProviderCard` name; skip a preset resolver.)
