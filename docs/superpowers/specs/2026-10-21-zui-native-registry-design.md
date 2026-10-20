# zui: the registry's name, and a React Native registry beside the web one

## Why

The org's mobile app (the travel Native Figma file, `KwlwWdyQIjor0JlgTQp0Fs`) ships on iOS and Android
and needs the same design system the web apps install from this registry. The web items compose Base
UI on the DOM, so none of them runs on React Native. The RN side is a second set of components, drawn
in shadcn/ui's upstream styles, installable into an Expo app that uses either NativeWind or Uniwind.

Both sides are published under one name, `zui`, with consumers addressing items as `@zui/<name>`.

Success: on a fresh Expo app, `npx @zeroxsolutions/zui init` then `npx @zeroxsolutions/zui add button`
leaves a Button that renders in the Vega style on iOS and Android, under whichever engine was chosen,
and the travel app can build its screens from the first batch below.

## Decided by the user

- The registry is renamed `zui` and consumers get an `@zui` namespace. `apps/registry-ui`, the package
  `@zeroxsolutions/registry-ui` and `ui.zeroxsolutions.com` keep their names (the Figma "ZUI" library's
  component descriptions cite paths under `apps/registry-ui/`).
- The RN registry lives in this repo and is served by the existing registry site.
- The RN components are a separate set, written for React Native; the web items are not reused.
- They reproduce shadcn/ui's upstream styles. Upstream has eight on 2026-10-21 (vega, nova, maia, lyra,
  mira, luma, sera, rhea; each answers at `https://ui.shadcn.com/r/styles/base-<style>/button.json`).
  Vega comes first, because the app is built on it; the others come later through the same pipeline.
- Both NativeWind and Uniwind are supported.
- Item URLs mirror upstream's layout:
  `https://ui.zeroxsolutions.com/r/styles/{engine}-{style}/{name}.json`, for example
  `/r/styles/nativewind-vega/button.json` and `/r/styles/uniwind-vega/button.json`, each style with its
  index at `/r/styles/{engine}-{style}/registry.json`. The web items move to the same layout, under
  every `base-<style>`.
- Consumers address zui as upstream's own registry is addressed, with `{style}`, one line on web and RN:
  `"@zui": "https://ui.zeroxsolutions.com/r/styles/{style}/{name}.json"`. shadcn fills `{style}` from the
  project's `components.json` `style`, and accepts a style name it does not know: shadcn 4.22.1, with
  `"style": "nativewind-vega"`, fetched `/r/styles/nativewind-vega/hello.json` and wrote the file
  (checked 2026-10-21).
- The house writes its own CLI, `zui-cli`, rather than telling RN consumers to run shadcn's.
- Targets are iOS and Android only: phones, iPad, Android tablets and foldables. macOS and Windows
  will be Electron apps installing the web registry, so nothing here targets react-native-macos or
  react-native-windows, and the Figma file's macOS and Windows frames are not RN work.

## Goals

1. The rename: `registry.json` `name` becomes `zui`, the web items move to `/r/styles/base-<style>/`
   for the eight base styles, and the installation docs show the `@zui` namespace.
2. A pipeline that turns one RN source per component into installable items for every
   engine x style pair, starting with nativewind-vega and uniwind-vega.
3. `zui-cli`: `init`, `add`, `doctor` for an Expo app.
4. The first batch of components, in the order the travel app uses them.
5. A preview app that runs the items on iOS and Android.

## Non-goals

- Web support for the RN components (React Native Web). React Native Reusables (RNR) carries `web:`
  classes for it; zui drops them.
- Styles other than Vega in this round, and a Base UI vs Radix split (RN has one primitive layer,
  `@rn-primitives`, so the style name has no `base-` or `radix-` prefix).
- macOS, Windows, desktop pointer sizing.
- System chrome the OS draws: status bars, home indicator, Android navigation bar.
- Web items in `radix-*` styles: they import Base UI, and the installation docs already require a
  `base-` style.
- Restyling the web items' own classes per style in this round (below).

## Anti-goals

- A fork of RNR that drifts: code taken from RNR keeps its MIT notice and is restyled to Vega, not
  shipped in RNR's own new-york look.
- Two hand-maintained source trees, one per engine. RNR has that; its NativeWind and Uniwind files differ
  by import paths in most components, and by a handful of real changes in a few (`icon.tsx`: NativeWind's
  `cssInterop` vs Uniwind's `withUniwind`; `skeleton.tsx`: a CSS `animate-pulse` vs a Reanimated loop;
  a few class strings in `dialog.tsx`, `menubar.tsx`, the menus). A divergence like that is written once,
  in the one place it applies, and every other file is generated for both engines.
- Hand-copying Vega's classes into each component, so that the next upstream change to Vega is noticed
  by nobody.
- A consumer file that does not read like plain shadcn/RNR code. What `add` writes has literal class
  strings and imports under the consumer's own aliases; the style and engine machinery stays in this
  repo.

## The rename

- `apps/registry-ui/registry.json`: `"name": "zui"`. `homepage` is unchanged.
- The web items move into upstream's layout, published under each of the eight base styles:
  `https://ui.zeroxsolutions.com/r/styles/base-<style>/{name}.json` for vega, nova, maia, lyra, mira, luma,
  sera and rhea, each with its `registry.json` index. An item composes shadcn's primitives
  (`@shadcn/button`...), which shadcn installs in the consumer's own style, so the same item already fits
  every base style. The item's own classes (the spacing and sizes of what it composes) are tuned on Nova
  and are the same file under every style for now; restyling them per style, with its "ZUI - <style>"
  Figma library as the reference, comes later and changes no URL.
- Every reference moves with them: the docs `.mdx` pages, the e2e specs, the site's sitemap and its links.
- The old `/r/{name}.json` answers with a permanent redirect to `/r/styles/base-nova/{name}.json`. No repo
  in the org installs from the old URLs (GitHub code search, 2026-10-21), so the redirect is a courtesy
  to anyone outside it, not a contract; when it goes is a later decision.
- `apps/registry-ui/content/docs/installation.mdx` documents the namespace,
  `"registries": { "@zui": "https://ui.zeroxsolutions.com/r/styles/{style}/{name}.json" }`, and
  `shadcn add @zui/<name>`.
- The web items' `registryDependencies` on another zui item become `@zui/<name>`, so a dependency comes
  in the consumer's style like the item itself. An absolute URL cannot carry `{style}` and would pin
  every dependency to one style. The cost: installing an item that depends on another zui item needs the
  `@zui` entry in `components.json`, which the docs say up front.
- Every other reference to the old name `zeroxsolutions-ui` (16 on 2026-10-21) is updated. The host
  `ui.zeroxsolutions.com` and the 1839 references to `registry-ui` keep their names; only the `/r/` paths
  under the host change.
- `docs/superpowers/` plans and specs before this one are records and are not rewritten.
- `@zui` is not taken in shadcn's public directory (`https://ui.shadcn.com/r/registries.json`,
  479 namespaces on 2026-10-21). Listing zui there is a later, separate decision.

## The RN registry

### Where it lives

- The RN item source, its tests and its build: a new nx project, `packages/registry-native`
  (private, not published). It emits the JSON for every engine x style pair.
- The registry site serves that JSON under `apps/registry-ui/public/r/styles/`. `registry-ui`'s build
  depends on `registry-native`'s, so a deploy always carries both. How the files get from one project to
  the other is the builder's call.
- The preview: a new Expo app, `apps/native-preview`, not deployed. It renders the emitted items, not the
  source, because the emitted files are what consumers get. The engine is picked at build time (one
  Babel/Metro setup holds one engine), and the app installs the items with `zui-cli` from a local build of
  the registry, so a run of the preview also exercises `init` and `add`. It has a light/dark switch.
- The CLI: `packages/zui-cli`, published to npm.

All three are created with the nx generators, not by hand.

### One source, generated per engine and per style

A component is written once on `@rn-primitives`: its parts, props, accessibility roles and states, and
its variants as `cva` keys. RNR's code may be the starting point, under MIT, with its notice kept in the
repo.

**Style.** Class strings come from upstream: a script reads each component's
`https://ui.shadcn.com/r/styles/base-<style>/<name>.json`, splits its classes per part and per variant,
and keeps only what applies on React Native. Dropped: `hover:`, `focus-visible:`, `has-[]`, `in-data-[]`,
`aria-*`, `[&_svg]`, `ring-*`, `outline-*`, `transition-*`, `select-none`, `bg-clip-padding`, `whitespace-*`
and the rest of the web-only set. A class with no RN meaning but a visual intent gets a hand-written
translation in one table: for example `active:` becomes the pressed state of `Pressable`, and `[&_svg]:size-4`
becomes the icon size set through `TextClassContext`/the Icon wrapper. Whatever the script cannot place,
it reports and does not guess.

The extracted classes are committed per style (a `vega` class map), so re-running the script after
upstream changes Vega shows the change as a diff to review. Adding a style is running the script for it,
reviewing the report, and adding the pair to the build.

**Sizing.** Vega's sizes are used as they are on phones and tablets (Button `h-9`, `sm` `h-8`, `icon`
`size-9`). The design side chose Vega as the touch style for both, so zui does not carry RNR's
`sm:` breakpoint step (`h-10` phone, `sm:h-9` tablet).

**Engine.** The source imports nothing from `nativewind` or `uniwind` except through a few engine files
(the Icon wrapper, the Skeleton animation, and any other the build finds). Each of those has one
version per engine; every other file is shared. The build writes the item for each engine with its
engine file and its engine's dependencies (`nativewind` 4.x with `react-native-css-interop`, or `uniwind`
1.x).

**Items.** Each emitted item is a shadcn registry item (`$schema` `registry-item.json`): files with
literal classes, `dependencies` (`@rn-primitives/*`, `class-variance-authority`, `lucide-react-native`,
the engine), and `registryDependencies` as `@zui/<name>` for another RN item. `@zui` in an RN project
points at that project's own engine and style (below), so `dialog`'s `@zui/button` resolves to the same
pair. Every emitted registry passes `shadcn registry validate`.

### Themes

Each engine x style registry carries a `registry:style` (or `registry:theme`) item with Vega's tokens
(`--background`, `--foreground`, `--primary`... light and dark, from upstream's theme for the base colour
`neutral`, the one the web registry uses) and `success`/`warning`, which the web items already add.
`init` installs it.

The typeface is Geist, as on the web registry. React Native does not pick a custom font's weight from
`font-medium` or `font-semibold` reliably (Android needs one family name per weight), so the theme item
bundles Geist's static weights for `expo-font`, `init` wires the loading, and Text maps each weight class
to its family. Every component sets weight through Text, never with a raw `fontWeight`.

## zui-cli

TypeScript on Node, published as `@zeroxsolutions/zui`, binary `zui` (run as `npx @zeroxsolutions/zui`).
It follows what `@react-native-reusables/cli` 0.7.1 does: it owns setup and checks, and writes component
files by running `shadcn@latest add` with the right URLs.

- `init`: in a fresh Expo app (refuses outside Expo; no travel app exists in code on 2026-10-21, so
  merging into an existing NativeWind or Uniwind setup is not required in this round), asks NativeWind or Uniwind and the style (Vega the only
  choice for now), installs the engine and its peers, writes the engine's config (`babel`/`metro`,
  `global.css`, Tailwind config or CSS for the engine), installs the theme item, and writes
  `components.json` with the aliases and
  `"style": "<engine>-<style>"` (for example `nativewind-vega`) and
  `"registries": { "@zui": "https://ui.zeroxsolutions.com/r/styles/{style}/{name}.json" }`, the same line a
  web app has.
- `add <name...>`: with no names, lists the items from `/r/styles/<engine>-<style>/registry.json` to pick;
  then runs `shadcn add @zui/<name>...`, and `doctor` after it.
- `doctor`: checks that the engine, its config, the theme and the namespace agree with each other and
  with `components.json`, and says what to change.

Releasing it follows the repo's library release process.

## First batch

From the inventory of the travel Native file (`/tmp/wa/native-inventory.md`, 198 pages, 2026-10-21;
counts are instances drawn, still in Nova because the file has not moved to Vega). Variants and sizes are
built as Vega defines them, all of them, not only the ones counted.

1. Foundation, in RNR: Text, Icon (lucide), Button, Toggle, Toggle Group, Avatar, Skeleton, Separator,
   Badge, Card, Tabs, Label, Progress, Input, Textarea, Switch, Checkbox, Radio Group.
2. Missing from RNR, by use: Item (7944), Input Group (1051), Empty (748), Field (564), Avatar Group (438),
   Input OTP (258, with `textContentType="oneTimeCode"` and `autoComplete="sms-otp"`), Spinner (100),
   Marker (68). Marker is in upstream (the web registry's copy is `registry/bases/base-ui/ui/marker.tsx`),
   so its classes come from upstream like the rest.
3. Overlays, in RNR: Dialog, Alert Dialog, Select, Dropdown Menu, Popover, Tooltip.

Out of this batch, each its own design later: Tab Bar and Sidebar (navigation, tied to React Navigation:
native bottom tabs, Android navigation rail, a split-view sidebar on iPad landscape and tablets), Drawer
and Sheet (bottom sheet), Sonner (toast), Slider, Message/Bubble, Unsaved Changes Toolbar.

## Tests

- `registry-native`: Jest with React Native Testing Library per component (variants render, a pressed
  or disabled state, the accessibility role and state), and a build test: every emitted registry passes
  `shadcn registry validate`, every `@zui/<name>` dependency exists in the same pair, every file's imports
  are covered by `dependencies` or another item.
- `zui-cli`: `init` and `add` run in CI against a fresh Expo app per engine, then the app typechecks.
- `apps/native-preview`: manual review on iOS and Android, once per engine, against the
  "ZUI - Vega" Figma library.

## Left to the builder

- How the extraction script parses upstream's files, and the format of the committed class map.
- How the engine files are selected and how imports are rewritten to the consumer's aliases.
- How `registry-native`'s output reaches `apps/registry-ui/public/r/styles/`.
- The docs pages for the RN items on the registry site, following the web pages' pattern.
- Expo SDK, React Native and engine versions at build time (on 2026-10-21: `expo` 58.0.16,
  `react-native` 0.88.0, `nativewind` 4.2.7, `uniwind` 1.13.0).
