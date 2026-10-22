# zui native: the 16 remaining upstream items Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** every item upstream's `base-vega` lists has a native item in all four registries, and
`upstream-coverage.json` lists nothing as not ported or deferred.

**Architecture:** as plan 10: one source per item under `packages/native-ui/src/registry/ui/`, `cn-<slot>`
tokens from the style CSS, translated per engine by `src/build`; overlays through `@rn-primitives/portal`;
motion through `src/registry/lib/motion.ts`; touch through React Native's responder and Reanimated, as the
slider and carousel do.

**Tech Stack:** plan 10's, plus `d3-scale`, `d3-shape`, `shiki`, `expo-clipboard`.

**Spec:** `docs/superpowers/specs/2026-10-22-zui-native-remaining-upstream-design.md` (research:
`.superpowers/research-remaining-upstream.md`).

## Global Constraints

- Plan 10's Global Constraints hold (`docs/superpowers/plans/2026-10-22-zui-native-completion.md`): nx by
  scoped name, gundam skills per file kind, plain ASCII, tests first; `build-registry` prints "Registry is
  valid." four times; every item has a `registry.json` entry, a spec, `src/examples/<name>-demo.tsx` (demos
  follow upstream's demo), a page in `apps/registry-ui/content/native/components/<name>.mdx` listed in
  `meta.json`; no local `nx affected` or run-many.
- Each task removes its items from `upstream-coverage.json` as they land.
- Departures from upstream are listed on the item's page with the reason the platform forces.
- New dependencies are in Expo Go 58's module set and run on react-native-web.

## Review Focus

1. A chart draws the same data on the web frame and a phone, with its tooltip reachable by touch and its values
   readable by a screen reader (Task 4).
2. sidebar below `md` is a sheet that closes on back and outside press; from `md` it is a panel; `useSidebar`
   reports `isMobile` accordingly (Task 3).
3. A resizable handle drags with touch inside the preview's ScrollView without scrolling the page, and is an
   `adjustable` element for screen readers (Task 2).
4. code-block's long lines scroll sideways, and Copy announces its result (Task 5).
5. questionnaire and message-scroller keep upstream's hook names and behaviour (Task 7).

---

### Task 1: direction, native-select, form, toast

Skills: as plan 10 Task 7; writing-prose.

- [ ] direction: `DirectionProvider`, `useDirection`, default `I18nManager.isRTL`, `dir` set on the web;
      native-select: upstream's parts drawn by the ported `select`; form: whatever upstream's item ships, and a
      page with `field` bound to react-hook-form's `Controller` (if the registry rejects an item with no
      files, the page alone and a coverage entry saying upstream ships no files - ledger it); toast:
      upstream's base-ui toast API, sharing sonner's queue and motion where it fits, announced to screen
      readers; commit per item.

### Task 2: resizable

Skills: as plan 10 Task 11.

- [ ] Group, panel and handle in upstream's names and props (sizes in percent, `onLayout`, direction); the
      handle drags with the responder system and Reanimated, holds the gesture inside a ScrollView, and is
      `adjustable` with increment/decrement; spec for sizes, limits and the keyboard on web; commit.

### Task 3: navigation-menu and sidebar

Skills: as plan 10 Task 10.

- [ ] navigation-menu: upstream's parts; a press opens content, a second press or outside press closes it;
      links announced as links; commit.
- [ ] sidebar: upstream's provider, parts, `useSidebar`; sheet below `md` (the ported `sheet`), panel from
      `md`; open state in the provider; spec for both widths; commit.

### Task 4: chart

Skills: adopting-a-library, declaring-a-dependency, writing-a-component; dataviz.

- [ ] `ChartContainer`, `ChartConfig`, `ChartTooltip(Content)`, `ChartLegend(Content)` as upstream; bar, line,
      area and pie in Recharts' part names (`BarChart`, `Bar`, `XAxis`, `YAxis`, `CartesianGrid`, ...) drawn
      with `react-native-svg` + `d3-scale` + `d3-shape`; colours from the config's CSS variables; tooltip on
      press; an accessible summary of the values; demos follow upstream's chart demos; commit per chart type.

### Task 5: code-block

Skills: adopting-a-library, declaring-a-dependency.

- [ ] Upstream's parts and props; shiki tokens (JavaScript regex engine) into nested `Text` with the style's colours;
      horizontal scroll for long lines; copy through `expo-clipboard` with an announced result; commit.

### Task 6: attachment, bubble, message, marker

Skills: as plan 10 Task 7.

- [ ] Upstream's parts and props; `render` props through `@rn-primitives/slot`; data-slot selectors as
      context; commit per item.

### Task 7: message-scroller, questionnaire, trace

Skills: as plan 10 Task 8.

- [ ] message-scroller and questionnaire re-implement `@shadcn/react`'s state and hooks as context with the
      same names; trace on the ported `collapsible`; commit per item.

### Task 8: coverage empty, indexes, e2e

Skills: writing-e2e-tests, writing-prose.

- [ ] `upstream-coverage.json` has no `notPorted` or `deferred` entries (drop the keys if nothing reads
      them, keeping the guard); index, sitemap, llms and search list the new items (they derive from
      source); e2e asserts a sample (chart, sidebar, code-block) under both engines; commit.
