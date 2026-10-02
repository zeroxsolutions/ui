# Docs Motion (c5) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The docs site moves: pages crossfade, the sidebar's active item morphs, the TOC marker slides, "View code" opens in place, tabs and copy feedback ease in, and the home page arrives in sequence, all off under reduced motion.

**Architecture:** Route-level motion uses React's `<ViewTransition>` (Next 16.3.7's bundled React canary exports it) with the animation timing in `src/app/global.css`. In-page motion is CSS: Base UI's `data-starting-style`/`data-ending-style` and `--collapsible-panel-height`, tw-animate-css's `animate-in` utilities, and a positioned TOC marker. Only the home grid uses JS, through `motion/react-mini`'s `useAnimate` in one client component. The site's code is in `apps/registry-ui/src/`; the only registry change is `CopyButton`'s check icon.

**Tech Stack:** Next 16.3.7 (App Router, React canary), Tailwind v4 + tw-animate-css 1.4.0, Base UI, motion 12 (`motion/react-mini`, `motion/react`), vitest, Playwright on the worker (port 8787), nx, pnpm.

**Spec:** `docs/superpowers/specs/2026-10-02-docs-motion-design.md`

## Global Constraints

- Timing is base-nova's: 200ms `ease-out` for anything that opens, moves or swaps; 100ms only where nova uses it. No house motion tokens, no new CSS variables of our own.
- Under `prefers-reduced-motion: reduce` every motion is off and every state still changes: `motion-reduce:` utilities, one `@media (prefers-reduced-motion: reduce)` rule for view transitions, `useReducedMotion` for the grid.
- Nothing is hidden before hydration. A JS failure never leaves content invisible.
- Primitives under `registry/bases/base-ui/ui/` are never edited. Registry items stay as they are apart from `CopyButton`'s check icon.
- Tests cover behaviour only; no case asserts a class name.
- Every part carries its own `data-slot`; copy is sentence case; plain ASCII.
- Load the governing gundam skill with the Skill tool before writing each file (`writing-a-component` for components, `writing-comments` for comments, `writing-unit-tests`, `writing-e2e-tests`, `writing-prose` for docs, `landing-a-change` for commits). Never `--no-verify`. Port 3000 is the user's `next dev`; the e2e uses 8787; stop any worker you start.

## Review Focus

- A view transition that also animates the header, sidebar or TOC (the root snapshot left on): the frame strips in Task 6 show it; the e2e cannot.
- A hash link in the TOC starting a view transition: Task 5's e2e clicks a TOC entry and asserts the URL hash changes with no console error; the strip review checks nothing animates.
- A grid cell stuck at `opacity: 0` (its observer never fires, or JS fails after the hidden start state): Task 5's e2e scrolls the whole grid and asserts every cell's opacity reaches 1, in both motion modes.
- "View code" jumping when the excerpt hands over to the panel: the frame strip for it in Task 6 is read frame by frame.
- `ViewTransition` missing from the React types: Task 1 Step 1 typechecks before anything uses it.

---

### Task 1: Page crossfade and the sidebar's active morph

**Files:**

- Create: `apps/registry-ui/src/types/react-canary.d.ts` (only if Step 1 shows `ViewTransition` untyped)
- Modify: `apps/registry-ui/src/app/global.css`
- Modify: `apps/registry-ui/src/app/(app)/docs/[[...slug]]/page.tsx`
- Modify: `apps/registry-ui/src/components/navigation/docs-sidebar.tsx`

**Interfaces:**

- Produces: view-transition names `docs-content` and `docs-sidebar-active`, and the global CSS that times them.

- [ ] **Step 0: Measure the worker before any change**

Run: `cd apps/registry-ui && pnpm exec wrangler deploy --dry-run --env production 2>&1 | grep -i 'gzip'`
Write the number into the task report; Task 6 compares against it.

- [ ] **Step 1: Make `ViewTransition` importable and typed**

`@types/react` 19.2.17 declares `ViewTransition` in `canary.d.ts`, which is not loaded by default. Write a probe line `import { ViewTransition } from 'react';` in `page.tsx` and run `pnpm nx run @zeroxsolutions/registry-ui:typecheck`. If it fails with "has no exported member", create:

```ts
// apps/registry-ui/src/types/react-canary.d.ts
// The App Router renders with the React canary Next bundles, which exports ViewTransition; the
// stable type entry does not declare it, so the canary types are loaded beside it.
/// <reference types="react/canary" />
```

and typecheck again until it passes. Confirm at runtime that `react` resolves to Next's bundled canary for app code (`exports.ViewTransition` is in `next/dist/compiled/react/cjs/react.production.js`).

- [ ] **Step 2: Time the transitions in CSS**

Append to `src/app/global.css`:

```css
/* Route changes crossfade the docs column alone: the root snapshot is held still, so the header,
   sidebar and TOC do not fade with it. Timing is nova's. */
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
}

::view-transition-group(docs-content),
::view-transition-old(docs-content),
::view-transition-new(docs-content),
::view-transition-group(docs-sidebar-active),
::view-transition-old(docs-sidebar-active),
::view-transition-new(docs-sidebar-active) {
  animation-duration: 200ms;
  animation-timing-function: ease-out;
}

@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation: none !important;
  }
}
```

- [ ] **Step 3: Wrap the docs column**

In `page.tsx`, import `ViewTransition` from `react` and wrap the content column (the `div` holding the title, `<Body>` and `<DocsPager>`, not the TOC column) so the `ViewTransition`'s only child is that `div`:

```tsx
<ViewTransition name="docs-content">
  <div className="mx-auto flex w-full max-w-160 min-w-0 flex-1 flex-col gap-6 px-4 py-6 md:px-0 lg:py-8">
    {/* unchanged */}
  </div>
</ViewTransition>
```

- [ ] **Step 4: Morph the active sidebar item**

In `docs-sidebar.tsx`, wrap only the current page's `SidebarMenuButton` in `<ViewTransition name="docs-sidebar-active">`; the others render as today. One name is on screen at a time, so on a page change React pairs the old and new active button and the browser morphs the highlight between them.

```tsx
const button = (
  <SidebarMenuButton isActive={current} render={<Link href={page.url} aria-current={current ? 'page' : undefined} />}>
    {page.name}
  </SidebarMenuButton>
);
return (
  <SidebarMenuItem key={page.url}>
    {current ? <ViewTransition name="docs-sidebar-active">{button}</ViewTransition> : button}
  </SidebarMenuItem>
);
```

The mobile sheet renders the same sidebar; two `docs-sidebar-active` names on screen at once is a view-transition error (duplicate name). Check with the sheet open at 390 wide: if both render, give the sheet's copy no name (a prop on `DocsSidebar`, default on, that the mobile nav turns off) and say so in the report.

- [ ] **Step 5: Check by hand, then run the unit specs**

Start the worker (`pnpm nx run-many -t wrangler:dev -p @zeroxsolutions/registry-ui`), open a docs page in Chromium, click a sidebar link: only the column crossfades, the highlight moves; click a TOC entry: nothing animates; stop the worker. Then:

Run: `pnpm nx test @zeroxsolutions/registry-ui -- src/components/navigation`
Expected: PASS (`docs-sidebar.spec.tsx`, `mobile-nav.spec.tsx` unchanged in behaviour).

- [ ] **Step 6: Commit**

Run the gate through the pre-commit hook:

```bash
git add apps/registry-ui/src
git commit -m "feat(registry-ui): crossfade docs pages and morph the sidebar's active item"
```

---

### Task 2: The TOC marker

**Files:**

- Modify: `apps/registry-ui/src/app/(app)/docs/[[...slug]]/_components/navigation/docs-toc.tsx`

**Interfaces:**

- Produces: a marker element `data-slot="docs-toc-marker"` the e2e in Task 5 locates.

- [ ] **Step 1: Lift the active anchor to the list**

`useMarkedAnchor()` is called per link today. Call it once in a `DocsTocList` child of `AnchorProvider` (the hooks need the provider above them) and pass `active` to each `DocsTocLink`. Behaviour is unchanged; run `pnpm nx test @zeroxsolutions/registry-ui -- docs-toc` and see it pass.

- [ ] **Step 2: Add the marker**

The list becomes `relative`. A single `span` (`aria-hidden`, `data-slot="docs-toc-marker"`) sits on the list's left edge, `top` and `height` set from the active link's `offsetTop` and `offsetHeight`, measured in a `useLayoutEffect` keyed on the active url, read through a ref map of the links. While no entry is active the marker is not rendered.

```tsx
<span
  aria-hidden
  data-slot="docs-toc-marker"
  className="bg-foreground absolute left-3 w-px transition-[top,height] duration-200 ease-out motion-reduce:transition-none"
  style={{ top: marker.top, height: marker.height }}
/>
```

`left-3` puts it in the list's `px-6` gutter, clear of the depth indents. Check its placement against nova's sidebar active line by eye in Task 6's strip; the class may move a step, nothing else.

- [ ] **Step 3: Run the specs and commit**

Run: `pnpm nx test @zeroxsolutions/registry-ui -- docs-toc`
Expected: PASS. jsdom has no layout, so the marker's position is checked in Task 5's e2e, not here.

```bash
git add apps/registry-ui/src/app/\(app\)/docs/\[\[...slug\]\]/_components/navigation/docs-toc.tsx
git commit -m "feat(registry-ui): slide a marker to the TOC entry in view"
```

---

### Task 3: View code, tabs and copy

**Files:**

- Modify: `apps/registry-ui/src/app/(app)/docs/[[...slug]]/_components/data-display/example-source.tsx`
- Modify: `apps/registry-ui/src/components/data-display/component-preview.tsx`
- Modify: `apps/registry-ui/src/mdx-components.tsx`
- Modify: `apps/registry-ui/registry/bases/base-ui/components/feedback/copy-button.tsx`
- Modify: `apps/registry-ui/content/docs/components/copy-button.mdx`
- Test: `apps/registry-ui/src/components/data-display/component-preview.spec.tsx` (create only if a behaviour case is needed, see Step 1)

- [ ] **Step 1: "View code" opens in place**

`example-source.tsx` renders `ComponentSource` (a `CodeBlock`, so a `CollapsibleCard`) with the excerpt above the full `SourceCodeBlockContent`. Pass the open block's content its motion:

```tsx
<SourceCodeBlockContent className="h-(--collapsible-panel-height) transition-[height] duration-200 ease-out data-starting-style:h-(--component-preview-excerpt-height) data-ending-style:h-(--component-preview-excerpt-height) motion-reduce:transition-none">
```

`--component-preview-excerpt-height` is set by `ComponentPreviewSource` from the excerpt's own height: measure the rendered excerpt (its `EXCERPT_LINES` lines plus its padding) in the browser and declare it on `ComponentPreviewSource` as an arbitrary property (`[--component-preview-excerpt-height:<n>rem]`), so the panel starts and ends exactly where the excerpt stands. The excerpt keeps hiding at once when the block opens (`group-data-open/collapsible-card:hidden`) and fades back in when it closes: add `starting:opacity-0 transition-opacity duration-200 ease-out motion-reduce:transition-none` to `ComponentPreviewExcerpt`.

If any existing spec under `src/` asserts the code panel is gone right after closing, change it to wait for removal (`waitForElementToBeRemoved` or `findBy` on the excerpt's trigger). Run `pnpm nx test @zeroxsolutions/registry-ui -- src` and see it pass.

- [ ] **Step 2: Tab panels ease in**

In `mdx-components.tsx`, map `TabsContent` so every MDX tab panel enters with a fade:

```tsx
TabsContent: ({ className, ...props }: ComponentProps<typeof TabsContent>) => (
  <TabsContent className={cn('animate-in fade-in-0 duration-200 ease-out motion-reduce:animate-none', className)} {...props} />
),
```

Base UI's tab panel unmounts when inactive, so a newly shown panel mounts and the animation runs; confirm by hand that switching back and forth plays it each time.

- [ ] **Step 3: The copy check eases in**

In `copy-button.tsx`, the `CheckIcon` (rendered only while `copied`) takes `className="animate-in fade-in-0 zoom-in-50 duration-200 ease-out motion-reduce:animate-none"`. Add one sentence to the root docblock: the check eases in, and reduced motion shows it at once. In `content/docs/components/copy-button.mdx`, add the same sentence to `### CopyButton`. Run `pnpm nx test @zeroxsolutions/registry-ui -- copy-button source.spec` and see it pass.

- [ ] **Step 4: Commit**

```bash
git add apps/registry-ui/src apps/registry-ui/registry/bases/base-ui/components/feedback/copy-button.tsx apps/registry-ui/content/docs/components/copy-button.mdx
git commit -m "feat(registry-ui): open view code in place, ease in tab panels and the copy check"
```

---

### Task 4: The home page arrives in sequence

**Files:**

- Create: `apps/registry-ui/src/app/(app)/_components/general/home-grid.tsx`
- Modify: `apps/registry-ui/src/app/(app)/page.tsx`

**Interfaces:**

- Produces: `HomeGrid` (`'use client'`), a grid whose direct children are its cells; each cell carries `data-slot="home-grid-cell"`.

- [ ] **Step 1: The hero by CSS**

In `page.tsx`, give the hero's heading, lead, actions row and install block `animate-in fade-in-0 slide-in-from-bottom-2 duration-200 ease-out motion-reduce:animate-none`, with delays 0, 75, 150 and 200ms and a backwards fill so each waits invisible only for its own delay (check tw-animate-css 1.4.0's utility names for the delay and the fill in `node_modules/tw-animate-css/dist/tw-animate.css`; use arbitrary properties if it has none). This runs before hydration and finishes without JS.

- [ ] **Step 2: The grid by `motion/react-mini`**

```tsx
'use client';

import { useInView, useReducedMotion } from 'motion/react';
import { useAnimate } from 'motion/react-mini';
import { Children, useEffect, type ComponentProps, type ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

/**
 * The home page's component grid: each cell below the fold when the page hydrates starts hidden and
 * eases in as it scrolls into view, a beat after the cell before it in its row. A cell already on
 * screen at hydration is never hidden, so nothing waits on JS.
 */
function HomeGrid({ className, children, ...props }: ComponentProps<'div'>): ReactNode {
  return (
    <div data-slot="home-grid" className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-3', className)} {...props}>
      {Children.map(children, (child, index) => (
        <HomeGridCell index={index}>{child}</HomeGridCell>
      ))}
    </div>
  );
}

function HomeGridCell({ index, children }: { index: number; children: ReactNode }): ReactNode {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const inView = useInView(scope, { once: true });
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const box = scope.current.getBoundingClientRect();
    if (box.top < window.innerHeight) return;
    scope.current.dataset.hidden = '';
    animate(scope.current, { opacity: 0, transform: 'translateY(8px)' }, { duration: 0 });
  }, [animate, reduce, scope]);

  useEffect(() => {
    if (!inView || !scope.current || !('hidden' in scope.current.dataset)) return;
    delete scope.current.dataset.hidden;
    animate(
      scope.current,
      { opacity: 1, transform: 'translateY(0px)' },
      { duration: 0.2, ease: 'easeOut', delay: (index % 3) * 0.03 },
    );
  }, [animate, inView, index, scope]);

  return (
    <div ref={scope} data-slot="home-grid-cell">
      {children}
    </div>
  );
}

export { HomeGrid };
```

Check `motion/react-mini`'s exports in `node_modules/motion/package.json` and `dist` before writing (`useAnimate`'s option names, whether `useInView` is re-exported there; import it from `motion/react` if not). Replace the grid `div` in `page.tsx` with `<HomeGrid>`; the cells' content is unchanged.

- [ ] **Step 3: Check the chunk**

Run `pnpm nx run @zeroxsolutions/registry-ui:build` and confirm `motion` appears only in the home route's client chunk (grep `.next/static/chunks` for a motion identifier and map it to the route via the build manifest). Report the chunk and its size.

- [ ] **Step 4: Run the specs and commit**

Run: `pnpm nx test @zeroxsolutions/registry-ui`
Expected: PASS.

```bash
git add apps/registry-ui/src/app/\(app\)
git commit -m "feat(registry-ui): bring the home page in in sequence"
```

---

### Task 5: One e2e case for motion

**Files:**

- Create: `apps/registry-ui-e2e/src/motion.spec.ts`

- [ ] **Step 1: Write the case**

Read `home.spec.ts` and `component-pages.spec.ts` for the suite's conventions (clipboard stub, console listener, retrying clicks before hydration). One `test` body in a function run twice, once as is and once under `test.use({ reducedMotion: 'reduce' })` in a `describe`. It collects `pageerror` and `console` errors and asserts none at the end. In order:

1. `/docs/components/collapsible-card`: click the sidebar link "Tag Input"; the URL becomes `/docs/components/tag-input` and the h1 reads "Tag Input".
2. Click a TOC entry ("API reference"); the URL hash is `#api-reference`; poll until the `docs-toc-marker`'s bounding box top is within 2px of that entry's.
3. Click "View code" in the first preview; the code block's full content is visible; click the block's "Toggle"; poll until the full content is gone and "View code" is visible again.
4. Click the "Manual" tab; its first step is visible; click "Command"; the install command is visible.
5. With the clipboard stubbed, click "Copy code" on the install command until the button is named "Copied".
6. `/`: scroll to the bottom in steps; poll until every `[data-slot=home-grid-cell]` has computed opacity `1`.

Name every deadline you raise where you raise it.

- [ ] **Step 2: Run it in all three browsers, then the suite**

Run: `pnpm nx e2e @zeroxsolutions/registry-ui-e2e -- src/motion.spec.ts`
Expected: PASS in chromium, firefox and webkit, both modes.
Run: `pnpm nx e2e @zeroxsolutions/registry-ui-e2e`
Expected: every case passes. Confirm `lsof -nP -iTCP:8787 -sTCP:LISTEN` prints nothing after.

- [ ] **Step 3: Commit**

```bash
git add apps/registry-ui-e2e/src/motion.spec.ts
git commit -m "test(registry-ui-e2e): drive every docs motion to its end state, with and without reduced motion"
```

---

### Task 6: Verification

**Files:**

- Modify: `AGENTS.md` (the worker size line)

- [ ] **Step 1: The gate cold**

Run: `pnpm nx run-many -t lint typecheck test build --skip-nx-cache`
Expected: `Successfully ran targets ... for 5 projects`.

- [ ] **Step 2: Size**

Run the Task 1 Step 0 command again. Update AGENTS.md's "The worker is over the free plan's limit" figure and date with the new number, and put before/after in the report.

- [ ] **Step 3: Frame strips**

With the worker on 8787, a throwaway Playwright script in the session scratchpad (not committed) captures each motion at 0, 50, 100, 150 and 200ms after its trigger, at 1440 wide, and joins each set into one PNG: page change, sidebar morph, TOC marker, View code open and close, tab switch, copy, home hero, home grid. Name them `c5-<motion>.png`. Read every strip and write in the report what each frame shows; flag any jump, any header/sidebar fade, any flash. Stop the worker.

- [ ] **Step 4: Commit**

```bash
git add AGENTS.md
git commit -m "docs: record the worker's size after the docs motion"
```
