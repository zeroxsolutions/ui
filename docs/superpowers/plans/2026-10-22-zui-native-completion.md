# zui native: the missing primitives, a Uniwind preview, and the docs gaps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The native registry ships React Native Reusables' 31 primitives on both engines and both styles; a
Uniwind page draws its demo with Uniwind; a native page's markdown is rendered for its engine; the docs name
each engine's own setup; native component pages hydrate without error.

**Architecture:** New primitives are items in `packages/native-ui` written like the present ones: one source
under `src/registry/ui/`, `cn-<slot>` tokens resolved per style from `packages/native-ui/styles`, translated per
engine by `src/build`, an engine file (`<name>.nativewind.tsx` / `<name>.uniwind.tsx`) only where the engine
forces it. Overlays render through `@rn-primitives/portal`. The Uniwind preview is a second Expo app,
`apps/native-preview-uniwind`, mirroring `apps/native-preview` with Uniwind's Metro setup; the site picks the
app (web frame path and Expo project/channel) by the page's engine.

**Tech Stack:** as plans 2-9: Expo SDK 58 / RN 0.88, NativeWind 4.2.7, Uniwind 1.13, `@rn-primitives/*`,
Reanimated 4, Next 16 + fumadocs, Vitest, Jest (jest-expo), Playwright, nx 23 with `@nx/expo/plugin`, EAS Update.

**Spec:** `docs/superpowers/specs/2026-10-22-zui-native-completion-design.md` (audit details it cites:
`.superpowers/audit-docs-engine.md`, `.superpowers/audit-native-coverage.md`).

## Global Constraints

- Everything in plans 2-9's Global Constraints holds: nx by scoped name through `pnpm nx`, gundam skills per
  file kind, plain ASCII, tests first for behaviour.
- `pnpm nx run @zeroxsolutions/native-ui:build-registry` prints "Registry is valid." four times
  (`nativewind-vega`, `nativewind-nova`, `uniwind-vega`, `uniwind-nova`).
- Primitives: RNR's component (`founded-labs/react-native-reusables`, `packages/registry/src/{nativewind,uniwind}/components/ui`)
  for behaviour, props and accessibility, built on `@rn-primitives/*`; classes from the style CSS via `cn-<slot>`.
- Every new item has: a `registry.json` entry, a spec beside the source, `src/examples/<name>-demo.tsx`, a page
  `apps/registry-ui/content/native/components/<name>.mdx` listed in that folder's `meta.json` and the index list.
- Overlays render through `@rn-primitives/portal`; `PortalHost` sits in the app root (preview apps and docs).
- Nothing outside Expo Go 58's module set; free Expo plan only (EAS Update; no EAS Build, no store submission).
- `@nx/expo/plugin` entry in `nx.json` stays as `nx add` wrote it; inferred target names unchanged; Expo apps
  carry tag `build:remote`; EAS work is the `eas:update` target, configuration `production`.
- The machine is slow: no local `nx affected` / broad gates; run the touched project's targets and touched
  specs; CI runs the full gate on the PR.

## Review Focus

1. An overlay opened inside the preview frame or on a phone sits above the page and closes on back/outside
   press; with no `PortalHost` mounted it fails loudly in dev, not silently (Tasks 6-7).
2. A Uniwind page's QR names the Uniwind project/channel and its web frame draws the Uniwind export; a
   NativeWind page is unchanged (Task 5).
3. A native page's `.md`, on Uniwind, has no `<` JSX tag left, the `uniwind-<style>` install command, and only
   the Uniwind tab's text (Task 3).
4. Select, dropdown-menu and context-menu are reachable by screen readers: trigger role and expanded state,
   items announced with their checked state (Task 7).
5. A reader with reduced motion gets no enter/exit animation on accordion, collapsible and overlays
   (Tasks 6-7).

---

### Task 1: native component pages hydrate without error

Skills: superpowers:systematic-debugging, writing-a-component, writing-e2e-tests.

- [ ] Reproduce React error #418 on `/native/components/nativewind/button` in a production build (`wrangler:build`
      output or the deployed site), find the mismatching element (likely client-only state read during render:
      remembered style/engine/platform from localStorage, theme), write an e2e that fails on a console
      hydration error on two native pages and one web page, fix by reading client-only state after hydration
      (the site's `use-hydrated` hook), see it pass, commit `fix(registry-ui): ...`.

### Task 2: docs name each engine's own setup (L1, L2, L3)

Skills: writing-prose, cutting-ai-tells, writing-plain-ascii, writing-a-component, writing-component-tests.

Files: `apps/registry-ui/content/native/docs/installation.mdx`, `index.mdx`, `src/mdx-components.tsx`.

- [ ] L1: an engine-less native docs page rewrites `/native/components/<engine>/...` links to the reader's
      remembered engine after hydration (default nativewind); component test for the link component.
- [ ] L2: NativeWind tab installs `react-native-reanimated react-native-worklets react-native-safe-area-context`,
      shows `nativewind-env.d.ts` (`/// <reference types="nativewind/types" />`) and the Babel preset
      (`["babel-preset-expo", { jsxImportSource: "nativewind" }]`, `"nativewind/babel"`), checked against
      nativewind.dev for 4.2.7 at write time.
- [ ] L3: the dark-mode paragraph becomes an EngineTabs block: NativeWind `useColorScheme().setColorScheme`
      from `nativewind`; Uniwind `Uniwind.setTheme` from `uniwind`.
- [ ] Commit `docs(registry-ui): ...`.

### Task 3: a native page's markdown is rendered for its engine (M2)

Skills: writing-unit-tests, writing-e2e-tests, structuring-a-frontend-app.

Files: `apps/registry-ui/src/lib/source.ts` (`pageMarkdown`), the native `[engine]` page and
`app/llms.mdx/native/components/[engine]/[[...slug]]/route.ts`, the MDX components that print install commands,
`components.json`, EngineTabs and NativePreview.

- [ ] Unit tests first: `pageMarkdown` for a native page given `{ engine, style }` returns markdown with no
      `<[A-Z]` JSX tag; `InstallCommand` becomes a fenced `bash` block `pnpm dlx shadcn@latest add @zui/<name>`;
      `ComponentsJson` a fenced `json` block with `"style": "<engine>-<style>"`; `EngineTabs` keeps only the
      page engine's tab body; `NativePreview` becomes the demo source as a fenced `tsx` block; links to
      `/native/components/nativewind/...` are rewritten to the page's engine.
- [ ] Implement as a markdown variant per MDX component, from the same page data the HTML renders; wire the
      page's Copy page, the `.md` route and llms output to it; e2e: `/native/components/uniwind/theme.md` and
      `/native/components/uniwind/button.md` carry `uniwind-vega` and no JSX tag; commit.

### Task 4: the Uniwind preview app

Skills: adding-a-project, wiring-a-task-target, declaring-a-dependency, adopting-a-library, writing-a-ci-workflow,
configuring-a-worker (secrets), writing-unit-tests.

Files: new `apps/native-preview-uniwind` (Expo app generated with `nx g @nx/expo:application ... --tags=build:remote`),
`.github/workflows/cd.yml`, `apps/registry-ui/package.json`.

- [ ] Generate the app; share the demo app code with `apps/native-preview` rather than copying it (move what
      both need, routing, demo lookup, error boundary, frame height, color scheme, into a place both import, e.g.
      a non-published lib or the existing app's `src/app` exported by path; decide by `adding-a-project`'s
      "share or each declare" test and ledger the call). Its Metro uses `withUniwind` and `global.css`; its
      `@/` alias points at `packages/native-ui/dist/src/uniwind-<style>`; style chosen at runtime as in
      `apps/native-preview` (one web export holds both styles).
- [ ] Its inferred `export` writes to `apps/registry-ui/public/native-preview-uniwind`; registry-ui's
      dev/build/wrangler:build depend on it; registry-ui-e2e gets it as an implicit dependency (never
      registry-ui, whose `^build` would run EAS Build).
- [ ] `eas init` once with the user's session for project `zui-native-preview-uniwind` (account
      `zeroxsolutions`); runtime `exposdk:58.0.0`; `eas:update` target, configuration `production`, branches
      `vega` and `nova`; a second `eas-update` call in cd.yml (or the deploy workflow's targets) runs it.
- [ ] Unit tests for anything new in the shared code; export once locally, open two demos in both styles,
      check they draw with Uniwind (a Uniwind-only difference visible: Input placeholder colour or Skeleton
      pulse); publish once by hand for both branches; commit.

### Task 5: the site draws a page's demo with the page's engine (M1)

Skills: writing-a-component, writing-component-tests, writing-e2e-tests.

Files: `apps/registry-ui/src/lib/native-preview.ts` (`nativePreviewSrc`, `expoGoUrl`),
`src/constants/native-preview-device.ts` (one project id per engine), native-preview-frame and the platform
select component, `content/native/docs/index.mdx` (the preview paragraph).

- [ ] Unit first: `nativePreviewSrc({ engine, style, demo, theme })` gives `/native-preview/...` for nativewind and
      `/native-preview-uniwind/...` for uniwind; `expoGoUrl({ engine, style, demo })` uses that engine's
      project id and the style's channel; component test: a uniwind page's frame src and QR link; e2e on
      `/native/components/uniwind/button?style=nova`; commit.

### Task 6: PortalHost and the non-overlay primitives

Skills: writing-a-component, writing-component-tests (jest-expo), declaring-a-dependency, writing-prose,
animating-a-component.

Items: alert, aspect-ratio, collapsible, accordion. Plus the PortalHost setup the overlays need.

- [ ] Per item, spec first (render, role/state, the variant classes resolve per style through the build's
      slot map), then source, demo, registry entry, docs page; accordion and collapsible animate with
      Reanimated and skip animation under reduced motion (spec asserts it).
- [ ] `PortalHost` in both preview apps' roots; the installation page gains a "Portal host" step for both
      engines (RNR's form).
- [ ] `build-registry` valid x4; `git diff` of `dist/r` limited to the new items; commit per item
      (`feat(native-ui): add <name>`).

### Task 7: the overlay primitives

Skills: as Task 6, plus writing-e2e-tests.

Items, in this order: dialog, alert-dialog, popover, tooltip, hover-card, dropdown-menu, context-menu, menubar,
select.

- [ ] Per item as in Task 6; specs cover open/close by trigger, outside press and back (`onRequestClose` /
      escape on web), focus moved into the content and returned to the trigger, roles and
      `aria-expanded`/checked states announced, reduced motion.
- [ ] e2e on the docs: dialog, select and dropdown-menu demos open and close in the web preview frame on both
      engines.
- [ ] `build-registry` valid x4; commit per item.

### Task 8: indexes and the native home

Skills: writing-prose, writing-e2e-tests.

- [ ] The native components index, `meta.json` order, search, sitemap and llms list all 31 primitives plus the
      zui items; `/native` home's demo grid unchanged unless a new item reads better (one swap at most);
      the coverage audit's table is now all "yes" (re-run the audit's comparison as a unit test over
      `registry.json` names against the RNR list pinned in the test); commit.
