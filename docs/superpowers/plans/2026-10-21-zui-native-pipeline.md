# zui native: the source-to-registry pipeline, proven on Text, Icon and Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `https://ui.zeroxsolutions.com/r/styles/nativewind-vega/button.json` and
`.../uniwind-vega/button.json` serve a React Native Button (with Text and Icon) drawn in Vega, generated
from one engine-neutral source, and `shadcn add @zui/button` writes them into an Expo app.

**Architecture:** The RN source uses upstream's own style slots (`cn-button`, `cn-button-variant-default`,
...), the same names upstream's base components use. A committed snapshot of upstream's
`style-vega.css` maps each slot to Vega's classes; a translator keeps what React Native can render,
renames Tailwind 4 classes for NativeWind's Tailwind 3, and fails on any class it has no rule for. The
emitter writes one registry per engine x style, picks the engine's own file where the engines differ,
and runs `shadcn build`. The registry site copies the output under `/r/styles/`.

**Tech Stack:** nx 23.3.0 with `@nx/expo`, Expo SDK 58 / React Native 0.88 / React 19.3, `@rn-primitives/*`,
class-variance-authority, NativeWind 4.2.7 (Tailwind 3) and Uniwind 1.13.0 (Tailwind 4), Jest with
`jest-expo` and React Native Testing Library, shadcn CLI 4.22.1.

**Spec:** `docs/superpowers/specs/2026-10-21-zui-native-registry-design.md` (section "The RN registry").
Plan 2 of 5: plan 3 is `zui-cli` and the theme item, plan 4 the Expo preview app, plan 5 onward the
component batches.

## Global Constraints

- Registry paths: `/r/styles/nativewind-vega/{name}.json`, `/r/styles/uniwind-vega/{name}.json`, each
  with `registry.json`; registry `name` `zui`.
- An item's dependency on another RN item is `@zui/<name>`; consumers' `components.json` has
  `"style": "<engine>-vega"` and `"@zui": "https://ui.zeroxsolutions.com/r/styles/{style}/{name}.json"`.
- Targets: iOS and Android only. No `web:` classes and no `Platform.select({ web })` branches in emitted
  files.
- Vega's sizes as upstream draws them (Button default `h-9`, `sm` `h-8`, `lg` `h-10`, `icon` `size-9`);
  no `sm:` breakpoint step.
- Upstream snapshot pinned to shadcn-ui/ui `ba1503c64472b82256d9de95e2e62c5901a38e8b` (2026-10-19),
  file `apps/v4/registry/styles/style-vega.css`.
- zui writes its components; no file of React Native Reusables (RNR) is copied in. RNR may be read for
  how `@rn-primitives` is wired, and the engines' own docs for the NativeWind and Uniwind wrappers.
- Every task runs through nx by the scoped project name (`@zeroxsolutions/registry-native`,
  `@zeroxsolutions/registry-ui`, `@zeroxsolutions/registry-ui-e2e`).
- Before each task, open the gundam skill for every kind of file it touches; the task lists them.

## Review Focus

1. A Vega class the translator has never seen (upstream adds one): the build fails naming the slot and
   the class, never ships it or drops it silently (Task 3).
2. A slot the RN source uses that the snapshot does not define (a typo, or upstream renamed it): the
   build fails naming the file and the slot (Task 5).
3. The NativeWind output carrying a Tailwind 4-only class (`shadow-xs`, `rounded-xs`, `outline-hidden`):
   Tailwind 3 ignores it silently, so the emitted-file test asserts none is left (Task 5).
4. An emitted file importing the other engine, or still holding a `cn-` slot: asserted absent per
   engine (Task 5).
5. A Button that is disabled still firing `onPress`, or announcing no state: RNTL asserts
   `accessibilityState` and that the handler is not called (Task 4).

---

### Task 1: create `packages/registry-native`

Skills: `adding-a-project`, `declaring-a-dependency`, `wiring-a-task-target`.

**Files:**

- Create (generator): `packages/registry-native/` with `package.json` named
  `@zeroxsolutions/registry-native`, private, a Jest config on the `jest-expo` preset.
- Modify (generator): `nx.json`, `package.json`, `pnpm-lock.yaml`, `tsconfig.base.json` or project references.

- [ ] **Step 1:** `pnpm exec nx add @nx/expo` (version 23.3.0, matching nx).
- [ ] **Step 2:** Dry run, then read the printed file list:
      `pnpm exec nx g @nx/expo:library packages/registry-native --name=@zeroxsolutions/registry-native --unitTestRunner=jest --linter=eslint --dry-run`.
      Check that a `test` target is listed (an omitted flag can mean no target); run it without `--dry-run`.
- [ ] **Step 3:** Add runtime deps to the project: `@rn-primitives/slot`, `class-variance-authority`,
      `clsx`, `tailwind-merge`, `lucide-react-native`, `react-native-svg`; dev: `nativewind@4.2.7`,
      `uniwind@1.13.0`, `@testing-library/react-native@14.1.0`. A version shared with another project goes
      through the catalog only at its second declarer.
- [ ] **Step 4:** Verify: `pnpm exec nx show project @zeroxsolutions/registry-native --json` lists `test`,
      `lint`, `typecheck`; `pnpm exec nx test @zeroxsolutions/registry-native --passWithNoTests` succeeds.
- [ ] **Step 5:** Commit: `build(registry-native): add the react native registry project`.

### Task 2: the Vega snapshot and its slot map

Skills: `writing-unit-tests`, `declaring-a-type`, `naming-a-declaration`, `writing-comments`.

**Files:**

- Create: `packages/registry-native/styles/upstream/style-vega.css` (verbatim at the pinned commit)
- Create: `packages/registry-native/tools/sync-upstream-styles.mts`
- Modify: `packages/registry-native/package.json` (target `sync-upstream-styles`, run by hand with the
  commit as its argument; not a dependency of any build)
- Create: `packages/registry-native/src/build/slot-map.ts`, `slot-map.spec.ts`

**Interfaces:**

- Produces: `export type SlotMap = ReadonlyMap<string, readonly string[]>;` (slot name without the dot,
  for example `cn-button-variant-default`, to its classes in source order) and
  `export function parseSlotMap(css: string): SlotMap`.

- [ ] **Step 1: Test first.** `slot-map.spec.ts`:
      `it('maps each slot to the classes of its @apply, in order')` on a two-rule fixture inside
      `.style-vega { }` asserts `['bg-primary', 'text-primary-foreground', 'hover:bg-primary/80']` for
      `cn-button-variant-default`; `it('reads the pinned snapshot, cn-button-size-sm included')` asserts the
      real file has 441 slots and `cn-button-size-sm` contains `h-8`;
      `it('throws on a slot declared twice')`.
- [ ] **Step 2:** Run `pnpm exec nx test @zeroxsolutions/registry-native -- slot-map`; expected FAIL
      (module missing).
- [ ] **Step 3:** Implement `parseSlotMap` (rules are `.cn-<slot> { @apply <classes>; }`, one per block,
      comments `/* MARK: ... */` between). `sync-upstream-styles.mts` fetches the file at a commit given as
      its argument and overwrites the snapshot, so `git diff` shows what upstream changed.
- [ ] **Step 4:** Run again; expected PASS.
- [ ] **Step 5:** Commit: `feat(registry-native): read vega's slots from a pinned upstream snapshot`.

### Task 3: translate a slot's classes for an engine

Skills: `writing-unit-tests`, `declaring-a-type`, `writing-comments`.

**Files:**

- Create: `packages/registry-native/src/build/translate.ts`, `translate.spec.ts`

**Interfaces:**

- Consumes: Task 2's `SlotMap`.
- Produces: `export type Engine = 'nativewind' | 'uniwind';`
  `export type Part = 'view' | 'text';`
  `export interface Translation { classes: string[]; unknown: string[] }`
  `export function translateClasses(classes: readonly string[], engine: Engine, part: Part): Translation`.

On the web a slot's `text-*` class reaches the label through the cascade; React Native has none, so a
`Pressable` ignores it and the label takes it through `TextClassContext`. `part` splits a slot: `text`
keeps the typography classes (`text-<colour|size>`, `font-*`, `tracking-*`, `leading-*`, `italic`,
`underline`, `underline-offset-*`, `line-through`, `uppercase`, `lowercase`, `capitalize`, with
their `active:`, `disabled:` and `dark:` forms), `view` keeps the rest.

Rules, as data in `translate.ts`, each with the reason a reader cannot see:

- Dropped with their modifier: `hover:`, `focus-visible:`, `aria-*:`, `has-*:`, `in-data-*:`,
  `data-*:`, `group-*:`, `peer-*:`, `not-*:`, `*:`, `**:`, `[&...]:`, `supports-*:`, `print:`. No
  touch-screen state reaches them.
- Dropped classes: `outline-*`, `ring-*`, `ring-offset-*`, `transition-*`, `duration-*`, `ease-*`,
  `select-none`, `bg-clip-padding`, `whitespace-*`, `cursor-*`, `scroll-*`, `group/*`.
- Kept: `active:` and `disabled:` (both engines style a `Pressable`'s pressed and disabled state);
  `dark:`; every other plain utility.
- NativeWind only, Tailwind 4 to 3: `shadow-xs`->`shadow-sm`, `shadow-sm`->`shadow`, `rounded-xs`->`rounded-sm`,
  `rounded-sm`->`rounded`, `blur-xs`->`blur-sm`, `outline-hidden`->dropped.
- Anything with a modifier or shape not listed goes to `unknown`.

- [ ] **Step 1: Test first.** Cases, each named for the rule: drops hover and focus-visible and keeps
      the base (`['bg-primary','hover:bg-primary/80','focus-visible:ring-3']` -> `['bg-primary']`); keeps
      `active:` and `dark:`; renames `shadow-xs` to `shadow-sm` for nativewind and keeps it for uniwind;
      drops `data-open:animate-in` with its modifier; reports `starting:opacity-0` as unknown; splits
      `cn-button-variant-default`'s `['bg-primary','text-primary-foreground']` into `['bg-primary']` for
      `view` and `['text-primary-foreground']` for `text`; and one case over the real snapshot: every class
      of `cn-button`, `cn-button-variant-*` and `cn-button-size-*` translates for both parts with `unknown`
      empty.
- [ ] **Step 2:** Run `pnpm exec nx test @zeroxsolutions/registry-native -- translate`; expected FAIL.
- [ ] **Step 3:** Implement `translateClasses`.
- [ ] **Step 4:** Run again; expected PASS.
- [ ] **Step 5:** Commit: `feat(registry-native): translate vega's classes for each engine`.

### Task 4: Text, Icon and Button, written once

Skills: `writing-a-component`, `writing-component-tests`, `writing-unit-tests`, `adopting-a-library`,
`declaring-a-type`, `writing-comments`.

**Files:**

- Create: `packages/registry-native/src/registry/lib/utils.ts` (`cn`: `twMerge(clsx(inputs))`)
- Create: `packages/registry-native/src/registry/ui/text.tsx`, `text.spec.tsx`
- Create: `packages/registry-native/src/registry/ui/icon.nativewind.tsx`, `icon.uniwind.tsx`, `icon.spec.tsx`
- Create: `packages/registry-native/src/registry/ui/button.tsx`, `button.spec.tsx`

**Interfaces:**

- Produces: `Text`, `TextClassContext` (`text.tsx`), `Icon` (`icon.*.tsx`, prop `as: LucideIcon`),
  `Button`, `buttonVariants`, `ButtonProps` (`button.tsx`), with variants `default outline secondary
  ghost destructive link` and sizes `default xs sm lg icon icon-xs icon-sm icon-lg`, defaults `default`.

zui writes each file on `@rn-primitives/slot` and React Native's `Pressable` and `Text`. Style-dependent
classes are upstream's slot names: Button's root `cn-button`, each variant `cn-button-variant-<v>`,
each size `cn-button-size-<s>`, in `buttonVariants`; the same slots with a `/text` suffix
(`cn-button-variant-<v>/text`) in `buttonTextVariants`, which the Button hands its Text through
`TextClassContext`. Text's own class is `text-foreground text-base`, merged under the context's; its
typography variants come with a later batch. Icon wraps a lucide icon so it takes `className`: the
NativeWind file with `cssInterop` and the Uniwind file with `withUniwind`, each as that engine's docs
prescribe; Jest maps `icon` to the NativeWind one.

- [ ] **Step 1: Tests first** (RNTL, `screen.getByRole`):
      `button.spec.tsx`: `it('is a button that runs onPress')`; `it('announces disabled and does not run
  onPress when disabled')` asserting `accessibilityState.disabled === true` and the handler not called;
      `it('hands its Text the text classes of its variant')` rendering
      `<Button variant="outline"><Text>Save</Text></Button>` and asserting the Text's `className` equals
      what `buttonTextVariants({ variant: 'outline' })` returns. `text.spec.tsx`: `it('reads its class from
  TextClassContext')`, `it('renders as a heading with role="heading" for h1')`. `icon.spec.tsx`:
      `it('renders the lucide icon it is given')`.
- [ ] **Step 2:** Run `pnpm exec nx test @zeroxsolutions/registry-native -- ui/`; expected FAIL.
- [ ] **Step 3:** Write the three components.
- [ ] **Step 4:** Run again; expected PASS.
- [ ] **Step 5:** Commit: `feat(registry-native): write text, icon and button once, on vega's slots`.

### Task 5: emit a registry per engine x style

Skills: `wiring-a-task-target`, `writing-unit-tests`, `making-a-sweeping-edit` (the slot rewrite is
one), `writing-comments`.

**Files:**

- Create: `packages/registry-native/registry.json` (engine-neutral item list: `text`, `icon`, `button`,
  their files, `dependencies`, `registryDependencies` as `@zui/<name>`)
- Create: `packages/registry-native/src/build/emit.ts`, `emit.spec.ts`
- Create: `packages/registry-native/tools/build-registry.mts`
- Modify: `packages/registry-native/package.json` (target `build-registry`, outputs `{projectRoot}/dist/r`)

**Interfaces:**

- Consumes: `parseSlotMap`, `translateClasses`, `Engine`.
- Produces: `export function emitSource(source: string, slots: SlotMap, engine: Engine): string`
  (replaces every `cn-<slot>` token inside a string literal with its `view` classes and every
  `cn-<slot>/text` token with its `text` classes, removes the
  token where the translation is empty, throws `Unknown slot <slot> in <file>` or
  `Untranslated <class> in <slot>`); output directory `dist/r/styles/<engine>-vega/`.

- [ ] **Step 1: Tests first.** `emit.spec.ts`: replaces `'cn-button cn-button-variant-default'` with
      Vega's translated classes for each engine; throws on `cn-buton`; throws when a slot holds an unknown
      class. A build test over the real output (run after the target): for each engine, no file contains
      `cn-`, `web:` or the other engine's package name; the NativeWind files contain none of `shadow-xs`,
      `rounded-xs`, `outline-hidden`; every `@zui/<name>` dependency is an item of the same registry; Button
      `size="default"` carries `h-9`.
- [ ] **Step 2:** Run `pnpm exec nx test @zeroxsolutions/registry-native -- emit`; expected FAIL.
- [ ] **Step 3:** Implement `emitSource` and `tools/build-registry.mts`: per engine, write the emitted
      files and a registry.json (`name` `zui`, `homepage` `https://ui.zeroxsolutions.com`, the engine's file
      for `icon`, the engine package in `dependencies`) into a temporary directory, run `shadcn build -o
  dist/r/styles/<engine>-vega`, then `shadcn registry validate`. Wire it as the project's
      `build-registry` target.
- [ ] **Step 4:** Run `pnpm exec nx run @zeroxsolutions/registry-native:build-registry` then the tests;
      expected PASS and `Registry is valid.` twice.
- [ ] **Step 5:** Commit: `feat(registry-native): emit a registry for each engine in vega`.

### Task 6: serve it from the registry site

Skills: `wiring-a-task-target`, `writing-e2e-tests`, `deploying-a-frontend-app`, `declaring-a-dependency`.

**Files:**

- Modify: `apps/registry-ui/package.json` (`devDependencies`: `@zeroxsolutions/registry-native:
  workspace:*`; `shadcn-build` `dependsOn` `@zeroxsolutions/registry-native:build-registry`)
- Modify: `apps/registry-ui/package.json` (one more `shadcn-build` command, after the copies and
  before validate: `cp -R ../../packages/registry-native/dist/r/styles/. public/r/styles/`)
- Modify: `apps/registry-ui-e2e/src/registry.spec.ts`

- [ ] **Step 1: Test first.** Add to `registry.spec.ts`:
      `test('serves the react native items for each engine in vega')`, for `nativewind-vega` and
      `uniwind-vega`: the index is 200 with `name` `zui` and lists `button`, `icon`, `text`; `button.json`
      has file content and `registryDependencies` containing `@zui/text`.
- [ ] **Step 2:** Run `pnpm exec nx e2e @zeroxsolutions/registry-ui-e2e -- src/registry.spec.ts
  --project=chromium`; expected FAIL with 404.
- [ ] **Step 3:** Wire the dependency and the copy.
- [ ] **Step 4:** Staleness check: delete `packages/registry-native/dist` and
      `apps/registry-ui/public/r`, run the e2e with `--skip-nx-cache`; expected PASS.
- [ ] **Step 5:** Commit: `feat(registry-ui): serve the react native registry under its styles`.

### Task 7: install check in an Expo app per engine

No repo file changes.

- [ ] **Step 1:** Start `pnpm exec nx run @zeroxsolutions/registry-ui:wrangler:dev`.
- [ ] **Step 2:** For each engine, outside the repo: `npx create-expo-app@latest zui-<engine> --template
  blank-typescript`; install the engine as its docs prescribe (NativeWind 4: `nativewind`,
      `tailwindcss@^3.4.17`, babel and metro config; Uniwind: `uniwind`, `tailwindcss@^4`, metro config);
      `components.json` with `"style": "<engine>-vega"` and `"@zui": "http://localhost:8787/r/styles/{style}/{name}.json"`.
- [ ] **Step 3:** `npx shadcn@4.22.1 add @zui/button --yes`, then `npx tsc --noEmit`.
      Expected: the worker log shows only `/r/styles/<engine>-vega/` paths; `components/ui/` holds
      `button.tsx`, `text.tsx`, `icon.tsx`; the typecheck exits 0.
- [ ] **Step 4:** Record both results in the PR body.
