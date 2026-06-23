---
description: Authoring components in @chiselart/ui — naming, props/API, polymorphism, analysis/design.
paths:
  - "packages/ui/src/**/*.{ts,tsx}"
---

# Component conventions — naming · props/API · analysis · design

Applies to **authoring** components in `@chiselart/ui` (the ui-sdk design system)
and in the web-app. The stack is **Base UI** (`@base-ui/react`) under shadcn
tooling, **CVA** (`class-variance-authority`), **Tailwind v4**, **React 19**.
This rule is **research-grounded** — every convention below traces to an official
source (see Citations); it is not invented. It complements, and never repeats,
[design-system.md](design-system.md) (atomic layers, tokens, "don't re-chrome a
primitive", borders) and [nx-workspace.md](nx-workspace.md) (generators).

**Why this rule exists.** A component's *name* and its *prop signature* are a
public contract. The ecosystem is genuinely split between **flat PascalCase
exports** (Mantine/Chakra/MUI/React Aria → modifier-first names) and **namespaced
dot-notation** (Ant Design/Radix/Base UI → noun-first under a `Root`). We ship
**flat exports**, so the flat-library conventions apply — and that lane is
uniformly consistent. Picking names/props ad hoc (one `PasswordInput`, one
`InputPassword`, one `isOpen`, one `open`) fractures the contract exactly the way
an ad-hoc border or token does. Decide it once, here.

---

## 1. Naming

- **File = kebab-case, export = PascalCase, 1:1.** `input-otp.tsx` → `InputOTP`;
  `alert-dialog.tsx` → `AlertDialog`. This is the shadcn + Base UI norm. No
  `index.tsx` per component; the file is named for the component.
- **New variant components are modifier-first** — `<Modifier><Noun>`:
  `PasswordInput` (`password-input.tsx`), `SearchInput` (`search-input.tsx`),
  `NumberInput`. This is the dominant flat-export form (Mantine `PasswordInput`,
  Chakra `PasswordInput`, React Aria `SearchField`, shadcn community
  `password-input`). **Do NOT coin a noun-first variant name** (`input-password`,
  `input-search`).
- **Noun-first names are allowed ONLY when they preserve an inherited proper
  noun:** an upstream npm package name (`InputOTP` ← the `input-otp` package) or
  an established compound-noun term (`InputGroup` ← Bootstrap's `.input-group` /
  shadcn's own). These are not "a group/otp variant of input" — they are single
  established concepts. Keep them; **do not "fix" them backwards**, and do not
  cite them as precedent for naming a *new* variant noun-first.
- **Repo consequence:** the SDK's existing custom `input-search`/`InputSearch` is
  the outlier and is renamed to `search-input`/`SearchInput`. A new password
  field stays `password-input`/`PasswordInput`.
- **Compound parts** follow the primitive's existing part style. Our shadcn layer
  uses **flat prefixed exports**, not dot-notation: `Accordion`, `AccordionItem`,
  `AccordionTrigger`, `AccordionContent`; `InputGroup`, `InputGroupAddon`. Match
  that — don't introduce `Accordion.Item` dot-notation in a layer that exports
  flat.
- **Hooks** are `use-*.ts` → `useX`. **Pure logic / variants / types** are not
  components → they live in `lib/` per [design-system.md](design-system.md), not
  in the component file's export surface.

## 2. Props / public API

- **Boolean props are bare adjectives, camelCase, no `is`/`has` prefix:**
  `disabled`, `open`, `checked`, `loading`, `required`, `readOnly`. React follows
  HTML, which has no `is` prefix on boolean attributes. (`isOpen` is a *local
  state variable* name, never a *prop* name.) The only prefix is `default*` for
  an uncontrolled initial value.
- **Controlled/uncontrolled = the three-prop triad, names verbatim from Base UI /
  Radix.** Copy these exactly; do not improvise:
  | state | controlled | uncontrolled initial | change callback |
  |---|---|---|---|
  | selection/value | `value` | `defaultValue` | `onValueChange` |
  | open/closed | `open` | `defaultOpen` | `onOpenChange` |
  | checked | `checked` | `defaultChecked` | `onCheckedChange` |
  Uncontrolled by default (component owns state); controlled when `value` is
  passed. **Never let a prop flip controlled↔uncontrolled at runtime** (no
  `undefined`→defined `value`).
- **Event handlers:** native DOM events keep their React names verbatim
  (`onClick`, `onKeyDown`, `onFocus`, `onPointerDown`) — never rename to
  `onPress`. **Semantic state callbacks** are `on<Subject>Change` and fire with
  the **new value directly** (`(open: boolean)`), not a synthetic `Event`. That's
  why a Select uses `onValueChange`, not `onChange`.
- **Styling variants via CVA.** Expose `variant` / `size` (and `color`/`tone`
  only when a palette is needed) defined by `cva(base, { variants,
  defaultVariants, compoundVariants })`, typed via `VariantProps<typeof
  xVariants>`. `variant`/`size` ARE the styling contract — consumers pick a
  variant, they don't repaint via `className` (see design-system.md "don't
  re-chrome"). A new look = a new `variant` in the component file, shared by every
  call-site.
- **Don't restate what a variant already gives, and don't pin a label's width.**
  A `size` variant *is* the dimension contract — `size="sm"` already sets the
  height, so an extra `className="h-8"` is redundant noise that silently fights
  the next size bump. And never fix the width of a control whose text is copy
  (`className="w-40"` on a menu trigger): label and translation length are
  unknown, so size to content. `className` is for **placement** a surface needs
  (`ml-auto`, a gap, a `max-w-xs` on a filter input) — not for re-deriving a
  variant's own metrics.
- **Polymorphism = Base UI `render` prop (+ `useRender`).** To render as a
  different element or wrap with a custom component, use Base UI's `render`
  (`<Item render={<a href="…" />} />` or `render={(props, state) => …}`). **Do
  NOT use Radix `asChild`/`Slot` or MUI `component`/`slots`/`slotProps` for new
  SDK components.** (web-app's current `Slot`/`asChild` button is a *migration
  target* — replace with `render` when it lands in the SDK.) A consumer who
  composes via `render` must forward `ref` and spread `...props`, and owns that
  node's a11y — document this on the prop.
- **`className` / `...props` passthrough, always — onto the part's *primary*
  element.** Accept `className` and merge via `cn` (`twMerge(clsx(...))`) with
  `className` **last** so a consumer utility wins; spread `...props` onto that same
  primary element so arbitrary `aria-*` / `id` / `data-*` pass through. In Base UI,
  `className`/`style` may also be **functions of component state**. Each part of a
  compound forwards to **one** primary element (a nav's `Tabs`, a search's input);
  the **nested structure underneath is fixed identity** — don't expose `className`
  for every inner node, and don't apply the same `className` twice (wrapper *and*
  child). A part that takes a bespoke `{ className }` and never spreads `...props`
  while its siblings do is the inconsistency to fix.
- **A component owns no outer spacing or placement.** Internal *identity* layout
  is the component's (a grid's `grid-cols-8 gap-0.5`, a sticky header's own
  padding, an empty state's centering, a body size *variant*); **outer padding,
  margins, inter-part gaps, and where it sits are the consumer's** — set on the
  container they wrap it in, never frozen onto a part **and never hoisted onto a
  Root just to have somewhere to put it**. A picker that pads its own search box
  and nav can't be dropped in flush; ship structure, let the call-site space it.
  Size a scrollable body with a `size` *variant*, not a hardcoded `h-60`.
- **Refs = React 19 ref-as-prop.** Accept `ref` as a normal prop; **do not wrap
  new components in `forwardRef`** (deprecated path). `React.ComponentProps<"x">`
  already includes the right shape.
- **State is exposed as `data-*` attributes**, styled with Tailwind `data-[…]:`
  selectors — never a JS class toggle. Follow Base UI's **presence style**
  (`data-checked` / `data-unchecked` / `data-disabled` / `data-orientation`),
  which is what `useRender` emits (this differs from Radix's single
  `data-state="checked"`).
- **Accessibility props pass through; names are mandatory.** `...props` already
  forwards `aria-*`/`id` — never strip them. Every focusable/interactive element
  must have an accessible name; prefer **native `<label>`/visible text** →
  `aria-labelledby` → `aria-label`, with `aria-describedby` for supplementary
  text. Keep names brief and purpose-oriented.
- **No baked display copy — the consumer owns visible strings.** A reusable
  component ships **no** hardcoded visible text: button/menu *labels*, headings,
  empty-state text, status lines, placeholders are the consumer's copy, passed as
  `children` or a content slot — never a string literal frozen inside the
  component, and never an `i18n`/message layer the component invents to hold them.
  A baked "Toggle columns"/"View" can't be translated or rebranded and is exactly
  the heading shadcn's data-table does **not** package. The trigger of a
  disclosure is `children`; with none, fall back to an **icon only**, not an
  invented word. **Default only the *accessible name*** (an `aria-label` on an
  icon-only control), to English, overridable per call-site — that's a11y, not
  copy. This is why shadcn's data-table is a *recipe*: every visible string lives
  in the consumer's file, not in the part. **Override copy through composition,
  never a `labels`/messages config prop** — a `labels` object is just relocated
  baked copy. Expose an override sub-component that renders a sensible default and
  lets `children` replace it (shadcn `CommandEmpty`; e.g. `EmojiPickerEmpty`
  defaults to an `Empty` icon+title, `<EmojiPickerEmpty>…</EmojiPickerEmpty>`
  overrides it), and make a section title a heading *part* (`EmojiPickerGroupLabel`),
  not a string literal. A part's default copy lives as that part's own `children`
  default, not in a central config. Don't hand-roll a `<span class="text-sm
  text-muted-foreground">` for a state a primitive already owns (`Empty`,
  `Spinner`) — compose the primitive.
- **No app state, persistence, or side-effects in a presentational component.** A
  reusable component must not touch `localStorage` / `fetch` / timers or freeze a
  storage key — that breaks SSR-purity, can't be tested, and forces a policy onto
  every app. Take the data **in** as a controlled prop and report changes **out**
  via a callback (`frequent?: string[]` in, `onSelect` out); the consumer owns the
  state and its persistence. The component renders what it's given and stays pure.

## 3. Analyzing & designing a component

- **Classify the layer first** (atom/molecule/organism/template/page) per
  [design-system.md](design-system.md) — that rule owns Atomic Design; classify
  by *what the component is*, not build order.
- **Primitive vs composite vs feature-organism.** A **primitive** carries
  behavior + a11y and is app-agnostic, styled only with tokens (lives in
  `components/ui/*`, added via the shadcn CLI, keep its `variant`/`size` API). A
  **composite** composes primitives for a recurring *app-agnostic* pattern (e.g.
  a `ConfirmButton` = `Button` + `Dialog`). A component that knows app
  data/domain is a **feature organism**, not a design-system component — it stays
  in the app. (This is the [project_ui_sdk_migration] generic↔feature line.)
- **Anatomy: Root + parts vs single component.** Expose composable parts when the
  consumer legitimately reorders / wraps / restyles internals (accordion, dialog,
  menu, select). Expose a single configured component when the structure is fixed
  and only data/handlers vary (button, badge). Don't fragment a primitive into
  parts nobody recomposes.
- **Compound + shared context for a consumer-assembled recipe.** When the consumer
  wires the component around *their own* instance/state — a
  `@tanstack/react-table` table, a `react-hook-form` form — do **not** take that
  instance plus a pile of slots and booleans as props on one component. That
  config monolith is the anti-pattern. Expose a `Root` that puts the instance in
  React **Context** and composable parts (`Toolbar`, `View`, `ColumnHeader`,
  `Pagination`) that read it through a `useX()` hook which throws when used outside
  the `Root`. The consumer owns the wiring (`useReactTable`) and arranges the
  parts; the SDK ships the *parts*, not the whole — shadcn's data-table is a
  recipe, not a packaged component. (Use the single configured component only when
  structure is fixed and just data/handlers vary.)
- **Composition over configuration.** Prefer `children` / `render` / parts over a
  growing pile of booleans. The **third structural boolean** that toggles markup
  is the signal to split into a composition slot. `variant`/`size` stay props;
  *structural/element* variation goes through composition.
- **Controlled by need.** Ship uncontrolled-by-default, controllable on demand,
  decided per *piece* of state (§2 triad).
- **Accessibility-first, to the APG.** Before building, open the component type's
  **WAI-ARIA Authoring Practices** pattern and treat its roles / states /
  keyboard / focus list as acceptance criteria. Build on the headless primitive
  (it handles ARIA/roles/focus/keyboard); you still own accessible *names* and
  visible focus/contrast.
- **Props-vs-composition, in order:** (1) enumerable look/size → `variant`/`size`
  prop; (2) a single value/handler → a plain prop (the §2 triad, `disabled`);
  (3) different rendered element / wrap with own component → `render`
  (composition), not an `as`/`isLink` prop; (4) inject arbitrary markup / reorder
  → expose parts; (5) about to add the 3rd structural boolean → stop, split.

## Build what was asked — don't fabricate

Mirrors [design-system.md](design-system.md). Don't invent a name, prop, variant,
or part the spec didn't call for. When unsure, follow the **existing primitive's
shape** and the conventions above; if a convention here doesn't cover the case,
check the cited source for that library — don't guess.

<!-- Sources — kept in-file at zero load cost (block HTML comments are stripped
before injection, and remain visible when the file is opened with Read):

## Citations

Naming — Base UI overview <https://base-ui.com/react/overview/quick-start>;
shadcn Input OTP <https://ui.shadcn.com/docs/components/radix/input-otp> + Input
Group <https://ui.shadcn.com/docs/components/radix/input-group>; npm `input-otp`
<https://www.npmjs.com/package/input-otp>; Mantine PasswordInput
<https://mantine.dev/core/password-input/>; Chakra PasswordInput
<https://chakra-ui.com/docs/components/password-input>; Ant `Input.Password`
<https://ant.design/components/input/>; React Aria SearchField
<https://react-aria.adobe.com/SearchField>; Radix Accordion (namespaced)
<https://www.radix-ui.com/primitives/docs/components/accordion>.

Props/API — Base UI styling/data-attrs
<https://base-ui.com/react/handbook/styling>, `useRender`/`render`
<https://base-ui.com/react/utils/use-render>, Switch
<https://base-ui.com/react/components/switch>, Select
<https://base-ui.com/react/components/select>; Radix composition (`asChild`)
<https://www.radix-ui.com/primitives/docs/guides/composition>; shadcn Button
(CVA + cn) <https://ui.shadcn.com/docs/components/button>; CVA
<https://cva.style/docs>; React 19 ref-as-prop
<https://react.dev/blog/2024/12/05/react-19>; React `<input>` boolean props
<https://react.dev/reference/react-dom/components/input>; MUI composition
<https://mui.com/material-ui/guides/composition/>; WAI-ARIA APG names
<https://www.w3.org/WAI/ARIA/apg/practices/names-and-descriptions/>; shadcn Data
Table — "a guide on how to build your own", consumer owns all copy
<https://ui.shadcn.com/docs/components/data-table>; shadcn Command
(`CommandEmpty` override-via-children) <https://ui.shadcn.com/docs/components/command>;
React keeping components pure <https://react.dev/learn/keeping-components-pure>.

Analysis/design — Atomic Design ch.2
<https://atomicdesign.bradfrost.com/chapter-2/>; Base UI composition
<https://base-ui.com/react/handbook/composition> + accessibility
<https://base-ui.com/react/overview/accessibility>; Radix intro
<https://www.radix-ui.com/primitives/docs/overview/introduction>; shadcn docs
<https://ui.shadcn.com/docs>; React passing props
<https://react.dev/learn/passing-props-to-a-component> + sharing state
<https://react.dev/learn/sharing-state-between-components> + Context for compound
parts <https://react.dev/reference/react/createContext>; shadcn Data Table recipe
<https://ui.shadcn.com/docs/components/data-table>; WAI-ARIA APG
<https://www.w3.org/WAI/ARIA/apg/>.
-->
