# zui native: the missing primitives, a Uniwind preview, and the docs gaps

## Why

`@zui` for React Native is shadcn/ui upstream ported to React Native: the same items, the same styles (`vega`,
`nova`), kept in step as upstream changes. Today it carries 19 of upstream's items, so an app still reaches
elsewhere for a dialog, a select or a dropdown, and nothing says when upstream adds or changes an item. The
docs site draws every native preview with NativeWind, so a reader on a Uniwind page sees what a NativeWind
app draws. The copyable markdown of a native page is raw MDX, a few docs lines name the wrong engine, and a
React hydration error fires on native component pages. The user asked for all of it to be finished, and
corrected the scope on 2026-10-22: follow shadcn upstream, not React Native Reusables (RNR is a reference
for how a primitive works on React Native, not the list to match).

## Goals

1. **Every upstream item with a native meaning**, ported into all four native registries (`nativewind-vega`,
   `nativewind-nova`, `uniwind-vega`, `uniwind-nova`) with a docs page and a demo, as the present ones have.
   Upstream's list is `https://ui.shadcn.com/r/styles/base-vega/registry.json` (`registry:ui` items). To port:
   accordion, alert, alert-dialog, aspect-ratio, breadcrumb, button-group, calendar, carousel, collapsible,
   combobox, command, context-menu, dialog, drawer, dropdown-menu, empty, field, hover-card, item, kbd,
   menubar, pagination, popover, scroll-area, select, sheet, slider, sonner, table, tooltip.
2. **Kept in step with upstream.** A tool refreshes the upstream snapshot the build reads
   (`packages/native-ui/styles/upstream`: style CSS and the item list), and a test fails when upstream lists
   an item that has neither a native item nor an entry in the written list of items not ported.
3. **A Uniwind preview.** A `/native/components/uniwind/<name>` page draws its demo with the
   `uniwind-<style>` sources in a Uniwind bundle, in the Web frame and on a phone through Expo Go.
4. **Docs gaps** from the 2026-10-21 audit (M2, L1, L2, L3).
5. **Hydration error #418** on native component pages is gone.

## Non-goals

- Upstream items with no native meaning, written in the not-ported list with the reason: direction (a DOM
  `dir` provider), native-select (an HTML `<select>`; `select` is the native one), resizable (pointer-dragged
  panels), navigation-menu (hover menus for desktop web), sidebar (a desktop app shell; native has tab-bar),
  form (upstream moved to field), toast (upstream replaced it with sonner).
- chart (upstream draws with recharts; a native chart needs Skia or Victory Native, a decision of its own) and
  upstream's AI items (attachment, bubble, message, message-scroller, questionnaire, marker, trace,
  code-block): listed as deferred, a later spec.
- Native blocks. Store builds, EAS Build, any paid Expo feature.

## Anti-goals

- A native item that drifts from upstream's markup, props or style classes without a reason the platform
  forces, written in the item's docs.
- A primitive whose behaviour differs between the two engines beyond what the engine forces.
- A preview that silently shows the other engine.
- A hand-written nx target where the plugin infers one.

## Constraints

- Everything in plans 2-9's Global Constraints holds: nx by scoped name, gundam skills per file kind, plain
  ASCII, tests first for behaviour, four native registries valid (`build-registry` prints "Registry is
  valid." four times).
- Items follow upstream's markup, props and slots; on React Native they are built on `@rn-primitives/*` as
  the present items are, with RNR as the reference for how a primitive behaves on a phone. Each style's
  classes come from the style's own CSS (`vega`, `nova`), translated by the existing build for each engine.
- Overlays (alert-dialog, combobox, command in a dialog, context-menu, dialog, drawer, dropdown-menu,
  hover-card, menubar, popover, select, sheet, sonner, tooltip) render through `@rn-primitives/portal`; the app's root holds a `PortalHost`. The installation docs say so,
  and the preview app renders one.
- Animations use Reanimated (already a dependency), as RNR does, and respect reduced motion. Expo Go 58
  ships every module the items need; nothing outside its module set.
- The Uniwind preview is its own Expo app project beside `apps/native-preview`, so each has the plugin's one
  inferred `export`, `build` (tagged `build:remote`, never run) and the `eas:update` deploy target. One EAS
  project and channel per engine-style is acceptable on the free plan; the QR on a page names its engine's
  channel.
- Machine-readable docs (markdown, llms) are produced from the same page data the HTML uses, not a second
  copy of the content.

## Left to the builder

- Order of work: the hydration fix and the docs gaps are small and go first; the Uniwind preview before the
  primitives, so each new primitive is checked on both engines as it lands.
- How to batch the ported items into tasks (portal-free ones first, then the overlays sharing a portal and
  animation base, then menus, then the heavier inputs).
- The Uniwind app's EAS project and channel names, and how the docs constant carries two project ids.
- How the markdown renderer resolves the MDX components (a markdown variant per component is one way).

## Calls made without asking (check these)

- The not-ported and deferred lists above (the user was asked on 2026-10-22; my proposal stands until they
  answer).
- Uniwind preview as a second app project rather than one app holding both engines: the engines need
  different Metro and Babel setups, which one bundle cannot hold.
- The audit's M1-M2 and L1-L3 are taken as written in `.superpowers/audit-docs-engine.md` (2026-10-21).
