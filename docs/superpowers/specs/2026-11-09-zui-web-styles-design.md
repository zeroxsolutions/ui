# zui web: every base style drawn for real

The web registry publishes eight styles, `/r/styles/base-<style>/`, but `build-registry` builds
`base-nova` and copies it to the other seven (`cp -R` in `packages/ui/package.json`). An item installed
in a vega project gets vega primitives from `@shadcn/...`, while zui's own classes around them (the
44 components, the block and the 49 examples) stay Nova's: a collapsible card keeps Nova's `rounded-xl
ring-1` surface and its 32px header beside vega's 36px icon buttons. The docs draw every preview in Nova
whatever the style picker says; the picker only changes the `init` command and `components.json`.

This change makes each of the eight outputs carry that style's classes, and makes the docs draw a
preview, and show its source, in the style the picker names.

## How an item names a style's classes

The items follow upstream's base: a class that differs between styles is written as a `cn-<slot>`
token, and the build replaces each token with that style's classes.

- Where a zui part draws an upstream part's look, it writes upstream's slot, so the next upstream
  change to that look reaches zui with the snapshot: a card surface `cn-card`, a ghost icon button
  through the `Button` it already renders.
- Where a zui part has no upstream counterpart, it writes a zui slot, `cn-<item>-<part>` (for example
  `cn-collapsible-card-header`), defined in zui's own sheets, `packages/ui/registry/styles/style-<style>.css`,
  one per style, scoped `.style-<style>` as upstream's are.
- A zui slot holds only what differs between styles: radius, the control heights and paddings that track
  a style's scale, text size, gap, ring, border and shadow. Layout (`flex`, `min-w-0`, `truncate`, the
  `group/` and `data-` selectors) stays literal in the item.
- **Values.** Nova's sheet holds the classes the items write today, so `base-nova`'s output does not
  change. In each other style a zui slot takes what the upstream slot beside it takes in that style: a
  surface follows that style's `cn-card` radius, ring and shadow; a header row that holds an icon button
  follows that style's `cn-button-size-icon` height; text follows the text size of the upstream part it
  sits in (lyra and mira write `text-xs`). Each zui slot's comment names the upstream slot it follows.
  _(My call: the Figma libraries exist only for Nova and Vega, so upstream's sheets are the reference for
  all eight; the Figma libraries are not updated in this change.)_

## The build

- `build-registry` builds each of the eight styles from the same sources: it reads upstream's sheet and
  zui's sheet for the style, turns them into a style map and transforms every published file with
  `shadcn/utils`' `createStyleMap` and `transformStyle`, the functions upstream's own build uses, into a
  staging tree, and runs `shadcn build` on it into `dist/r/styles/base-<style>`. The `cp -R` loop goes.
- A token the build cannot find in the style's map stops it, naming the token, the file and the style.
  A published file keeps no `cn-` token.
- The URLs, `registry.json` and the items' names and dependencies do not change.

## Where upstream's sheets come from

Today the snapshot of upstream's sheets (pin `ba1503c64472b82256d9de95e2e62c5901a38e8b`) and the tool that
refreshes it live in `packages/native-ui/styles/upstream/`. The web build now reads the same eight sheets,
and web and native drawing one style from two pins would show one reader two vegas.
_(My call:)_ the snapshot and `upstream-refresh` move to a new source-only package,
`packages/shadcn-upstream` (`@zeroxsolutions/shadcn-upstream`), created with the generator, which
`@zeroxsolutions/ui` and `@zeroxsolutions/native-ui` both declare as a dev dependency; neither registry
imports the other. The pin does not move.

## The docs

- **Primitives.** The site's 60 shadcn primitives under `registry/bases/base-ui/ui/` are today Nova's
  published files. They become upstream's base sources at the pin, with their `cn-` tokens, so one file
  draws every style. The installer's markers in those sources are resolved for the site the way the CLI
  resolves them for a consumer: `IconPlaceholder` draws the lucide icon, `cn-rtl-flip` and
  `cn-menu-target` resolve for `rtl: false` and `menuColor: default`. The three magicui files stay as they
  are. The primitives are still not published; a consumer still gets them from `@shadcn/...`. The
  snapshot keeps upstream's base sources beside the sheets, so the check needs no network.
- **Sheets.** The site loads upstream's and zui's sheets for all eight styles, inside
  `@layer components`, so a utility passed in `className` still wins over a slot.
- **The page takes the picker's style.** Base UI portals a popup to `body`, so a preview cannot hold a
  style of its own: a vega preview's menu would open in Nova. The web pages carry `style-<style>` on
  `<html>`, chrome included, set by an inline script before the first paint from `?style=` or the
  reader's last choice, and changed by the picker. A page with neither draws Nova, as today. The native
  zone's chrome stays Nova whatever the native picker says.
- **Source.** A source panel of a zui item or the block shows the code `add` writes in the picker's
  style, transformed with the same style map as the build, never the token source. An example writes
  no token, so its source is the same in every style.

## What is checked

- `base-nova`'s output has the same classes on every element as today's (order aside).
- Each of the other seven outputs differs from `base-nova` only in the classes of its tokens; a spec
  reads the 16 sheets and fails when a zui slot is missing from any of the eight zui sheets, when an item
  writes a token no sheet defines, or when a zui sheet defines a slot no item writes.
- A spec fails when a site primitive differs from upstream's base source at the pin put through the
  CLI's own install transforms (lucide icons, the default menu colour, no RTL).
- e2e on registry-ui: with `?style=vega` a preview's card has vega's spacing, and so does a popup it opens;
  the source panel shows vega's classes; the served `/r/styles/base-lyra/collapsible-card.json` carries
  `rounded-none`, and no served file under any style holds a `cn-` token.
- Screenshots of five items (collapsible-card, panel-header, permission-card, tag-input, data-table) in
  all eight styles, for review in the PR.

Not in this change: native's zui items (they gain zui slots when they are ported), new styles or bases
(Radix, aria), the Figma libraries, and a different default style.
