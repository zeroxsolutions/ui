## Author Every Composed Component as shadcn Compound Parts on Base UI — cva Variants, `data-slot` Coordination, Never a Prop-Bag
`[HIGH]` `ui-compound-authoring`

When the design system genuinely lacks a primitive and you **author a new composed component** — a header, a disclosure, an editor surface (see `ui-from-design-system` for whether bespoke is even warranted, and `ui-primitive-fidelity` for consuming existing ones) — author it exactly the way the house design system authors every primitive: a **shadcn-style compound** built on **Base UI**, styled through **`class-variance-authority`**, coordinated by **`data-slot`**. A monolithic component that takes its slots as props (`title=`, `actions=`, `renderHeader=`) is the anti-pattern: a consumer that must inject a control the author never foresaw *cannot*, so it hand-rolls a look-alike instead — the exact failure `ui-from-design-system` forbids. A compound component is composable by construction, so the consumer fills parts rather than forking.

**Author it in the composed layer, never the vendored one.** A newly-authored compound is *your* code — it lives in the design system's composed-component location, alongside the other hand-authored surfaces, **never** in the shadcn-CLI-vendored primitive layer, which regenerates from the registry and would silently clobber it on the next CLI run (see `ui-primitive-fidelity`). Compose the vendored primitives *into* the new component from there; a missing primitive is solved by composing existing ones, never by adding a file to — or editing — the vendored layer.

**Compound, not prop-bag.** Ship a Root plus named sub-parts — `<X>`, `<XHeader>`, `<XTitle>`, `<XActions>`, `<XContent>`, `<XTrigger>`, `<XItem>` — each a thin element the consumer arranges, never one component with slots as props. Each part is a PascalCase `<Root><Part>` symbol in a kebab file, typed `React.ComponentProps<El>` (or the wrapped primitive's props), merging `className` through `cn()`.

**`data-slot` on every part; parts coordinate by selector, not prop-drilling.** Tag each part `data-slot="<root>-<part>"` (kebab). Parts adapt to one another through `data-slot` / `group/<name>` / `has-data-[slot=…]` selectors — a header that re-lays-out when an actions part is present does so with `has-data-[slot=<root>-actions]:grid-cols-[1fr_auto]`, not a `hasActions` boolean.

**Shared state rides the wrapped Base UI primitive, not a hand-rolled context.** `data-slot` coordinates *layout*; *state* — open/closed, selected, active — is owned by the **Base UI compound primitive** the Root wraps: its Root already distributes that state down to its parts (build a disclosure on Base UI's collapsible, a tabbed surface on its tabs). Wrap that primitive and let its parts read the state through it — **never** hand-roll a React context to share state across the parts, and never prop-drill an `open` / `isOpen` boolean through them. If a compound needs shared state and no Base UI primitive provides it, that primitive gap is the thing to solve first, not a bespoke context bolted onto a `<div>` tree.

**Variants are cva, exported.** A *style-bearing* component owns `const <component>Variants = cva(<base>, { variants: { variant, size }, defaultVariants })`, **exported** beside the component so consumers reuse it. Keep the house axis vocabulary — `variant` for visual style, `size` for dimension — and **always set `defaultVariants`** so the component renders with zero props. The base string owns the cross-cutting state (focus-visible ring, `disabled:`, `aria-invalid:`) and auto-sizes descendant icons (`[&_svg:not([class*='size-'])]:size-4`), never a per-call-site size. Reach for `compoundVariants` only when two axes genuinely interact. **cva is for the parts that carry a style axis, not every part:** a **purely structural** compound — a Root that only lays out its parts with no visual `variant` — skips cva entirely and takes a plain union prop plus a `data-*` attribute instead (`size?: "sm"` + `data-size`, targeted by `data-[size=sm]:…` / `group-data-[size=sm]/<root>:…`), so a variant-less part never carries an empty `cva`.

**Props: the element's props + `VariantProps`.** Type a part by **how it renders**: a component that wraps a Base UI primitive is `<Primitive>.Props & VariantProps<typeof <component>Variants>`; a **render-polymorphic** part (one that composes via `useRender`, see below) is `useRender.ComponentProps<"span"> & VariantProps<…>` — *not* `<Primitive>.Props`; a plain-element part is `React.ComponentProps<"div">`. Destructure `{ className, variant, size, ...props }` (variants defaulted) and merge with `cn(<component>Variants({ variant, size, className }))`. Passing `className` **into** the cva call and passing it as the **second `cn` arg** — `cn(<component>Variants({ variant, size }), className)` — are equivalent (cva treats `className` as a pass-through key that appends last); the house layer uses both, so match the sibling file you're extending rather than reformatting it.

**Polymorphism is Base UI `render`, NEVER Radix `asChild`.** The house system is on Base UI: a part that must render as a different element takes a `render` prop and composes via `useRender` / `mergeProps` — not Radix's `asChild`. Copy-pasting a vanilla shadcn snippet that uses `asChild` is wrong here and will not compile against the house primitives.

**Incorrect — a monolithic prop-bag (slots as props) with a Radix `asChild`:**
```tsx
// 🔴 no way to inject a tab between the title and the actions → the consumer rebuilds the header by hand
<Disclosure title="Diagram" actions={<Copy />} collapsible>{body}</Disclosure>
export function Disclosure({ title, actions, children }: { title: ReactNode; actions: ReactNode; children: ReactNode }) { /* … */ }
<DisclosureTrigger asChild><button /></DisclosureTrigger>   // 🔴 Radix asChild — the house system is Base UI
```

**Correct — compound parts, exported cva variants, `data-slot`, Base UI `render`:**
```tsx
// one consumer fills the slots one way; another (an editor block) fills the same slots differently
<Disclosure>
  <DisclosureHeader>
    <DisclosureTitle>{icon}{label}</DisclosureTitle>
    <DisclosureActions>{tabs}{copy}</DisclosureActions>   {/* a second consumer injects its own controls here */}
  </DisclosureHeader>
  <DisclosureContent>{body}</DisclosureContent>
</Disclosure>

const disclosureVariants = cva("group/disclosure …", {
  variants: { size: { default: "…", sm: "…" } },
  defaultVariants: { size: "default" },
})
function Disclosure({ className, size = "default", ...props }:
  DisclosurePrimitive.Props & VariantProps<typeof disclosureVariants>) {
  return <DisclosurePrimitive data-slot="disclosure" className={cn(disclosureVariants({ size, className }))} {...props} />
}
function DisclosureHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="disclosure-header" className={cn("… has-data-[slot=disclosure-actions]:grid-cols-[1fr_auto]", className)} {...props} />
}
export { Disclosure, DisclosureHeader, /* …parts… */ disclosureVariants }
```

**Rules of thumb:**
- Author the new compound in the **composed layer**, never the CLI-vendored primitive layer (it regenerates — see `ui-primitive-fidelity`); compose vendored primitives *into* it.
- Compound parts (Root + `<Root><Part>`), never slots-as-props — a consumer must be able to compose parts the author never foresaw.
- `data-slot="<root>-<part>"` on every part; parts coordinate via `data-slot` / `group` / `has-data-[slot=…]`, not a coordination prop.
- Layout coordinates via `data-slot`; **shared state** rides the wrapped Base UI compound primitive's Root — never a hand-rolled React context, never a prop-drilled `open` boolean.
- `<component>Variants` is cva, **exported**, axes `variant` / `size`, `defaultVariants` always set; the base owns states + descendant-icon sizing — but a **purely structural** compound skips cva (plain prop + `data-*`).
- Type by how the part renders — `<Primitive>.Props` (wrapped primitive), `useRender.ComponentProps<El>` (render-polymorphic), or `React.ComponentProps<El>` (plain element) — each `& VariantProps<…>` when style-bearing; merge via `cn(<component>Variants({ …, className }))` (or `cn(<component>Variants({ … }), className)` — equivalent).
- Polymorphism = Base UI `render` / `useRender`; **never** Radix `asChild`.
- File kebab, symbol PascalCase, cva `<component>Variants` (see `naming-files-and-symbols`); export the component **and** its variants.

**Why:**
- A compound, `data-slot`-coordinated component is composable by construction — a new consumer extends it by filling parts instead of forking a look-alike — and cva-exported variants keep one styling contract while matching the house Base-UI / `render` mechanics keeps the new component indistinguishable from a shipped primitive. A prop-bag or a Radix-`asChild` copy silently breaks all three, and the next surface hand-rolls its own (drifting tokens, a11y, dark mode). This is the authoring half of the design-system discipline: `ui-from-design-system` and `ui-primitive-fidelity` govern **consuming** primitives; this rule governs **authoring** the new ones they will consume.

Reference: [shadcn/ui — composition](https://ui.shadcn.com/docs) · [class-variance-authority](https://cva.style/docs) · [Base UI](https://base-ui.com/) · see `ui-from-design-system` · `ui-primitive-fidelity` · `naming-files-and-symbols`
