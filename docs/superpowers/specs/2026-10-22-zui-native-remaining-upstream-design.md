# zui native: the 16 upstream items left out of plan 10

## Why

Plan 10 ported 30 upstream items and wrote 16 into `packages/native-ui/upstream-coverage.json` as not ported
(direction, native-select, resizable, navigation-menu, sidebar, form, toast) or deferred (chart and the AI items
attachment, bubble, message, message-scroller, questionnaire, marker, trace, code-block). On 2026-10-22 the user
asked for all of them: the native registry carries every item upstream's `base-vega` lists, so an app moving
between web and native finds the same names. Research behind the calls below:
`.superpowers/research-remaining-upstream.md`.

## Goals

1. Each of the 16 items ported into all four native registries (`nativewind-vega`, `nativewind-nova`,
   `uniwind-vega`, `uniwind-nova`) with a docs page, a demo and a spec, as plan 10's items have.
2. `upstream-coverage.json` lists nothing as not ported or deferred; the coverage spec still fails on a new
   upstream item with no native item.
3. Where upstream's item is a web control with no phone equivalent, the native item keeps upstream's names and
   props and does the nearest thing a phone does, written on its page:
   - direction: `DirectionProvider` and `useDirection`, defaulting to `I18nManager.isRTL`; items that draw an
     arrow or a side read it.
   - native-select: upstream's `NativeSelect`, `NativeSelectOption`, `NativeSelectOptGroup` parts, drawn by the
     ported `select`.
   - navigation-menu: upstream's parts; a press opens what a hover opens on the web.
   - sidebar: upstream's provider, parts and `useSidebar`; a side sheet below the `md` width and a fixed panel
     from it; open state held in the provider (no cookie).
   - resizable: upstream's group, panel and handle; the handle drags with touch.
   - form: upstream ships the item with no files. The page shows `field` bound to react-hook-form's
     `Controller`, as upstream's page now does; the item ships whatever upstream ships.
   - toast: upstream's base-ui toast (`Toaster`, `toast`, `useToastManager`), beside `sonner`.
4. chart keeps upstream's `ChartContainer`, `ChartConfig`, `ChartTooltip(Content)` and `ChartLegend(Content)`,
   and draws the chart types upstream's chart demos use (bar, line, area, pie) with `react-native-svg` plus
   `d3-scale` and `d3-shape`, in Recharts' part names.
5. code-block highlights with upstream's shiki on its JavaScript regex engine (no WASM) into nested `Text`, and
   copies with `expo-clipboard`. Hermes' `matchAll` drops named groups, which the engine's pattern conversion
   reads, so the item converts with an `exec`-based `matchAll`.
6. The AI items follow upstream's parts and props. message-scroller and questionnaire re-implement
   `@shadcn/react`'s state and hooks as React Native context, since that package draws DOM elements.

## Non-goals

- Upstream blocks, a native Recharts clone beyond the parts the chart demos use, Skia, `victory-native`,
  `react-native-gesture-handler` (none is a repo dependency today; touch handling stays on React Native's own
  responder and Reanimated, as plan 10's slider and carousel do).
- The pre-existing master issues (view transition swallowing early clicks, `/docs/components/button` 404).

## Anti-goals

- A native item whose names or props differ from upstream's without a reason the platform forces, written on
  its page.
- A dependency outside Expo Go 58's module set, or one that does not run on react-native-web.

## Constraints

Plan 10's Global Constraints hold unchanged (four valid registries, upstream's markup, props and slots on
`@rn-primitives/*`, portal for overlays, Reanimated with reduced motion, tests first, no local broad gate, plain
ASCII). New dependencies (`d3-scale`, `d3-shape`, `shiki`, `expo-clipboard`) are declared by the
items that import them, through the catalog where two projects declare them.

## Calls made without asking (check these)

- The nearest-phone behaviour in Goal 3 for direction, native-select, navigation-menu, sidebar and resizable.
- chart on `react-native-svg` + d3 rather than Skia/`victory-native`: Expo Go 58 bundles Skia 2.14.0 and
  `victory-native` 43 needs 2.15.1 or newer; Skia on the web needs CanvasKit WASM.
