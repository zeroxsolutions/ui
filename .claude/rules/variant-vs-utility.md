---
description: A variant/prop must abstract, never relabel a single Tailwind utility; layout is className in this stack; the SDK is canonical, not consumer-shaped.
paths:
  - "packages/ui/src/**/*.{ts,tsx}"
---

# Variants vs utilities · layout primitives · SDK canonicity

Extends [component-conventions.md](component-conventions.md) (§2 CVA, §3
props-vs-composition) and [design-system.md](design-system.md) (don't re-chrome,
tokens, owns-no-spacing) — read those first; this adds only what they don't
cover. Stack: Base UI + CVA + Tailwind v4. Research-grounded (sources at end).

A typed prop is a contract that must earn its keep over `className`. Re-spelling
one Tailwind utility as a TS enum (`gap={3}` → `gap-3`) is not an abstraction —
it is CSS re-declared in TypeScript.

## 1. A variant must abstract, never relabel a single utility

A CVA `variant`/prop value is justified only when it does one of: bundle
**multiple** declarations under a semantic name (Button `destructive` ≈ 6
classes), encode a **curated subset** (a vetted keyword set, not the raw CSS
enum), or **bind a token** the consumer shouldn't hardcode.

**Ban.** A value that is a single utility, named after that utility, with no
decision → delete it; the concern is `className`. (This is component-conventions
§2 "don't restate what a variant gives," at the variant-*definition* level.)

**Carve-out.** A single declaration under a *semantic* name that encodes a
decision (a `loading` state, a focus-ring token) is fine — the ban needs all
three: value-name == utility suffix, one class, no decision.

- Don't: `gap:{1:'gap-1'}`, `align:{center:'items-center'}`,
  `justify:{between:'justify-between'}`, `color:{muted:'text-muted-foreground'}`,
  `weight:{bold:'font-bold'}`, `rounded:{lg:'rounded-lg'}` — each is one
  declaration named after its utility.
- Don't justify it with "needed for static extraction": Tailwind v4 only detects
  complete, unbroken class strings, and the consumer's `className="gap-3"` is
  already one — a parallel enum adds nothing.

This narrows **new ad-hoc** props only; the four sanctioned styling props from
component-conventions §2 (`variant`/`size`/`color`/`tone`) stay. A `color`/`tone`
that binds a token *palette* (fg + bg + border + hover together) is a real
bundle; `color:{muted:'text-muted-foreground'}` is the banned relabel.

## 2. Layout primitives — in this stack, layout is `className`

shadcn ships no layout primitives (the Flex request was closed not-planned). The
token-driven libraries expose `gap`/`align` as props *because they have no
utilities* — the prop is their only door to the scale. Tailwind already exposes
the scale as `gap-*`/`items-*`/`justify-*`, so wrapping it in a prop is a §1
relabel. **Verdict: spacing, alignment, direction, and wrap are `className`
utilities, not props.** A plain `Flex` whose props are
`gap`/`align`/`justify`/`direction` earns no slot here.

A layout primitive earns a slot only when it adds what utilities can't (a fixed
internal grid, a managed scroll body, an identity that is a decision — `Center`'s
`items-center justify-center`). When it does: own `display` once (don't put
`flex` in the cva base *and* an `inline:{false:'flex'}` variant — two display
classes, `twMerge` silently drops one); bake no outer spacing; responsive via
Tailwind `md:` prefixes in `className`, not a runtime-built prop; polymorphism
via Base UI `render` (component-conventions §2); no `data-*` state.

## 3. The SDK is canonical — never reshape it to a consumer

The dependency direction is consumer → SDK. A prop, variant, or enum is decided
by what the system needs, not one app's measured usage.

- No magic value reverse-engineered from a consumer's screen (`w-[332px]`) — use
  a `size` variant or the consumer's `className`.
- No enum sized to a consumer snapshot ("web-app only uses `gap` 1–6") — bind the
  token scale (open by construction) or pass `className`. *(The mistake that
  prompted this rule: a `Flex` `gap` enum extended to match measured web-app
  usage.)*
- A primitive that knows a consumer's domain is a feature organism
  (component-conventions §3) — it belongs in the app, not the SDK.

## 4. Decision delta (sharpens component-conventions §3, step 1)

A styling concern is a CVA `variant`/`size` only if switching it flips a
**bundle** of declarations under one semantic name, or a curated-subset/token
decision (§1). Otherwise a single utility — placement, sizing, spacing, one
alignment — is **`className`** (merged via `cn`, `className` last). `className` is
a placement/sizing hatch, never a repaint hatch: a primitive's color/border goes
through a `variant` (design-system "don't re-style a primitive"). Re-deriving a
token (`text-foreground/50` for muted) → use the semantic token
(`text-muted-foreground`). `cn(className)` with one argument → pass `className`
directly.

<!-- Sources (kept here at zero load cost; HTML comments are stripped before injection):
CVA https://cva.style/docs · shadcn Button https://ui.shadcn.com/docs/components/button ·
shadcn Flex not-planned https://github.com/shadcn-ui/ui/issues/6230 ·
Tailwind utility-first https://tailwindcss.com/docs/styling-with-utility-classes +
class detection https://tailwindcss.com/docs/detecting-classes-in-source-files ·
Radix Themes spacing https://www.radix-ui.com/themes/docs/theme/spacing +
Flex https://www.radix-ui.com/themes/docs/components/flex ·
Chakra/Panda recipes-vs-style-props https://panda-css.com/docs/concepts/recipes +
https://panda-css.com/docs/concepts/style-props ·
MUI spacing https://mui.com/system/spacing/ · Mantine style props https://mantine.dev/styles/style-props/ ·
Base UI render https://base-ui.com/react/utils/use-render · React 19 ref-as-prop https://react.dev/blog/2024/12/05/react-19 -->
