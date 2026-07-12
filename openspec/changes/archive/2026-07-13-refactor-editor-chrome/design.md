## Context

The editor's UI lives in `packages/editor/src/document/ui/` (chrome) and inside
each `document/features/*` (per-feature UIs and node views). Chrome already
imports `@zeroxsolutions/ui` atoms, but the composition is uneven:

| Surface | Design-system used | Bespoke / re-implemented |
| --- | --- | --- |
| `editor-toolbar.tsx` | `Button`, `Separator` | container `<div role=toolbar>`, `title` attr (no `tooltip`), pressed via `Button+aria-pressed` |
| `bubble-menu.tsx` | `Button` | floating `<div fixed>` + `top-44` math, `title` attr, no `toggle-group` |
| `block-menu.tsx` | `Popover`, `Button`, `Separator` | hand-styled `⋮⋮` trigger, `<span contents>` separator hack |
| `slash-menu.tsx` | **none** | entire popup `<div>` + `<button>` rows + grouping + filtering + keyboard nav + **viewport clamp/flip** |

Two enabling facts discovered during exploration:

- The design system's `Popover` is built on `@base-ui/react`; its `Positioner`
  accepts `anchor: Element | VirtualElement | RefObject | (() => …)`, where a
  `VirtualElement` is `{ getBoundingClientRect() }`. A caret/selection rect is a
  valid virtual anchor — so Base UI's positioning (side/align/collision-avoidance)
  replaces the slash menu's hand-rolled clamp/flip.
- The design system's `command` (cmdk) exposes `CommandList/CommandGroup/
  CommandItem/CommandEmpty` and supports headless use (`shouldFilter={false}` +
  controlled `value`) — so the list renders from cmdk while external code (the
  editor keeps focus) still owns the keys.

The governing rule `ui-from-design-system` is scoped to "a frontend app" /
"every screen" and its bespoke boundary is too weak; it is one of the **generic
rules synced from the origin `classify` repo**, so any amend must stay
project-agnostic.

## Goals / Non-Goals

**Goals:**

- Recompose the editor's UI surfaces from the design system, deleting hand-rolled
  look-alikes (especially the slash menu's custom popup + positioning).
- Extract **one** shared floating-shell primitive so the popover surface look is
  declared once.
- Amend `ui-from-design-system` (replace body) to cover UI libraries and to
  define the exact bespoke boundary — generic, no project/component names.
- Preserve every observable behavior and keep the engine-free `.d.ts` boundary.

**Non-Goals:**

- Syncing the amended rule to `classify` (user handles separately; no tooling here).
- Executing Phases 2–3 in this cycle (tasked, may apply separately).
- Changing the `IEditor` façade, the engine-hiding boundary, or adding a UI dep.

## Decisions

### D1 — Floating menus keep a bespoke position:fixed shell (revised at apply)

**Revised from "anchor via the DS `Popover`".** The DS `Popover` (Base UI) brings
focus management (initial focus, dismiss, `modal`) because it is a dialog-class
popover — but the slash/bubble menus **must not take focus**: the `/query` is typed
into the editor, which owns the caret. A DS `Popover` would fight that. Both menus
therefore qualify for the amended rule's sanctioned bespoke shell on **two**
counts — anchored to a **coordinate/virtual point** (the caret/selection rect, no
DOM trigger) **and** **keyboard focus owned by another component** (the editor). So
the shell stays a `position: fixed` surface that keeps the already-proven
clamp/flip positioning; only its *duplication* is removed (D3). The façade's
`caretRect()` / selection-rect helpers are unchanged — no new engine surface, no DS
`Popover` patch, no focus-trap risk.

### D2 — The slash list renders from design-system presentational components

The editor owns keyboard and selection entirely (the `/query` lives in the
document, not a `CommandInput`), so the list uses the design system's **headless
presentational** components — `Item`/`ItemMedia`/`ItemContent`/`ItemTitle`/
`ItemDescription` for rows, `Empty` for the no-match state, `ScrollArea` for
overflow — rather than `Command` (cmdk), whose selection model is focus/`value`
driven and would fight the editor's ownership. External filtering
(`filterSlashItems`/`groupByHeading`), external keyboard nav, and the inline
`/query` highlight + ghost via `setSlashDecoration` all stay exactly as they are —
the sanctioned "foreign focus ownership" exception. This resolves design Open
Question #1 in favor of `item`+`empty`+`scroll-area`.

### D3 — One shared floating-shell primitive

Extract `document/ui/floating-shell.tsx`: the one **sanctioned bespoke shell** — a
`position: fixed`, non-focus-owning surface that (a) carries the design-system
surface tokens (`bg-popover text-popover-foreground border shadow-md`,
`animate-in`) **declared once**, and (b) owns the viewport clamp/flip positioning
from a supplied rect. Slash and bubble consume it (their duplicated `bg-popover
border shadow` containers are deleted). Per the amended rule, one shared shell may
carry the surface tokens (it is the sanctioned positioning primitive); what is
forbidden is each surface re-declaring the look. Block menu is click-opened from a
DOM handle (not editor-focus-bound), so it uses the DS `DropdownMenu` directly (its
own trigger/positioning, no focus conflict) rather than this shell.

### D4 — Pressed/hint states are design-system components

Toolbar + bubble formatting buttons become `Toggle`/`ToggleGroup` (native pressed
semantics) wrapped in `Tooltip` (replacing the raw `title`). Slash/menu rows use
`item`; the "No matching blocks" state uses `empty`; long lists use `scroll-area`.

### D5 — Rule amend (replace `ui-from-design-system` body, generic)

Retitle "Every Screen" → "Every UI Surface"; broaden scope to "any workspace code
that renders UI — a frontend app **or** a publishable UI library / composite
component"; add the **compose-don't-reimplement** paragraph with the two
mechanism exceptions (coordinate/virtual anchor; foreign keyboard-focus
ownership); keep the stylesheet-through-Tailwind, emoji, no-competing-library, and
token guidance verbatim. No project or component name appears, so it is safe to
mirror to `classify`. The full replacement text is the reference draft agreed in
exploration; `tasks.md` applies it.

### D6 — Phasing

Phase 1 (chrome) is committed. Phase 2 (per-feature UIs) and Phase 3 (node-view
shells) are tasked but gated — Phase 3 behind the D-R1 spike. The
`editor-ui-composition` spec governs all three regardless of when they land.

### D7 — Phase 2 scope corrected to the surfaces that actually exist (revised at apply)

An apply-time survey of the feature files found the originally-tasked Phase 2
targets did not match the code. Only **`image`**, **`embed`**, and **`code-block`**
render hand-rolled UI that duplicates a design-system component. **`link`** renders
no UI (a `BubbleItem` marker; the href popover is chrome-owned and does not exist
yet), **`table`** renders no UI (its column/row menus and column-resize are
`TableKit`-engine-owned), and **`mention`** is a static inline `@label` chip whose
`@`-typeahead is chrome/out-of-scope. Per the `editor-ui-composition` requirement
("no re-implementation of a component the design system already ships"), those three
are **already compliant** — there is nothing to recompose — so building new
popover/menu/typeahead surfaces for them is *new-feature* work outside this refactor,
not part of it. Phase 2 therefore recomposes exactly the three real targets, and —
because the feature specs are codec-only (no UI regression net) — each recompose
adds a co-located view render test. Two apply-time constraints carried over from the
node-view context: (a) the DS `Popover`/`LanguageSwitcher` inside a node view keeps a
pointer-down/mouse-down guard so opening it doesn't move ProseMirror selection; (b)
`sonner` is not adopted for the code-block copy toast — a `Toaster` mount is an
app-level concern, so the self-contained Copy→Copied flip stays.

### Surface → component target (the refactor's map)

| Surface | Target composition |
| --- | --- |
| slash-menu | `Popover`(virtual anchor) + headless `Command`/`CommandGroup`/`CommandItem`/`CommandEmpty` + `scroll-area`; external keys/decoration retained |
| bubble-menu | shared floating-shell + `ToggleGroup`/`Toggle` + `Tooltip` |
| editor-toolbar | `ToggleGroup`/`Toggle` + `Tooltip` + `button-group` |
| block-menu | `DropdownMenu`/`ContextMenu` + `Tooltip` on the handle |
| image (P2) | DS `Button` (trigger) + `Popover`/`PopoverContent` + `Field`/`FieldLabel` + `Input` — replaces the hand-rolled `bg-popover` edit panel + raw `<input>`s |
| embed (P2) | DS `Input` — replaces the raw `<input type=url>` + hand-rolled focus-ring |
| code-block (P2) | Copy → DS `Button`; language picker already DS `LanguageSwitcher` (kept, not downgraded to a bare `combobox`); no `sonner`/`kbd` |
| link / mention / table (P2) | **N/A** — no hand-rolled surface (bubble-item marker / static chip / engine-owned menus+resize); compliant as-is (D7) |
| callout (P3) | `alert` (keep FluentEmoji icon) — behind spike |
| toggle (P3) | `collapsible` — behind spike |

## Risks / Trade-offs

- **Node-view engine compatibility (highest risk)** — callout/toggle render inside
  a ProseMirror `NodeViewContent`; a design-system `Alert`/`Collapsible` may not
  host editable content cleanly. Mitigation: D-R1 spike gates Phase 3; failing the
  spike keeps the bespoke shell as a documented exception (per the spec).
- **cmdk focus model** — headless `Command` must not steal focus from the editor;
  needs `shouldFilter={false}` + controlled value + no auto-focused input. Verify
  the design-system `Command` allows an input-less list; if not, use `item`+
  `scroll-area` directly (still design-system, satisfies the spec).
- **Positioning parity** — Base UI collision handling must reproduce the current
  flip-above-near-bottom behavior; verify against the existing viewport probe.
- **Bundle** — cmdk/tooltip are already in the design system and the editor already
  depends on it; net change is small and offset by deleted custom code.
- **Rule sync drift** — amending here diverges from `classify` until the user
  mirrors it; accepted, flagged as a non-goal.

## State Model

The slash menu's observable states are unchanged by the refactor and remain the
non-regression target:

```
closed ──(triggerQuery '/' matches)──▶ open@anchor ──(filter)──▶ open (highlight tracks list)
   ▲                                        │  │
   └────(Esc / no trigger / select)─────────┘  └──(select ⇒ deleteRange + run command)──▶ closed
```

Anchor recomputes on selection/scroll/resize; only the *positioning owner* changes
(custom math → virtual anchor), not the states.

## Migration Plan

1. Land the spec + rule amend first (the contract).
2. Phase 1 per surface, one commit each, `chrome.spec.tsx` extended/kept green
   before moving on: slash → bubble → toolbar → block (or shared-shell first).
3. Re-run the browser probes (positioning, trigger, bubble, keyboard) used in
   prior verification as the non-regression check.
4. Phase 2 surfaces feature-by-feature; Phase 3 only after the D-R1 spike.
5. No flag/rollback needed — each surface swap is self-contained and behind the
   green gate; revert is per-commit.

## Open Questions

- ~~`Command` input-less vs `item`+`scroll-area`?~~ **Resolved (Phase 1):**
  `item`+`empty`+`scroll-area`. cmdk's selection is focus/`value`-driven and fights
  the editor's focus ownership; the presentational `Item`/`Empty`/`ScrollArea`
  compose cleanly while the editor keeps the keyboard. See D2.
- ~~Shell wraps `Popover` vs thin token-styled surface?~~ **Resolved (Phase 1):**
  thin bespoke `position: fixed` surface. The DS `Popover` brings focus management
  that fights the editor's caret ownership. See D1/D3.
- ~~Block menu: `DropdownMenu` vs `Popover`?~~ **Resolved (Phase 1):** `DropdownMenu`
  (a menu of actions is semantically a dropdown; DOM-triggered from the handle, no
  focus conflict).
- **Residual (Phase 1):** `editor-toolbar` is a *docked* bar (not a floating menu),
  so it carries its own `bg-popover border shadow-sm` surface rather than the
  floating-shell. This is a distinct surface, not a re-declared popover look — but
  if a DS "toolbar/surface" primitive is preferred later, revisit.
- **Deferred:** `BlockMenu` has no Storybook/unit coverage (pre-existing) — it is
  compile-checked only; add a story/test when Phase 2 touches block actions.
