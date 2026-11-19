# Animated icons in every control, web and native: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every icon in a control or a state report inside zui's own items is animated and started by its
control, on web and native, and native publishes a twin of every web animated icon.

**Architecture:** The web set grows by 35 lucide-animated-style icons, and the remaining static control
positions are swapped onto them. Native gains the same 73 names as registry items under
`src/registry/icons/`. Each is a lucide-shaped component drawn through the existing `Icon`, animated with
Reanimated over `react-native-svg`, and moved by a shared `useIconMotion` hook. A parity case keeps the two
sets in step. Native components then swap onto them.

**Tech Stack:** React 19.3, Motion (`motion/react`), Vitest; React Native 0.88, Reanimated 4,
`react-native-svg`, `lucide-react-native` 1.72.0, Jest (jest-expo) with RNTL; nx; shadcn registry.

**Spec:** `docs/superpowers/specs/2026-11-16-animated-icons-design.md`

## Global Constraints

- PATH first in every shell: `export PATH=$HOME/.local/share/mise/installs/node/24.22.1/bin:$HOME/.local/share/mise/installs/pnpm/10.33.0:$PATH`. Homebrew pnpm wipes `node_modules`.
- Never stage `apps/registry-ui/next-env.d.ts`, `apps/registry-editor-docs-zone/next-env.d.ts` or `apps/native-preview-uniwind/uniwind-types.d.ts`.
- Commits: `git commit -F <file>`, subject of at most 72 characters, ending `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Every authored file is plain ASCII.
- Every icon, on both platforms, exposes `startAnimation(): void` and `stopAnimation(): void` through its ref. Its start does nothing under reduced motion. Its motion lasts under 600 ms and ends where it started.
- Web icon: the lucide-animated shape of `packages/ui/registry/bases/base-ui/icons/copy-icon.tsx`, with a `span` wrapper, `forwardRef`, `useReducedMotion` checked in the start, the lucide-animated MIT header line, and a registry item `<name>-icon` of type `registry:ui` with target `components/general/<name>-icon.tsx`.
- New icon motion: follow lucide-animated (https://github.com/pqoqubbw/icons) where it has the icon. Otherwise move the glyph's own parts once.
- Native icon: `src/registry/icons/<name>-icon.tsx` in `packages/native-ui`. It takes `LucideProps` and copies its path data from `lucide-react-native` 1.72.0. It carries `accessibilityElementsHidden` and `importantForAccessibility="no-hide-descendants"` on its root. It uses the same timing values as its web twin. It is one file the registry ships alone, apart from `@zui/motion` and the new `@zui/icon-motion`.
- Controls start the icon from the control. On web that is pointer enter and focus, stopped on leave and blur. On native it is press-in and focus, and press-out does not cut the motion short. A state icon plays once when it appears: the parent calls `startAnimation()` in an effect when the state flips.
- Leave the upstream primitives' own icons static (web `ui/`, native `ui/`). A native port may gain forwarding of `onPressIn`, `onFocus` or `onBlur`, nothing else.
- Static content stays static: placeholders, empty states, previews that are not controls.

## Review Focus

1. A native icon swapped into a disabled `Button` or a dark-mode screen must take the muted or dark colour as the static icon did. Task 10 asserts the colour of a swapped icon inside a disabled Button.
2. A slash-menu row reached by the arrow keys, not by the pointer, must start its icon: the highlighted row is the keyboard's focus there. Task 3 adds the case.
3. A state icon whose state flips back before its motion ends (Copy, then Check, then Copy within the timeout) must not throw from an unmounted handle. Task 10 adds the case to copy-button. Web copy-button already has one.
4. Third-party features passing an element as `icon` (the editor-core type is `unknown`) must still render, statically. Task 3 adds the case.
5. A ref passed through native `Icon` must reach the animated glyph under both engines, Uniwind and NativeWind. Task 9 tests it once per engine file.

---

## Branches

There are three pull requests, each green on its own, stacked when the one below is not yet merged.

- **PR 1** `feat/animated-icons-web`, from `docs/animated-icons-spec` (it carries the spec and this plan): Tasks 1-5.
- **PR 2** `feat/animated-icons-native-set`: Tasks 6-8.
- **PR 3** `feat/animated-icons-native-controls`: Tasks 9-10.

Web commands run in `packages/ui`: `pnpm exec vitest run <spec>`, `pnpm exec eslint <paths>`, `pnpm exec tsc -p tsconfig.json --noEmit`. The project run is `pnpm nx run @zeroxsolutions/ui:test` from the root, and the registry build is `pnpm nx run @zeroxsolutions/ui:build-registry`.

Native commands run in `packages/native-ui`: `pnpm exec jest <spec>`. The project run is `pnpm nx run @zeroxsolutions/native-ui:test`, and the registry build is `pnpm nx run @zeroxsolutions/native-ui:build-registry`.

Before each PR, run the whole-tree staleness check: build the registries, then `git status --short` lists nothing unexpected.

---

### Task 1: Web, the 7 component icons and ChevronUp

**Files:**

- Create: `packages/ui/registry/bases/base-ui/icons/{trash-2,circle-x,plane,dumbbell,lightbulb,hash,flag,chevron-up}-icon.tsx`
- Modify: `packages/ui/registry.json` (8 items, alphabetical among the icons)
- Test: `packages/ui/registry/bases/base-ui/icons/animated-icons.spec.tsx` (walks every `*-icon.tsx`; unchanged)

**Interfaces:**

- Produces: `Trash2Icon`, `CircleXIcon`, `PlaneIcon`, `DumbbellIcon`, `LightbulbIcon`, `HashIcon`, `FlagIcon`, `ChevronUpIcon`, each with a `<Name>IconHandle` type, from `@/registry/bases/base-ui/icons/<name>-icon`.

- [ ] **Step 1:** Add the 8 registry items first, copying `copy-icon`'s shape. Run `pnpm exec vitest run registry/registry.spec.ts`. Expected: FAIL, because the files are missing.
- [ ] **Step 2:** Write the 8 icons. Copy the path data from `lucide-react` at the installed version.
- [ ] **Step 3:** Run `pnpm exec vitest run registry/registry.spec.ts registry/bases/base-ui/icons/animated-icons.spec.tsx`. Expected: PASS, with the 8 new icons listed in the walker's cases.
- [ ] **Step 4:** Lint and typecheck the icons folder, then commit `feat(ui): animate trash, circle-x, emoji category and chevron-up icons`.

### Task 2: Web, the 27 editor icons

**Files:**

- Create: `packages/ui/registry/bases/base-ui/icons/<name>-icon.tsx` for strikethrough, code, highlighter, heading-1, heading-2, heading-3, list, list-ordered, list-todo, text-quote, minus, info, image, link, table, frame, sigma, radical, omega, workflow, pencil-line, download, plus, maximize, rotate-ccw, grip-vertical, settings-2
- Modify: `packages/ui/registry.json` (27 items)

**Interfaces:**

- Produces: `<PascalName>Icon` and `<PascalName>IconHandle` per file, for example `Heading1Icon` and `Settings2Icon`.

- [ ] Steps as in Task 1: registry items first (RED), then the icons, then the same two specs (PASS), then lint, typecheck and commit `feat(ui): animate the editor's toolbar, menu and control icons`.

### Task 3: Web, the editor chrome starts an icon it is given

**Files:**

- Create: `packages/ui/registry/bases/base-ui/editor/document/ui/chrome-icon.tsx`
- Modify: `slash-menu.tsx`, `editor-toolbar.tsx`, `bubble-menu.tsx`, `block-menu.tsx` in that folder
- Modify: every feature under `editor/document/features/*` that hands an `icon` to a slash, toolbar or bubble item: standard-ui, code-block, callout, link, table, image, embed, math, mermaid and toggle
- Test: `editor/document/ui/chrome.spec.tsx`, `editor/document/ui/slash-menu.browser.spec.tsx`

**Interfaces:**

- Consumes: the icons from Tasks 1-2 and the existing `BoldIcon`, `ItalicIcon` and `UnderlineIcon`.
- Produces: `type AnimatedIconComponent = ComponentType<{ className?: string; 'aria-hidden'?: boolean; ref?: Ref<AnimatedIconHandle> }>`, `interface AnimatedIconHandle { startAnimation(): void; stopAnimation(): void }` and `function ChromeIcon(props: { icon: unknown; className?: string; active: boolean }): ReactNode` in `chrome-icon.tsx`. `ChromeIcon` renders an animated component with a ref, starting it while `active` turns true and stopping it when `active` turns false. It renders any other `ReactNode` as given. Features pass the component (`icon: CodeIcon`), not an element.

- [ ] **Step 1: Failing cases in `chrome.spec.tsx`.** Mock one icon module with a handle of `vi.fn()` start and stop, as `components/data-display/data-table-column-header.spec.tsx` does.
  - `it('starts a toolbar button's icon on pointer enter and on focus, and stops it on leave and blur')`
  - `it('starts a slash row's icon when the arrow keys highlight it')`: press ArrowDown and expect `startAnimation` called once for the second row
  - `it('renders an element icon a feature passes, without a handle')`: `icon: <svg data-testid="plain" />` renders
- [ ] **Step 2:** Run `pnpm exec vitest run registry/bases/base-ui/editor/document/ui/chrome.spec.tsx`. Expected: FAIL.
- [ ] **Step 3:** Write `ChromeIcon` and render every item's icon through it. In the toolbar and bubble menu, `active` is pointer-over or focus. In the slash and block menus, `active` is the highlighted row. Then swap the features' icons onto components.
- [ ] **Step 4:** Run the spec (PASS), then `slash-menu.browser.spec.tsx` (PASS, unchanged behaviour), then commit `feat(ui): editor chrome starts the animated icon of a highlighted item`.

### Task 4: Web, the editor's own controls

**Files:**

- Modify: `editor/document/features/math/math.tsx` (Apply Check, Cancel X, View tab Eye, Edit PencilLine)
- Modify: `editor/document/features/mermaid/mermaid.tsx` (View Eye, Edit PencilLine)
- Modify: `editor/document/features/toggle/toggle.tsx` (ChevronRight on the toggle control)
- Modify: `editor/document/features/code-block/code-settings-menu.tsx` (Settings2 trigger)
- Modify: `editor/math/react/toolbar.tsx` and `editor/mermaid/react/toolbar.tsx` (Download, export-done Check, Copy x2, Image)
- Modify: `editor/mermaid/react/preview.tsx` (zoom Plus, Minus, Maximize, RotateCcw buttons)
- Modify: `editor/document/react/editor.tsx` (block-handle GripVertical, Plus)
- Modify: `editor/composer/chat-input.tsx` (Send ArrowUp)
- Modify: `registry.json` `registryDependencies` of each touched item
- Test: the spec beside each file, or `chrome.spec.tsx` where none exists

Placeholders stay static: the Sigma and Workflow glyphs in an empty preview, and the slash entries already covered by Task 3.

- [ ] **Step 1:** For each control, add a failing case that its pointer enter and focus start its icon and its leave and blur stop it, using the same mock as Task 3. For export-done, add `it('plays the check once when the export finishes')`.
- [ ] **Step 2:** Run the specs. Expected: FAIL.
- [ ] **Step 3:** Swap onto the icons: the control holds the ref and passes the handlers to the primitive, as `components/feedback/copy-button.tsx` does. The export-done state starts its check in an effect.
- [ ] **Step 4:** Run the specs (PASS), lint and typecheck, then commit `feat(ui): animate the editor's own controls`.

### Task 5: Web, the components' remaining positions, then PR 1

**Files:**

- Modify: `components/data-entry/avatar-picker.tsx` (selected Check, remove Trash2)
- Modify: `components/feedback/permission-card.tsx` (pending Circle, denied CircleX)
- Modify: `components/data-entry/emoji-picker.tsx` (Plane, Dumbbell, Lightbulb, Hash, Flag category toggles, wired like its existing animated categories)
- Modify: `components/layout/model-list.tsx` (Trash2)
- Modify: `components/data-display/data-table.tsx` (Settings2 view-options trigger)
- Modify: `registry.json` `registryDependencies` of each
- Test: each component's spec

- [ ] **Step 1:** Add the failing start and stop cases. avatar-picker's Check and permission-card's states are state icons and play once on appearing.
- [ ] **Step 2:** Run the specs. Expected: FAIL.
- [ ] **Step 3:** Swap the icons.
- [ ] **Step 4:** Run the specs. Expected: PASS.
- [ ] **Step 5:** Run `grep -rln "from 'lucide-react'"` over `components` and `editor`. What is left must be static positions, `file-type-icon`'s type import, or icons only `ui/` primitives draw.
- [ ] **Step 6:** Commit `feat(ui): animate the remaining component controls`.
- [ ] **Step 7:** Run `pnpm nx run @zeroxsolutions/ui:test` and `build-registry`, then the staleness check. Push and open PR 1.

### Task 6: Native, the shared motion, the folder and the walker

**Files:**

- Create: `packages/native-ui/src/registry/lib/icon-motion.ts`, `icon-motion.spec.tsx`
- Create: `packages/native-ui/src/registry/icons/icons.spec.tsx` (the walker)
- Modify: `packages/native-ui/src/build/sources.ts` (`APP_FOLDERS`: `['icons', 'components/general']`)
- Modify: `packages/native-ui/src/build/web-twins.spec.ts`
- Modify: `packages/native-ui/registry.json` (item `icon-motion`, `registry:lib`, dependencies `react-native-reanimated`, registryDependencies `@zui/motion`)

**Interfaces:**

- Produces: `interface IconHandle { startAnimation(): void; stopAnimation(): void }`, `type AnimatedIconProps = LucideProps & { ref?: Ref<IconHandle> }`, and `function useIconMotion(ref: Ref<IconHandle> | undefined, timing: IconTiming): SharedValue<number>` in `lib/icon-motion.ts`.
  - `IconTiming` is `{ duration: number; easing?: EasingFunction }` or `{ spring: WithSpringConfig }`.
  - The returned progress runs 0 to 1 to 0 on start (`withSequence`).
  - It is set to 0 at once on stop.
  - It never moves while `useReducedMotion()` from `lib/motion` is true.

- [ ] **Step 1: Failing cases.**
  - `icon-motion.spec.tsx`:
    - `it('runs progress out and back on start')`: fake timers, mid-time value above 0, end value 0
    - `it('leaves progress at 0 under reduced motion')`: mock `isReduceMotionEnabled` true, as `components/general/animated-grid-pattern.spec.tsx` does
    - `it('returns progress to 0 on stop')`
  - `web-twins.spec.ts`: `it('has a native twin of every web animated icon')` lists web `registry:ui` items named `*-icon` that are absent from the native registry, and expects `[]`.
- [ ] **Step 2:** Run `pnpm exec jest src/registry/lib/icon-motion.spec.tsx src/build/web-twins.spec.ts`. Expected: FAIL. The parity case lists all 73 names.
- [ ] **Step 3:** Write `useIconMotion`, the `APP_FOLDERS` entry and the registry item.
- [ ] **Step 4:** Write the walker `icons.spec.tsx`. It finds every `./*-icon.tsx` through `require.context` (or `readdirSync` plus `require`) and, per icon:
  - it renders inside `Icon as={<Name>Icon}`;
  - the root is hidden from accessibility (`isHiddenFromAccessibility`);
  - the rendered tree at mid-motion differs from the resting tree after `startAnimation()`, and does not differ under reduced motion;
  - after `stopAnimation()` the tree equals the resting tree.

  If Reanimated's Jest setup does not reflect `useAnimatedProps` in the tree, assert the progress through a spy on `useIconMotion`'s returned value instead. Ledger that ruling.

- [ ] **Step 5:** Run the icon-motion spec (PASS). The parity case stays RED until Task 8. Commit `feat(native-ui): add the icon motion hook and the icon walker`.

### Task 7: Native, the 38 existing icons

**Files:**

- Create: `packages/native-ui/src/registry/icons/<name>-icon.tsx` for each of the 38 web names in `packages/ui/registry/bases/base-ui/icons`
- Modify: `packages/native-ui/registry.json` (38 items: `registry:ui`, dependencies `react-native-reanimated` and `react-native-svg`, registryDependencies `@zui/icon-motion`)

**Interfaces:**

- Consumes: `useIconMotion`, `AnimatedIconProps` and `IconHandle` from Task 6.
- Produces: `<PascalName>Icon` per file, with the same export names as web.

- [ ] **Step 1:** Port each icon. Translate the web variants into `useAnimatedProps` over `Animated.createAnimatedComponent(Path | Rect | Circle | G)`, interpolating from the progress. Take the transition from the web file: a spring goes in as `{ spring }`, a duration in ms.
- [ ] **Step 2:** Run `pnpm exec jest src/registry/icons/icons.spec.tsx`. Expected: PASS for 38.
- [ ] **Step 3:** Commit `feat(native-ui): port the 38 animated icons`.

### Task 8: Native, the 35 new icons, then PR 2

**Files:**

- Create: native twins of the 35 icons from Tasks 1-2
- Modify: `packages/native-ui/registry.json` (35 items)

- [ ] **Step 1:** Port as in Task 7.
- [ ] **Step 2:** Run `pnpm exec jest src/registry/icons/icons.spec.tsx src/build/web-twins.spec.ts`. Expected: PASS, and the parity case is now green.
- [ ] **Step 3:** Commit `feat(native-ui): add the native twins of the new animated icons`.
- [ ] **Step 4:** Run `pnpm nx run @zeroxsolutions/native-ui:test` and `build-registry`, then the staleness check. Push and open PR 2.

### Task 9: Native, the ref reaches the glyph, and ports forward the handlers

**Files:**

- Modify (only if a case fails): `packages/native-ui/src/registry/ui/icon.uniwind.tsx`, `icon.nativewind.tsx`
- Modify (only if a case fails): a `ui/` port a control in Task 10 renders that drops `onPressIn`, `onFocus` or `onBlur`: Toggle, ToggleGroupItem, Collapsible trigger, Badge-as-button
- Test: `ui/icon.uniwind.spec.tsx`, `ui/icon.spec.tsx`, and each touched port's spec

- [ ] **Step 1: Failing cases.**
  - `it('hands its ref to the glyph it draws')` in both Icon specs: render `<Icon as={CopyIcon} ref={ref} />` and expect `ref.current.startAnimation` to be a function.
  - `it('forwards onPressIn, onFocus and onBlur')` for each port Task 10 needs.
- [ ] **Step 2:** Run them. Make only the failing ones pass, by forwarding without adding any icon.
- [ ] **Step 3:** Commit `fix(native-ui): Icon and ports hand animated icons their ref and press`.

### Task 10: Native, swap the components, then PR 3

**Files:**

- Modify, under `packages/native-ui/src/registry/components`:
  - copy-button (Copy; Check plays once on copy)
  - password-input (Eye, EyeOff)
  - password-strength (Circle, CircleCheck as states)
  - permission-card (Circle, CircleCheck, CircleX as states)
  - avatar-picker (Check state, Trash2)
  - tag-input (X)
  - editor-tab (X)
  - emoji-picker (the nine categories)
  - reasoning-collapsible (Brain, ChevronUp, ChevronDown)
  - collapsible-card (ChevronUp, ChevronDown)
  - model-list (Trash2)
  - data-table (ChevronLeft, ChevronRight, Settings2)
  - data-table-column-header (ChevronsUpDown, ArrowUp, ArrowDown, EyeOff)
  - tree-item and file-tree (ChevronRight)
- Modify: `packages/native-ui/registry.json` `registryDependencies` of each
- Test: each component's spec

- [ ] **Step 1: Failing cases per component.** `jest.mock` the icon module with a `forwardRef` stand-in whose handle is `jest.fn()` start and stop:
  - `it('starts its icon on press-in and on focus')`;
  - for state icons, `it('plays the <state> icon once when <state> is reached')`;
  - copy-button: `it('does not throw when the state flips back before the motion ends')`;
  - one disabled-Button case in copy-button: `it('draws its icon in the disabled colour')`, which compares the colour with the static icon's on master.
- [ ] **Step 2:** Run the specs. Expected: FAIL.
- [ ] **Step 3:** Swap `as={Copy}` to `as={CopyIcon}` with a ref, and start from the control's `onPressIn` and `onFocus`.
- [ ] **Step 4:** Run the specs. Expected: PASS.
- [ ] **Step 5:** Commit `feat(native-ui): animate the icons in zui's native controls`.
- [ ] **Step 6:** Run `pnpm nx run @zeroxsolutions/native-ui:test` and `build-registry`, then the staleness check. Push and open PR 3.
