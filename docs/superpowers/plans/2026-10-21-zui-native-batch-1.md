# zui native: the first batch of components in Vega Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `@zui/separator`, `skeleton`, `label`, `badge`, `card`, `avatar`, `progress`, `input`, `textarea`,
`switch`, `checkbox`, `radio-group`, `toggle`, `toggle-group` and `tabs` install into an Expo app on either
engine, drawn in Vega with their states (checked, pressed, selected, invalid, sizes) intact.

**Architecture:** Vega draws a state through a modifier on the slot (`data-checked:bg-primary`,
`aria-pressed:bg-muted`, `data-[size=sm]:h-[14px]`, `group-data-[size=sm]/switch:size-3`). On React Native
no element carries those attributes, so the translator today drops every such class, silently. This plan
adds state tokens: the source writes `cn-switch@checked` beside `cn-switch`, the emitter replaces it with
the classes Vega puts behind that state, with the modifier removed, and the component applies the token
when its own state holds. Components are written by zui on `@rn-primitives/*` for behaviour and
accessibility (no RNR file copied).

**Tech Stack:** as plans 2-3; `@rn-primitives/{avatar,checkbox,label,progress,radio-group,separator,switch,tabs,toggle,toggle-group}`
at the version `@rn-primitives/slot` already uses.

**Spec:** `docs/superpowers/specs/2026-10-21-zui-native-registry-design.md` ("The RN registry", "First
items"). Plan 4 of the native work (zui-cli moves to plan 5, the preview app to plan 6).

## Global Constraints

- Everything in plans 2 and 3's Global Constraints holds.
- A class Vega puts behind a state is never dropped in silence: it maps to a state token, or the slot's
  translation reports it unknown. Only the modifiers on today's dropped list for which no touch state
  exists (`hover`, `focus-visible` rings, `has-*` layout selectors, `*:`/`[&...]` descendant selectors,
  `supports-*`, `print`) stay dropped, and each one dropped is named in the list, not matched by a broad
  `data-`/`aria-`/`group-` pattern.
- State names, one vocabulary for every component: `checked`, `unchecked`, `pressed`, `selected`,
  `invalid`, `disabled`, `focused`, and `<prop>=<value>` for a variant on the part or its group
  (`size=sm`, `variant=line`, `orientation=vertical`, `spacing=0`).
- Base UI slots, never the `-aria` (Radix) ones.
- Each item's dependencies name the `@rn-primitives/*` package it uses; `registryDependencies` name the
  zui items it imports.

## Review Focus

1. A state with no token: a Switch that is on must draw `bg-primary`, a Checkbox checked `bg-primary` with
   its check mark, a Toggle pressed `bg-muted`, a Tabs trigger selected its active background. Each
   component spec renders the state and asserts the class (Tasks 3-6).
2. A compound state: Switch thumb's `group-data-[size=sm]/switch:data-checked:translate-x-[...]` needs
   size and checked together; the token for both (`@size=sm+checked`) exists and the thumb moves (Task 1,
   Task 5).
3. `dark:` behind a state (`dark:data-checked:bg-primary`) keeps `dark:` after the state is removed (Task 1).
4. An `arbitrary` value React Native cannot compute (`translate-x-[calc(100%-2px)]`): the build reports it
   or the translator maps it to a value both engines compute; it never ships a class that draws nothing
   (Task 1).
5. Input focus: `focus-visible:border-ring` becomes the focused state of `TextInput`, which both engines
   style through `focus:`; an Input that has focus draws `border-ring` (Task 4).

---

### Task 1: state tokens

Skills: `writing-unit-tests`, `naming-a-declaration`, `declaring-a-type`, `writing-comments`.

**Files:** Modify `src/build/translate.ts`, `translate.spec.ts`, `src/build/emit.ts`, `emit.spec.ts`.

**Interfaces:**

- Produces: `translateClasses(classes, engine, part, state?)` where `state` is a `StateKey` (sorted, `+`
  joined, e.g. `checked`, `size=sm+checked`); with a state it returns only the classes Vega puts behind
  exactly that state, modifiers removed, `dark:` kept. Token form in source: `cn-<slot>@<state>` and
  `cn-<slot>/text@<state>` (and `/icon@`).
- Modifier to state, as data: `data-checked`, `aria-checked` -> `checked`; `data-unchecked` -> `unchecked`;
  `aria-pressed`, `data-[state=on]`, `data-pressed` -> `pressed`; `data-active`, `data-selected`,
  `data-[active=true]` -> `selected`; `aria-invalid`, `data-invalid` -> `invalid`; `data-disabled`,
  `group-data-[disabled=true]` -> `disabled`; `focus-visible` on a `border-*`/`bg-*` class -> `focused`;
  `data-[k=v]` and `group-data-[k=v]/<group>` -> `k=v`; `group-data-<k>/<group>` (bare) -> `orientation=<k>`
  for `horizontal`/`vertical`.

- [ ] **Step 1: Tests first.** For Vega's `cn-switch`: no state -> `shrink-0 rounded-full border
      border-transparent` (+ shadow per engine); `checked` -> `bg-primary`; `unchecked` -> `bg-input
      dark:bg-input/80`; `size=default` -> `h-[18.4px] w-[32px]`. `cn-switch-thumb` `size=sm+checked` ->
      the translate class or its reported unknown (Review Focus 4: decide by testing what NativeWind and
      Uniwind compute; prefer a computed px value such as `translate-x-[10px]` for size sm, derived from the
      slot's own sizes, ledgered as a ruling). `cn-checkbox` `checked` -> `bg-primary text-primary-foreground
      border-primary dark:bg-primary`. Emit: a source with `cn-switch@checked` gets those classes; an unknown
      state (`@cheked`) throws `Unknown state cheked for cn-switch in <file>`; a state token whose
      translation is empty throws `Empty state <state> for <slot> in <file>`, so a typo cannot ship as
      nothing.
- [ ] **Step 2:** Run focused tests; expected FAIL.
- [ ] **Step 3:** Implement. Replace the broad `/^data-/`, `/^aria-/`, `/^group-/`, `/^not-/` drops with the
      state table plus an explicit list of dropped modifiers; anything else goes to `unknown`. Re-run
      `build-registry` for text/icon/button/theme: still valid, no change in their emitted classes except
      where a state token is now required (none expected; if Button loses a class, add the token in source).
- [ ] **Step 4:** Run the project's tests and `build-registry`; expected PASS, "Registry is valid." twice.
- [ ] **Step 5:** Commit: `feat(registry-native): carry vega's states as tokens`.

### Task 2: Separator, Skeleton, Label, Badge, Card

Skills: `writing-a-component`, `writing-component-tests`, `declaring-a-dependency`, `writing-comments`.

**Files:** Create `src/registry/ui/{separator,skeleton,label,badge,card}.tsx` and specs; modify
`registry.json`.

- Separator on `@rn-primitives/separator` (`orientation`, `decorative`), Label on `@rn-primitives/label`,
  Badge with Vega's variants (`default`, `secondary`, `destructive`, `outline`, `ghost`, `link`) and its text
  through `TextClassContext`, Card as `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`,
  `CardFooter` (title and description are Text), Skeleton a View with Vega's pulse class (`animate-pulse`
  if both engines run it, else a reanimated opacity loop; ledger which).
- [ ] **Step 1: Tests first** per component: renders with the slot's classes (assert one class Vega fixes per
      slot, e.g. Card `rounded-xl`, Badge default `bg-primary`), variants switch classes, Separator vertical
      takes the vertical slot, Label pressed focuses its `nativeID` target where the primitive supports it.
- [ ] **Step 2:** Run; FAIL. **Step 3:** Implement. **Step 4:** Tests and `build-registry` PASS.
- [ ] **Step 5:** Commit: `feat(registry-native): add separator, skeleton, label, badge and card`.

### Task 3: Avatar, Progress

Skills: as Task 2.

- Avatar (`Avatar`, `AvatarImage`, `AvatarFallback`, `size` `sm|default|lg` through the `size=` state) on
  `@rn-primitives/avatar`; Progress on `@rn-primitives/progress` with `value` 0-100 setting the indicator's
  width (style, not a class) and `accessibilityValue`.
- [ ] Tests first: fallback shows until the image loads (primitive's status), size sm takes Vega's sm
      classes; Progress 40 sets the indicator to 40% and announces `now: 40`. Then FAIL, implement, PASS,
      commit `feat(registry-native): add avatar and progress`.

### Task 4: Input, Textarea

Skills: as Task 2, plus `writing-a-form` (for what an input announces).

- On `TextInput`; `placeholderTextColor` from the theme's muted-foreground through the engine's own mapping
  (NativeWind `placeholderClassName`/`cssInterop`, Uniwind's prop mapping; read each engine's docs);
  `editable={false}` takes the `disabled` state; `aria-invalid` prop takes `invalid`; focus takes `focused`
  (Review Focus 5) through the engines' `focus:` support or component state.
- [ ] Tests first: focused Input carries `border-ring`; invalid carries `border-destructive`; Textarea is
      `multiline` with Vega's min height; disabled is not editable. FAIL, implement, PASS, commit
      `feat(registry-native): add input and textarea`.

### Task 5: Switch, Checkbox, Radio Group

Skills: as Task 2.

- On `@rn-primitives/switch`, `checkbox`, `radio-group`; check mark and radio dot as `Icon` (lucide
  `Check`, a filled circle View for radio). States through tokens (`checked`, `unchecked`, `size=`,
  `disabled`, `invalid`).
- [ ] Tests first: pressing toggles `checked` and fires `onCheckedChange`; checked draws `bg-primary`; the
      thumb takes the compound token; disabled ignores presses and announces `disabled`; radio group selects
      one value. FAIL, implement, PASS, commit `feat(registry-native): add switch, checkbox and radio group`.

### Task 6: Toggle, Toggle Group, Tabs

Skills: as Task 2.

- On `@rn-primitives/toggle`, `toggle-group`, `tabs`. Toggle variants and sizes through Vega's
  `cn-toggle-variant-*`/`cn-toggle-size-*` slots; pressed through `pressed`. Tabs list variants `default`
  and `line` through `variant=`; the selected trigger through `selected`.
- [ ] Tests first: Toggle pressed draws `bg-muted` and announces `selected`; Toggle Group single mode keeps
      one pressed; Tabs shows the selected content only and its trigger takes the selected classes. FAIL,
      implement, PASS, commit `feat(registry-native): add toggle, toggle group and tabs`.

### Task 7: docs pages and the registry e2e

Skills: `writing-prose`, `cutting-ai-tells`, `writing-plain-ascii`, `writing-e2e-tests`.

- One page per new item under `content/docs/native/`, in the shape of plan 3's item pages (install command,
  what lands, props from the source, one usage block), listed in `native/meta.json`; the native index's item
  list updated. The registry e2e's native test lists the new items in each engine's index.
- [ ] e2e first (index lists `switch` and `tabs` per engine; sidebar lists Switch), FAIL, write, PASS; run
      the docs/search/sitemap/llms/registry specs; commit `docs(registry-ui): document the first native batch`.

### Task 8: install check

No repo changes. As plan 3 Task 3, in fresh apps per engine: `add @zui/theme` then every new item; `tsc
--noEmit`; `expo export` iOS and Android; in the bundle, the checked Switch, Checkbox and selected Tabs
classes resolve to RN colours; record what only a device shows.
