# zui native: Vega's theme, Geist, and a Native section in the docs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An Expo app on either engine installs `@zui/theme` and gets Vega's neutral tokens (light and
dark, plus `success`/`warning`) and Geist in every weight Text uses; the registry site's header gains a
"Native" item leading to docs that say how to set the app up and how to add each RN item.

**Architecture:** The theme's colours come from a committed snapshot of upstream's `neutral.json`, the
same base colour the web registry uses, plus the web registry's own `success`/`warning`. The emitter
writes one `theme` item per engine, in the form that engine reads. Geist reaches the app through
`@expo-google-fonts/geist`; the translator turns a weight class on the text part into a family class,
because Android picks a custom font's weight only by family name. The docs are fumadocs pages under
`content/docs/native/`, with no live preview.

**Tech Stack:** as plan 2 (Expo SDK 58, RN 0.88, NativeWind 4.2.7 / Tailwind 3, Uniwind 1.13.0 /
Tailwind 4, Jest + RNTL, shadcn CLI 4.22.1), plus `expo-font` and `@expo-google-fonts/geist` 0.4.x;
fumadocs and Playwright on the registry site.

**Spec:** `docs/superpowers/specs/2026-10-21-zui-native-registry-design.md` (sections "Themes", "The RN
registry"). Plan 3 of the native work. The spec puts `zui-cli` in plan 3 too; it moves to plan 4, because
the docs must state the manual setup the CLI later automates, and the user asked for the docs item first.

## Global Constraints

- Everything in plan 2's Global Constraints still holds (paths `/r/styles/<engine>-vega/`, `@zui/<name>`,
  iOS and Android only, no `web:`, Vega sizes, no RNR code copied, nx by scoped name, open each file
  kind's gundam skill first).
- Colour snapshot: `https://ui.shadcn.com/r/colors/neutral.json`, committed as
  `packages/registry-native/styles/upstream/colors-neutral.json`, refreshed only by the
  `sync-upstream-styles` target.
- `success` and `warning` (and their `-foreground`) take the values the web `apps/registry-ui/registry.json`
  already ships, light and dark.
- Font families: `Geist_400Regular`, `Geist_500Medium`, `Geist_600SemiBold`, `Geist_700Bold` from
  `@expo-google-fonts/geist`. Class names: `font-sans` (400), `font-sans-medium`, `font-sans-semibold`,
  `font-sans-bold`.
- The header item reads `Native` and links `/docs/native`.
- Docs prose follows `writing-prose`, `cutting-ai-tells`, `writing-plain-ascii`.

## Review Focus

1. Dark mode on device: an app whose colour scheme is dark gets the dark tokens on both engines, not the
   light ones and not none. Each engine reads dark tokens a different way (Task 1 picks per engine and the
   install check in Task 3 compiles both).
2. A colour React Native cannot parse: upstream's tokens are `oklch(...)`; an engine that passes oklch
   to RN's colour parser draws nothing. The emitted NativeWind theme carries no `oklch(` (Task 1).
3. A weight class with no family: `font-medium` on Text with Geist loaded must draw Geist Medium, and a
   weight the theme does not map (`font-light`) fails the build, never falls back silently (Task 2).
4. Fonts not yet loaded: the docs say to hold the splash screen until `useFonts` resolves, and the
   example does it (Task 4).
5. The Native docs reachable: header item, sidebar root, search and sitemap all reach
   `/docs/native/*`, and the source spec catches a native page no meta.json lists (Task 4).

---

### Task 1: the `theme` item per engine

Skills: `wiring-a-task-target`, `writing-unit-tests`, `declaring-a-dependency`, `adopting-a-library`,
`writing-comments`.

**Files:**

- Modify: `packages/registry-native/tools/sync-upstream-styles.mts` (also fetch `colors-neutral.json`)
- Create: `packages/registry-native/styles/upstream/colors-neutral.json`
- Create: `packages/registry-native/src/build/theme.ts`, `theme.spec.ts`
- Modify: `packages/registry-native/tools/build-registry.mts`, `registry.json` (item `theme`,
  `registry:theme`), `src/build/emit.spec.ts`

**Interfaces:**

- Produces: `export function themeItem(colors: UpstreamColors, extra: TokenSet, engine: Engine): RegistryItem`
  in `theme.ts`; `UpstreamColors` is the snapshot's shape (read it, type only what is used).

- [ ] **Step 1: Decide each engine's delivery from its current docs**, and ledger it as a ruling. The
      outcome is fixed, the mechanism is not: after `shadcn add @zui/theme` into a fresh app with the engine
      set up as its docs say, `bg-background`, `text-foreground` ... `bg-success` resolve to Vega's values,
      light and dark. Expected shape: NativeWind via the item's `cssVars` (light, dark) plus
      `tailwind.config` (`theme.extend.colors` as `var(--token)`, `fontFamily`, `darkMode` as NativeWind
      wants); Uniwind via `cssVars` with `theme` (`@theme inline`) if Uniwind reads shadcn's `.dark` block,
      else a `registry:file` CSS in Uniwind's `@variant light` / `@variant dark` form.
- [ ] **Step 2: Tests first** in `theme.spec.ts`: for each engine the item holds every token of the
      snapshot's light and dark sets plus `success`, `success-foreground`, `warning`,
      `warning-foreground`; the NativeWind item holds no `oklch(` (converted to sRGB hex at build); the
      Uniwind item keeps oklch only if Step 1 found Uniwind compiles it to an RN colour, else hex too;
      the font families of the Global Constraints are declared. In `emit.spec.ts`: each built registry lists
      `theme`, and `shadcn registry validate` passes (already run by the target).
- [ ] **Step 3:** Run `pnpm exec nx test @zeroxsolutions/registry-native -- --testPathPatterns=theme`;
      expected FAIL.
- [ ] **Step 4:** Implement `themeItem` and wire it into `build-registry` and `sync-upstream-styles`. The
      oklch-to-hex conversion is a small pure function with its own cases (`oklch(1 0 0)` -> `#ffffff`,
      `oklch(0.145 0 0)` -> `#0a0a0a`, one chromatic value checked against a reference converter).
- [ ] **Step 5:** Run the target and the project's tests; expected PASS and `Registry is valid.` twice.
- [ ] **Step 6:** Commit: `feat(registry-native): ship vega's neutral theme for each engine`.

### Task 2: Geist through Text

Skills: `writing-a-component`, `writing-component-tests`, `writing-unit-tests`, `declaring-a-dependency`,
`writing-comments`.

**Files:**

- Modify: `packages/registry-native/src/build/translate.ts`, `translate.spec.ts` (text part: weight to family)
- Modify: `packages/registry-native/src/registry/ui/text.tsx`, `text.spec.tsx` (base class `font-sans`)
- Create: `packages/registry-native/src/registry/lib/fonts.ts` (exports `zuiFonts`, the map for
  `useFonts`), shipped in the `theme` item with `dependencies` `expo-font`, `@expo-google-fonts/geist`

**Interfaces:**

- Produces: `export const zuiFonts: Record<string, FontSource>` (keys the four family names).

- [ ] **Step 1: Tests first.** `translate.spec.ts`, both engines, text part: `font-normal` -> `font-sans`,
      `font-medium` -> `font-sans-medium`, `font-semibold` -> `font-sans-semibold`, `font-bold` ->
      `font-sans-bold`; `font-light` lands in `unknown`. `text.spec.tsx`: Text's classes start from
      `font-sans`, and a Button label carries `font-sans-medium` (Vega's button is `font-medium`).
      `emit.spec.ts`: no emitted file holds a bare `font-medium` / `font-semibold` / `font-bold`, and none
      sets `fontWeight`.
- [ ] **Step 2:** Run the focused tests; expected FAIL.
- [ ] **Step 3:** Implement as data rules beside the existing renames; add `fonts.ts` and the theme item's
      dependencies.
- [ ] **Step 4:** Run the project's tests and `build-registry`; expected PASS.
- [ ] **Step 5:** Commit: `feat(registry-native): draw text in geist by family, not weight`.

### Task 3: install check with the theme, per engine

No repo file changes (a registry fault found here goes back to Task 1 or 2 as a fix).

- [ ] **Step 1:** As plan 2's Task 7 (fresh `create-expo-app` per engine, engine set up per its docs,
      `components.json` with `<engine>-vega` and `@zui` at `http://localhost:8787/...`, the worker from
      `@zeroxsolutions/registry-ui:wrangler:dev`).
- [ ] **Step 2:** `npx shadcn@4.22.1 add @zui/theme @zui/button @zui/icon --yes`; `npx tsc --noEmit`;
      then `npx expo export --platform ios` and `--platform android`, which run each engine's CSS compiler.
      Expected: tsc exits 0, both exports succeed, and the compiled output (search the bundle for the
      `background` token) holds Vega's light and dark values, as RN colours.
- [ ] **Step 3:** Record per engine: files landed, deps added, the dark-mode mechanism observed, the
      exports' result. Note what only a device can show (the scheme switching at runtime).

### Task 4: the Native section of the docs

Skills: `structuring-a-frontend-app`, `writing-a-component`, `writing-unit-tests`, `writing-e2e-tests`,
`writing-prose`, `cutting-ai-tells`, `writing-plain-ascii`, `naming-a-declaration`.

**Files:**

- Modify: `apps/registry-ui/src/components/layout/site-header.tsx` (`navItems` gains
  `{ href: docsPageUrl(['native']), label: 'Native', pattern: ... }`, after Blocks)
- Modify: `apps/registry-ui/content/docs/meta.json` (root pages gain `native`)
- Create: `apps/registry-ui/content/docs/native/meta.json`, `index.mdx`, `installation.mdx`, `theme.mdx`,
  `text.mdx`, `icon.mdx`, `button.mdx`
- Modify: `apps/registry-ui/src/lib/source.spec.ts` (if its listing checks need the new folder),
  `apps/registry-ui-e2e/src/docs.spec.ts` (or the spec that owns the header)

Content:

- `index`: what zui native is (React Native items for iOS and Android, drawn in Vega, for NativeWind or
  Uniwind), which registry path serves which engine, what is in it so far, and that macOS/Windows apps use
  the web items through Electron.
- `installation`: a fresh Expo app; set up the engine (link each engine's own docs; list the floors:
  Uniwind >= 1.12.0 with Tailwind >= 4.3.3, NativeWind 4 with Tailwind 3.4); the `@/` alias in
  `tsconfig.json`; `declare module '*.css'` for TypeScript 6's side-effect import check (plan 2 Task 7);
  `components.json` with `"style": "nativewind-vega"` or `"uniwind-vega"` and the `@zui` entry; add
  `@zui/theme`; load `zuiFonts` with `useFonts` and hold the splash screen until it resolves (one code
  block).
- `theme`, `text`, `icon`, `button`: the install command, what lands, its props as the source declares
  them, one usage block; no live preview (state it once on `index`).

- [ ] **Step 1: Tests first.** e2e: the header carries a `Native` link to `/docs/native`, the page
      renders its h1, and the sidebar lists Installation, Theme, Text, Icon and Button under it. Unit: what
      `source.spec.ts` already enforces for meta.json reachability covers `native/` (add a case only if it
      does not).
- [ ] **Step 2:** Run `pnpm exec nx e2e @zeroxsolutions/registry-ui-e2e -- src/docs.spec.ts --project=chromium`;
      expected FAIL.
- [ ] **Step 3:** Write the header item, meta.json entries and pages.
- [ ] **Step 4:** Run the e2e (registry, docs, search, sitemap, llms specs) and
      `pnpm exec nx run-many -t lint,typecheck,test -p @zeroxsolutions/registry-ui`; expected PASS.
- [ ] **Step 5:** Commit: `feat(registry-ui): add the native section to the docs`.
