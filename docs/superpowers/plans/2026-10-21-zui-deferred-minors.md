# zui: the deferred minors of plans 2-6 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The minors the plan 2-6 reviews deferred are fixed where code or docs can fix them; what only a
device or Figma can settle is listed, not guessed.

**Architecture:** No new design. Each task is a batch of small fixes in one area of
`packages/native-ui` (renamed from `registry-native` in `369d4763`), `apps/registry-ui` web items, or the
docs, each fix test first where it changes behaviour.

**Tech Stack:** as plans 2-6.

**Spec:** `docs/superpowers/specs/2026-10-21-zui-native-registry-design.md`; the minors are quoted from
`.superpowers/plan{2,3,4,5,6}-rulings.md` ("Deferred minors").

## Global Constraints

- Everything in plans 2-6's Global Constraints holds. The package is now `@zeroxsolutions/native-ui` at
  `packages/native-ui`; every nx command names it.
- Four registries stay valid: `build-registry` prints "Registry is valid." four times.
- A behaviour change gets a test that failed first; a docs or comment change needs none.
- Out of scope, stays a device/Figma check: dark switching, Android OTP selection, focus kept by the
  password toggle, what VoiceOver/TalkBack read, iOS card shadow clip, the Android 0.02 opacity, Figma
  layout comparisons, Uniwind Icon explicit-prop precedence at runtime.

## Review Focus

1. A merge of caller props over component state (Button `accessibilityState`, Toggle role/selected,
   TabBarItem) keeps the component's state and the caller's other fields (Task 2).
2. OTP paste into a partly filled field gives the pasted code, not a concatenation (Task 3).
3. The toolbar is named and heard when it appears (Task 3).
4. Translator changes leave every emitted class of every item unchanged except where a task names it
   (Task 1).
5. Web tab bar bottom placement clears the home indicator (Task 4).

---

### Task 1: build pipeline

Files under `packages/native-ui/src/build/`, `tools/`, `nx.json`.

- Build errors name the style and engine (`Untranslated <class> in <slot> (<engine>-<style>)`, same for
  unknown slot/state, empty state).
- `resolveRadiusLessLength` rounds to 2 decimals and clamps at 0.
- SLOT_RULE reading strips CSS comments first; docblock states plain-slot-only scope.
- `renamed[utility]` lookups use own keys only (`Object.hasOwn` or a Map).
- KEPT_MODIFIERS docblock: `dark` is a colour scheme, not a Pressable state.
- Emitted cva drops empty-string variant values only if the shadcn CLI and both engines accept the
  result; otherwise ledger why it stays.
- Contracts (docblocks) on `Engine`, `Part`, `Translation`.
- emit.ts imports one style (extension or not, as the package's other build files); engine package
  ranges read from `package.json` devDependencies, not a second hardcoded table, and the icon item's
  declared ranges match what the install checks tested (`nativewind ^4.2.7`, `uniwind ^1.13.0`).
- `emit.spec` icon test asserts the item exists before reading its file.
- `nx.json` production input excludes `jest.config.cts` too.
- [ ] Tests first for the error text, radius rounding, comment stripping, ranges; implement; build valid
      x4; check `git diff` of `dist/r` before/after shows only the named changes; commit
      `fix(native-ui): name the style in build errors and tidy the translator`.

### Task 2: native primitives

Files under `packages/native-ui/src/registry/ui/` and `lib/`.

- Button: a caller's `accessibilityState` merges with `disabled`, and `disabled` undefined does not
  overwrite the caller's.
- Toggle: a caller may set `accessibilityRole`; `pressed` wins over a caller's `aria-selected`.
- Avatar: `loaded` resets when `AvatarImage` unmounts or its source changes; the fallback is hidden from
  accessibility while the image is loading so the name is read once.
- Text: `!font-bold` / `font-bold!` map to the family as `font-bold` does.
- icon.uniwind: the mapped `className` is not passed on to the Svg.
- `zuiFonts` keeps its keys in its type (`as const satisfies Record<string, FontSource>`).
- Switch: the thumb slides (Animated translate over ~150ms, reduced motion respected) instead of
  jumping.
- InputOTP: `aria-label` (or `accessibilityLabel`) required by type.
- radio dot spec cannot pass when the dot is missing.
- [ ] Tests first per item; implement; build x4; commit per item group
      (`fix(native-ui): ...`).

### Task 3: native ZUI components

Files under `packages/native-ui/src/registry/components/`.

- InputOTP/CodeInput paste: a paste (text grows by more than one character at once) replaces the code
  with the pasted characters, cut to length.
- UnsavedChangesToolbar: the group is named by its message (`aria-labelledby` + `nativeID`, or the
  message string as `accessibilityLabel`); the message is announced on mount too (`announceForAccessibility`
  on both platforms at mount; on change iOS announce, Android live region as now); centred with
  `max-w-lg` on wide screens.
- TabBar: a floating bar on the left or right is vertically centred (wrapper as needed).
- PasswordStrength requirement icon test asserts by icon component, not lucide path data.
- CodeInput spec finds slots by `testID` the slot accepts, not by walking parents.
- [ ] Tests first; implement; build x4; docs pages updated where behaviour changed; commit per component.

### Task 4: web ZUI items

Files under `apps/registry-ui/registry/bases/base-ui/components/` and their examples/docs.

- Tab bar at the bottom pads `pb-[env(safe-area-inset-bottom)]` (top: `pt-[env(safe-area-inset-top)]`)
  so the home indicator does not cover it; docs say the page needs `viewport-fit=cover`.
- Tab bar list keeps list semantics in Safari (`role="list"` on the `ul`).
- A preview renders `labels="none"`.
- Docs say a fixed toolbar or tab bar can cover content and focus, and how to pad for it.
- [ ] Tests first; implement; lint/typecheck/test and the component-page e2e; commit
      `fix(registry-ui): keep the tab bar clear of the home indicator`.

### Task 5: docs

Files under `apps/registry-ui/content/docs/native/` and the native e2e.

- input-otp page: the last slot is active on a full code; an empty code passes `pattern`.
- Titles in sentence case (`Input group`, `Input OTP`) with the e2e and registry titles updated together.
- Spinner in the same place in `meta.json` and the index list.
- toggle.mdx lists `aria-invalid`; textarea.mdx mid-sentence colon; label colons in the index list.
- password-input page: "leaves focus in the field" stated as what the toggle does not do (it does not
  move focus), and "ghost icon-xs by default".
- installation: NativeWind tab names react-native-reanimated and react-native-safe-area-context as
  NativeWind's guide does; where `css.d.ts` goes; icon page and installation agree on engine floors.
- e2e visits one item page per engine section, not only the native index.
- [ ] e2e first where it changes; write; run docs/registry/search/sitemap/llms specs on chromium;
      commit `docs(registry-ui): settle the native docs minors`.
