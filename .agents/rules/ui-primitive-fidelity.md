## Consume Primitives at Their Variants; `className` Is Layout-Only, Native Elements Are By Exception
`[HIGH]` `ui-primitive-fidelity`

The house design system is **shadcn-style** (this repo: `components.json` → style `base-vega`, `cssVariables: true`, `iconLibrary: lucide`, the `shadcn` CLI a devDependency): a set of **vendored primitives** whose look is already decided, composed on Base UI. shadcn frames the intent — *"This is not a component library. It is how you build your component library."* — on principles including **Open Code** (*"The top layer of your component code is open for modification."*), **Composition** (*"Every component uses a common, composable interface, making them predictable."*), and **Beautiful Defaults** (*"Carefully chosen default styles, so you get great design out-of-the-box."*). Each primitive's variants are authored with `class-variance-authority`, which exists because *"Creating variants with the 'traditional' CSS approach can become an arduous task: manually matching classes to props, and manually adding types."* — **so a component's `size`/`variant` props, not an ad-hoc class, are its styling API** (that framing is the synthesis; the quoted words are cva's). The `cn()` helper is `twMerge(clsx())`, and *"tailwind-merge overrides conflicting classes and keeps everything else untouched"* — a passed `className` **replaces** the base class it conflicts with. That override channel exists for the genuine *"one-off case"* tailwind-merge names — a deliberate escape hatch, **not** the default path. So the order is always **prop/variant first, `className` only for what no variant can express** (see `ui-from-design-system` for the compose-don't-reimplement half).

**Two ownership axes decide every class.** A primitive owns its **internal appearance** — size, spacing, radius, colour, font, icon-size, and every interaction state (hover / focus / pressed / disabled). The consumer owns the primitive's **external placement** — where it sits in a layout the primitive does not control: flex/grid placement, a width the *container* dictates, gap/margin to siblings, absolute positioning. **A `className` is legitimate only on the external axis.** A class that touches the internal axis is either redundant (restating a default) or a fight (overriding a deliberate one) — and a primitive that needs a fight to fit is the **wrong primitive**: switch, don't patch.

**The `className` decision — one pass per class:**
```
a className token on a design-system component
  ├─ a variant / size / prop already expresses it            → use the prop, drop the class
  ├─ it re-tunes internal look (size·spacing·radius·color·    → FORBIDDEN — fighting the primitive;
  │   font·icon-size the primitive already sets)                if no variant fits, it's the wrong primitive
  ├─ it places the component in a layout it doesn't own       → ALLOWED — the consumer's axis
  │   (flex-1, a container-dictated width, ml-auto, grid, absolute pos)
  └─ it names a colour                                         → tokens only (bg-muted, text-destructive);
                                                                 never a hex or palette (bg-zinc-800, #1a1a1a)
```
Colour is not a free axis: *"The base token controls the surface color and the `-foreground` token controls the text and icon color that sits on that surface"*, and *"Dark mode works by overriding the same tokens inside a `.dark` selector"* — so a hardcoded hex or Tailwind palette colour breaks dark mode and every future theme; always a token.

**Native / raw elements are correct by exception, not a failure.** The design system ships *components*, not every *element*; reaching for a raw `<div>`/`<span>`/`<img>` is right — and required — in three cases:
- **Layout scaffolding** — the DS ships no "row" / "stack" / "grid" / "spacer" primitive; these *are* raw elements. They carry **only** layout classes and hold DS components inside.
- **Semantics / ARIA a primitive would violate** — use the element the established pattern prescribes even when a DS primitive looks visually close: a tree node is `<div role="treeitem">`, **not** a `<Button>` (W3C WAI-ARIA APG — activation is owned by the tree via roving tabindex, not a per-item button); likewise a surface anchored to a **coordinate/virtual point** or one whose **focus is owned by another component** is a bespoke shell (see `ui-from-design-system`).
- **A raw asset** — an `<img>`, an emoji glyph, or a bare icon that has **no** DS default size; there its `size-*`/`w-*` class is the element's *only* size spec, not a primitive override, and is retained.

The discipline that keeps native honest: a native element carries **only** structure / layout / asset-sizing, and **everything the DS ships that renders inside it** — buttons, badges, inputs, menu items, tooltips, empty states — stays a DS component on DS tokens. This does **not** loosen the reimplementation ban: a native element for layout/semantics/assets is legitimate; a native element that **re-skins a component the DS already ships** (a hand-rolled popover/menu/badge look-alike) is forbidden (see `ui-from-design-system`).

**Never edit the vendored primitive layer.** Primitives in `components/ui/` are shadcn-CLI-vendored and **regenerate** from the registry, so — despite shadcn's generic "own your code" — a local edit *there* is silently lost on the next `shadcn` run. A missing variant is solved by composing differently or a minimal raw-element class, **never** by forking the primitive or adding a variant to `ui/`.

**Incorrect — internal re-tune, a neutralised wrong element, a hardcoded colour, a vendored edit:**
```tsx
<Button size="icon" className="size-8"><X className="size-4" /></Button>  // 🔴 icon variant re-tuned by class; Button already sizes its svg — use size="icon-sm", drop both
<Button variant="ghost" className="h-auto px-0 py-1 hover:bg-transparent" onClick={activate}>  // 🔴 a Button stripped of height/padding/hover to fake a plain click region — wrong element (a treeitem is a div)
<Badge className="bg-[#f5f5f5] text-zinc-800">beta</Badge>  // 🔴 hardcoded colour bypasses the token pair — breaks .dark
// components/ui/button.tsx: add a `size: { tiny: "h-5 …" }` variant   // 🔴 edit to the vendored layer — resets on regenerate
```

**Correct — variant for internal look, `className` for external layout, tokens for colour, div for the treeitem:**
```tsx
<Button size="icon-sm" className="ml-auto"><X /></Button>          // ✅ size via variant; ml-auto is external layout; Button sizes its own svg
<div role="treeitem" className="flex min-w-0 flex-1 items-center gap-1.5 py-1" onClick={activate}>  // ✅ raw element for ARIA + layout; holds DS components inside
  {icon}<span className="flex-1 truncate">{name}</span>
</div>
<Badge className="bg-muted text-muted-foreground">beta</Badge>    // ✅ semantic token pair; flips under .dark
```

**Rules of thumb:**
- Prop/variant first; a `className` is a deliberate exception — reach for `size="icon-sm"`, not `className="size-8"`; if no variant fits, it's the wrong primitive.
- Internal axis (size·spacing·radius·color·font·icon-size·states) belongs to the primitive; only external placement (flex/grid, container-dictated width, `ml-auto`, absolute pos) belongs on a `className`.
- Colour is always a **semantic token** (`bg-*`/`*-foreground`, `text-destructive`), never a hex or Tailwind palette colour — hardcoding it breaks `.dark` and theming.
- Native `<div>`/`<span>`/`<img>` is correct for **layout scaffolding, ARIA-mandated semantics, or a raw asset** — carrying only structure/layout/asset-sizing, with DS components inside; it is **not** a licence to re-skin a shipped component.
- Never edit `components/ui/` — it regenerates; compose or keep a minimal raw-element class instead.

**Why:**
- cva makes variants the component's contract and `cn()`/tailwind-merge makes an override a clean replacement — so the fidelity question is never "can I override" (you always can) but "am I on the axis the component owns"; keeping `className` to external layout and colour to tokens is what preserves one consistent, theme-correct surface, while confining native elements to structure/semantics/assets keeps the escape hatch from drifting into a second, hand-styled UI. Editing the vendored layer is wasted work the next CLI run erases.

Reference: [shadcn/ui](https://ui.shadcn.com/docs) · [class-variance-authority](https://cva.style/docs) · [tailwind-merge](https://github.com/dcastil/tailwind-merge) · [WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/) · see `ui-from-design-system` · `ui-compound-authoring` · `house-libs-catalog-scope`
