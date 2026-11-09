# zui web: every base style drawn for real - implementation plan

**Spec:** `docs/superpowers/specs/2026-11-09-zui-web-styles-design.md`

**Goal:** the eight `base-<style>` outputs carry each style's classes, and the docs draw and show the
style the picker names.

## Global constraints

- Pin stays `ba1503c64472b82256d9de95e2e62c5901a38e8b`.
- Tokens are replaced with `shadcn/utils`' `createStyleMap` and `transformStyle`; it rewrites only a JSX
  `className`, a `cn()` call's and a `cva()` call's strings, so a token anywhere else is never replaced.
- Single-project nx targets only; `base-nova`'s output keeps today's classes.
- URLs, `registry.json`, item names and dependencies do not change.

## Rulings made while planning

- **The whole web page takes the picker's style**, not only the preview stage. Base UI portals a popup to
  `body`, outside any stage, so a vega preview's menu would open in Nova. `<html>` carries
  `style-<style>`, set by an inline script before paint from `?style=` or the remembered choice (the pages
  are force-static), and kept in step by the picker. The native zone's chrome stays `style-nova`. With one
  style per page the sheets need no `@scope`; they load as upstream ships them, inside
  `@layer components` so a utility in `className` still wins. The spec is updated to match.
- **Examples write no token**: a demo's own classes are layout, so its source is one text for all eight
  styles. A spec fails on a token in an example.
- **The site primitives are generated**: upstream's base sources at the pin, through the CLI's own
  `transformIcons`, `transformMenu`, `transformFont` and `transformDirection` for lucide, `menuColor:
  default`, `rtl: false`, with `@/registry/bases/base/` read as `@/registry/bases/base-ui/`. The snapshot
  keeps those base sources, so the check runs offline.

## Review focus

- A token written outside `className`, `cn()` or `cva()` (a const string, a `data-` map) reaching a
  published file unreplaced; the build's leftover check must name it.
- A `className` override on a zui item losing to its slot on the site (the sheets' layer).
- A popup opened from a preview drawn in the page's style, not Nova's.
- A reload of `?style=lyra` flashing Nova before paint.
- The native zone's chrome changing with the web picker.

## Task 1: `@zeroxsolutions/shadcn-upstream`

- Create `packages/shadcn-upstream` with the `@nx/js:library` generator (source-only, no build, no test
  runner beyond its spec). Move `packages/native-ui/styles/upstream/*` to `packages/shadcn-upstream/styles/`
  and `tools/upstream-refresh.mts` with its `upstream-refresh` target.
- The refresh also saves upstream's base sources, `bases/base/ui/<name>.tsx`, under `bases/base/ui/`.
  Write them at the pin.
- `native-ui` declares it as a dev dependency and reads every upstream file from it; its README and specs
  follow. `@zeroxsolutions/ui` declares it too.
- Check: native-ui `test`, `typecheck`, `lint`, `build-registry` unchanged output. Commit.

## Task 2: the site primitives and the sheets on the site

- `packages/ui/tools/sync-primitives.mts` (target `sync-primitives`) writes each file under
  `registry/bases/base-ui/ui/` that has a base source, from that source through the transforms above;
  the three magicui files are left alone. `src/build/primitives.spec.ts` fails when a file differs from
  what the tool would write.
- `packages/ui/src/site/styles/styles.css` imports upstream's eight sheets and zui's eight
  (`registry/styles/style-<style>.css`, empty for now) in `@layer components`; `apps/registry-ui`'s
  `global.css` imports it, the native zone's imports only the nova pair.
- Both root layouts set `style-nova` on `<html>`.
- Check: ui `test`, registry-ui e2e; the chrome looks as today (screenshot of home and one component page
  before and after). Commit.

## Task 3: the page takes the picker's style

- `packages/ui/src/site/lib/style-class.ts`: `styleClassScript(platform)` returns the inline script's body
  (reads `?style=`, then `zui:style:web`, falls back to the default, writes `style-<style>` on
  `documentElement`); a `StyleClass` client component syncs it on change. The web root layout renders both.
- Specs for the script's choice (URL over remembered, unknown passed over); e2e: `?style=vega` sets
  `style-vega` before hydration, the picker switches it, a dialog opened from a preview has vega's classes.
  Commit.

## Task 4: zui slots

- Rewrite the style-dependent classes of the 44 components and the block as tokens: upstream's slot where
  the part looks like an upstream part, else `cn-<item>-<part>` in the eight zui sheets. Nova's values are
  today's classes; each other style's follow the upstream slot named in the slot's comment.
- `src/build/zui-slots.spec.ts`: every zui slot is in all eight zui sheets; every token an item writes is
  defined; no zui slot is unused; no example holds a token; no token sits outside `className`, `cn()` or
  `cva()`.
- Item specs that assert a literal class read it through the style map for nova.
- Commit.

## Task 5: the build and the source panels

- `packages/ui/src/build/style-source.ts`: `styleMapOf(style)` (upstream sheet plus zui sheet) and
  `styleSource(source, style): Promise<string>`.
- `tools/build-registry.mts`: for each style, transform every published file into
  `dist/staging/<style>/`, `shadcn build` it into `dist/r/styles/base-<style>`, then fail on any `cn-`
  token left in the output, naming file and style. The `cp -R` loop goes; `shadcn registry validate` stays.
- `rehypeDocsCode`: a `ComponentSource` or `BlockPreview` whose file holds a token gets one highlighted
  source per style that differs from nova's; the source panel shows the picker's.
- Check: `base-nova` against master's build (same classes per element); e2e for the base-lyra JSON and the
  vega source panel. Commit.

## Task 6: verify and open the PR

- ui and native-ui `test`, `typecheck`, `lint`, both `build-registry`; registry-ui e2e.
- Screenshots of collapsible-card, panel-header, permission-card, tag-input and data-table in all eight
  styles, in the PR.
