# zui native: the missing primitives, a Uniwind preview, and the docs gaps

## Why

The native registry ships 18 of the 31 primitives React Native Reusables (RNR) ships, so an app that installs
`@zui` for React Native still has to reach elsewhere for a dialog, a select or a dropdown. The docs site
draws every native preview with NativeWind, so a reader on a Uniwind page sees what a NativeWind app draws.
The copyable markdown of a native page is raw MDX, and a few docs lines name the wrong engine. A React
hydration error fires on native component pages. The user asked for all of it to be finished.

## Goals

1. **The 13 missing primitives**, each a registry item in all four native registries (`nativewind-vega`,
   `nativewind-nova`, `uniwind-vega`, `uniwind-nova`) with a docs page and a demo, as the 18 present ones
   have: accordion, alert, alert-dialog, aspect-ratio, collapsible, context-menu, dialog, dropdown-menu,
   hover-card, menubar, popover, select, tooltip.
2. **A Uniwind preview.** A `/native/components/uniwind/<name>` page draws its demo with the
   `uniwind-<style>` sources in a Uniwind bundle, in the Web frame and on a phone through Expo Go.
3. **Docs gaps** from the 2026-10-21 audit:
   - M2: the markdown of a native page (Copy page, the `.md` URL, llms output) is rendered for the page's
     engine: the engine's tab only, the `<engine>-<style>` install command, the demo source; no JSX left.
   - L1: an engine-less native docs page links to the components of the engine the reader is on (remembered
     choice), not always NativeWind.
   - L2: the NativeWind installation names `react-native-worklets` with Reanimated 4, the
     `nativewind-env.d.ts` declarations and the Babel preset, as NativeWind's guide does.
   - L3: the dark-mode sentence is split per engine.
4. **Hydration error #418** on native component pages is gone (no mismatch in a production build).

## Non-goals

- Web shadcn items that RNR does not ship (calendar, carousel, sheet, toast, command, ...). They are a later
  decision.
- Native blocks.
- Store builds, EAS Build, any paid Expo feature. Expo Go and EAS Update on the free plan stay the only
  device path.

## Anti-goals

- A primitive whose behaviour differs between the two engines beyond what the engine forces. The item is one
  source; an engine-specific file exists only where the engine needs it (as icon, input, textarea and
  skeleton do today).
- A preview that silently shows the other engine. If a page cannot draw its engine, it says so.
- A hand-written nx target where the plugin infers one (the house skills: plugin entries as `nx add` wrote
  them, inferred target names unchanged, remote builds tagged `build:remote`).

## Constraints

- Everything in plans 2-9's Global Constraints holds: nx by scoped name, gundam skills per file kind, plain
  ASCII, tests first for behaviour, four native registries valid (`build-registry` prints "Registry is
  valid." four times).
- Primitives follow RNR's component for behaviour and accessibility and are built on `@rn-primitives/*`, as
  the present items are. Each style's classes come from the style's own CSS (`vega`, `nova`), translated by
  the existing build for each engine.
- Overlays (alert-dialog, context-menu, dialog, dropdown-menu, hover-card, menubar, popover, select, tooltip)
  render through `@rn-primitives/portal`; the app's root holds a `PortalHost`. The installation docs say so,
  and the preview app renders one.
- Animations use what RNR uses (Reanimated, already a dependency) and respect reduced motion. Expo Go 58
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
- How to batch the 13 primitives into tasks (RNR's dependencies suggest: portal-free ones first, then the
  overlays sharing a portal and animation base).
- The Uniwind app's EAS project and channel names, and how the docs constant carries two project ids.
- How the markdown renderer resolves the MDX components (a markdown variant per component is one way).

## Calls made without asking (check these)

- Scope is RNR's 31, not every web item.
- Uniwind preview as a second app project rather than one app holding both engines: the engines need
  different Metro and Babel setups, which one bundle cannot hold.
- The audit's M1-M2 and L1-L3 are taken as written in `.superpowers/audit-docs-engine.md` (2026-10-21).
