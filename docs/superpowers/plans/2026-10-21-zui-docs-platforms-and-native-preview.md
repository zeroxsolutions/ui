# zui docs: a Web / Native switch, engines in the path, a style picker, and live native previews Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The registry site has one header (Docs, Components, Blocks) with a Web / Native switch; a
component page lives under its engine (`/docs/components/base/button`, `/native/components/uniwind/button`);
a style picker (`?style=`) changes install snippets and previews; native component pages show a live
preview of the item drawn in the chosen style, as React Native Reusables' docs do.

**Architecture:** Web keeps its fumadocs tree under `/docs`, with component pages moved one level down
under their base (`base` today; `radix`, `aria` later) and the old URLs redirected. Native gets its own
tree and layout under `/native` (`/native/docs/...`, `/native/components/<engine>/...`,
`/native/blocks/<engine>`), from its own content folder. The engine segment and the `style` search param
are read by the MDX components that print install commands, `components.json` and setup tabs. Native
previews are a small Expo app per style, exported for web with the real engine pipeline (Metro +
NativeWind) and embedded on each native component page through an iframe; Next never compiles React
Native code.

**Tech Stack:** as the registry site (Next.js 16, fumadocs, Tailwind 4, Vitest, Playwright) and
packages/native-ui (Expo SDK 58, RN 0.88, NativeWind 4.2.7, react-native-web through Expo's web export).

**Spec:** this conversation's decisions, recorded verbatim in Global Constraints (the user chose to skip
further questions and review the built result).

## Global Constraints

- URLs (decided with the user):
  |                                                                                                   | Web                                           | Native                                                                 |
  | ------------------------------------------------------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------- |
  | Docs                                                                                              | `/docs`, `/docs/installation`, `/docs/<page>` | `/native/docs`, `/native/docs/installation`, `/native/docs/<page>`     |
  | Components index                                                                                  | `/docs/components/base`                       | `/native/components/nativewind`                                        |
  | One component                                                                                     | `/docs/components/base/<name>`                | `/native/components/<engine>/<name>`, engine `nativewind` or `uniwind` |
  | Blocks                                                                                            | `/blocks/base`                                | `/native/blocks/<engine>` (an empty state until native blocks exist)   |
  | Old URLs answer 301 to the new ones: `/docs/components/<name>` -> `/docs/components/base/<name>`, |
  | `/docs/components` -> `/docs/components/base`, `/blocks` -> `/blocks/base`, `/docs/native/...` -> |
  | the matching `/native/...` page. An engine segment outside the known set is a 404.                |
- Engine is in the path; style is a picker, never in the path. Key `style`; values are the registry's
  style names after the engine prefix (web: `nova` default, plus `luma lyra maia mira rhea sera vega`;
  native: `vega` default, `nova`). The default is not written to the URL; the last choice per platform
  is remembered (localStorage) and a `?style=` in a pasted link wins over it.
- The header holds Docs, Components, Blocks and a Web / Native switch; each item points into the current
  platform's tree. The switch goes to the same page on the other platform when it exists (same docs
  slug, same component name), else to that section's index. Native shows an engine switcher (NativeWind /
  Uniwind) wherever the path has an engine; web shows the base switcher with Base UI only for now (the
  code is ready for more bases, nothing invents a Radix page).
- What the engine and style change: install commands and `components.json` (`"style": "<engine>-<style>"`
  / `"base-<style>"`), the engine's setup tabs (only the current engine's shown on an engine page), and
  the native preview (style). Web previews keep rendering Base UI as today.
- Native preview: one Expo app per style built for web from the emitted native sources of that style
  (`nativewind-<style>`), served by the site as static files under `/native-preview/<style>/`, embedded
  in an iframe with the item's demo name, the style, and the site's light/dark mode; the iframe
  follows a theme change. Every native component page has at least one demo.
- Search, sitemap, llms output and the e2e specs follow the new URLs; no page is reachable only by the
  old URL.
- Everything in plans 2-7's Global Constraints holds (nx by scoped name, gundam skills per file kind,
  plain ASCII, tests first for behaviour, four native registries valid).

## Review Focus

1. A pasted link with `?style=vega` opens Vega even when the reader's remembered choice is Nova, and the
   picker writes no `?style=` for the default (Task 2).
2. The Web / Native switch from a page with no counterpart lands on the section index, never a 404
   (Task 2).
3. Old URLs (production has `/docs/components/<name>`) redirect with 301, and search results and the
   sitemap carry only new URLs (Tasks 1, 5).
4. The native preview iframe draws the chosen style and the site's dark mode, and a demo that throws
   shows an error in the frame rather than a blank page (Tasks 3-4).
5. `/native/components/foo/button` (unknown engine) is a 404, not a page with broken snippets (Task 2).

---

### Task 1: web components under their base

Skills: structuring-a-frontend-app, addressing-a-screen, writing-e2e-tests, writing-unit-tests.

- Move the web component pages to `/docs/components/base/<name>` and the components index to
  `/docs/components/base`; blocks to `/blocks/base`. Redirects (301) from the old URLs in the app's
  Next config, tested.
- Route helpers in the site's routes module build every one of these URLs; no page hardcodes a path.
- [ ] e2e first: old URLs redirect, new ones render, sidebar links point at the new ones. Implement;
      lint, typecheck, test, the docs/registry/search/sitemap/llms e2e; commit.

### Task 2: the native tree, the switches and the style picker

Skills: structuring-a-frontend-app, addressing-a-screen, writing-a-url-control, wiring-client-state,
writing-a-component, writing-component-tests, writing-e2e-tests, writing-prose.

- A native content tree (`content/native/docs`, `content/native/components`) moved from
  `content/docs/native`, one MDX per component shared by both engines; routes and a layout for
  `/native/docs/[[...slug]]`, `/native/components/[engine]/[[...slug]]`, `/native/blocks/[engine]`.
- Header items per platform, the Web / Native switch, the engine switcher, the style picker (URL +
  remembered), and the MDX components (install command, `components.json` block, engine setup tabs)
  reading engine and style. Redirects from `/docs/native/...`.
- [ ] Tests first (unit for the URL/state functions, component tests for the picker and switch, e2e for
      Review Focus 1, 2, 5); implement; gate; commit per part.

### Task 3: the native preview app

Skills: adding-a-project, wiring-a-task-target, declaring-a-dependency, adopting-a-library,
writing-a-component.

- `packages/native-ui` writes its emitted sources per registry to a folder a preview build can import
  (beside `dist/r`), and holds one demo per item (`src/examples/<name>-demo.tsx`, written with
  `@/components/ui/...` imports as an app would).
- A new Expo app project (generator, `apps/native-preview`) with NativeWind set up as the docs say,
  one route per demo, a query for light/dark, and an error boundary per demo; an nx target exports it
  for web once per style (`vega`, `nova`) into the site's static folder under `/native-preview/<style>/`,
  wired into the site's build like `shadcn-build`.
- [ ] Tests first where logic exists (demo list, theme param); build both styles; open one demo per style
      in a browser and check it draws; commit.

### Task 4: previews on the native component pages

Skills: writing-a-component, writing-component-tests, writing-e2e-tests, writing-prose.

- A `NativePreview` MDX component: iframe on `/native-preview/<style>/<demo>?theme=<mode>`, sized to its
  content, following the picker's style and the site's mode; source tab shows the demo file.
- Each native component page gets its preview.
- [ ] e2e first (preview frame present and drawing on two pages, style switch reloads the frame, dark
      mode reaches it); implement; gate; commit.

### Task 5: search, sitemap, llms and cleanup

Skills: writing-e2e-tests, writing-prose.

- Search index, sitemap and llms output list the new URLs only; the old Native header item and
  `/docs/native` tree are gone; docs prose that names URLs or the old header item is updated.
- [ ] e2e first; implement; full gate; commit.
