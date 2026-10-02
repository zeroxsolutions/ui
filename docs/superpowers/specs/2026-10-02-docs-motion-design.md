# Spec (c5): motion on the docs site

Date: 2026-10-02. Follows spec (c4) (`2026-10-01-component-docs-design.md`). The rules of spec (c2)
(`2026-09-30-rebuild-on-nova-design.md`) hold for everything this spec touches.

## Why

The docs site has no motion of its own. Pages swap in place, "View code" snaps open, a Command/Manual
tab switch and a copy click change instantly, and the home page arrives all at once. The only motion
is what base-nova's primitives carry (the mobile nav's Sheet, the search dialog, the tab indicator)
and the home page's shader.

## Scope

Motion on the site's own shell, in `apps/registry-ui/src/`. The components and blocks the registry
publishes keep their motion as it is; the ones that fall short of the registry's requirements are
spec (c6). The one exception is the copy feedback below, because the site's copy buttons are the
registry's own `CopyButton` (directly, and inside `CodeBlockCopy`).

## Timing

base-nova's own values, with no house tokens: 200ms `ease-out` for anything that opens, moves or
swaps, 100ms where nova uses it for small state changes. `motion/react` uses the same numbers, so
both engines keep one rhythm with the primitives.

Under `prefers-reduced-motion: reduce` every motion below is off and every state still changes:
`motion-reduce:` utilities in CSS, an `@media (prefers-reduced-motion: reduce)` rule that turns off
the view-transition animations, and `useReducedMotion` skipping the grid's animation.

## The motions

1. **Page change.** The docs page's content column is wrapped in React's `<ViewTransition>`
   (exported by the React canary Next 16.3.7 bundles; no `next.config` flag). Route navigations are
   transitions, so moving to another page crossfades the column. The root's default animation is
   turned off, so the header, sidebar and TOC hold still. A hash link (a TOC entry) is not a route
   change and runs nothing. A browser without the View Transitions API changes page as it does today.
2. **Sidebar active item.** The active `SidebarMenuButton` sits in a `<ViewTransition>` with one
   shared name, so on a page change the highlight morphs from the old item to the new one. nova's
   active style is left as it comes; the morph moves it.
3. **TOC marker.** A single marker beside the TOC, positioned at the active entry (`top` and
   `height`), with `transition-[top,height]`. The active entry changes on scroll, which is not a
   transition, so this is CSS.
4. **View code.** The source panel animates its height the way nova animates Accordion, on Base UI's
   variable: `h-(--collapsible-panel-height)` and a height transition. It starts and ends at the
   excerpt's height (under `data-starting-style` and `data-ending-style`) rather than at 0, so the
   excerpt hands over to the panel in place and the block never jumps; the excerpt takes the panel's
   place once it has shrunk to the excerpt's height.
   (tw-animate-css's `collapsible-down/up` keyframes read Radix, Bits and Reka variables, not Base
   UI's, so they are not used.)
5. **Command/Manual tabs.** The shown panel enters with `animate-in fade-in-0`. A panel that turns
   from hidden to shown restarts its animation, so no JS is needed.
6. **Copy.** `CopyButton`'s check icon enters with `animate-in zoom-in` when the copied state shows
   it. This is the one registry change, in the item, so every consumer gets it, the code blocks'
   `CodeBlockCopy` included.
7. **Home page.** The heading, the lead and the actions arrive in sequence by CSS (`animate-in` with
   staggered delays), which runs before hydration and needs no JS. The component grid's cells arrive
   in sequence as they scroll into view, about 30ms apart, with `motion`'s smallest entry
   (`motion/react-mini`'s `useAnimate` with `useInView`), in the home page's own chunk only. Nothing
   is hidden before hydration: a cell already on screen when the page hydrates is never hidden, and
   only cells below the fold take the hidden start state. The shader is unchanged.

## Checks

**Unit (behaviour only).** A closed "View code" panel stays in the DOM for its 200ms exit, so a spec
that expects it gone waits (`findBy`, `waitFor`) rather than turning motion off. No case asserts a class.
jsdom has no layout, so the TOC marker's position is checked in the e2e: it follows the active
entry when the entry changes.

**E2e (one case for motion).** Each interaction once, in normal motion: a sidebar navigation, opening
and closing "View code", a tab switch, a copy click, loading the home page and scrolling its grid.
Each reaches its end state with no console error: the URL and heading change, a closed panel leaves
the DOM, the tab content changes, no grid cell is left at `opacity: 0`. The same run again with
`reducedMotion: 'reduce'`.

**Visual.** For each motion, a PNG strip of frames at 0, 50, 100, 150 and 200ms, in the session
scratchpad, for the user to review.

**Size.** `wrangler deploy --dry-run --env production` before and after; AGENTS.md's figure is
updated with the new number. `motion` appears in the home page's chunk only.

**Risks the plan answers.** `@types/react` may not type `ViewTransition`: a minimal declaration, not
a React version change. A long grid with `whileInView`: no cell may stay hidden if its observer never
fires.

## Out of scope

- Motion inside registry components and blocks, apart from the copy icon.
- Fixing the components and blocks that do not meet the registry's requirements: spec (c6).
- shadcn primitives.
- The deploy.
