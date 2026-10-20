# zui native: Nova beside Vega, and the ZUI components on React Native Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/r/styles/{nativewind,uniwind}-{vega,nova}/` all serve the native registry, and the ZUI design
components (Password Input, Password Strength, Code Input, Unsaved Changes Toolbar, Tab Bar) install from it
on both engines in both styles, with the primitives they need (Input Group, Input OTP, Spinner).

**Architecture:** The pipeline is per engine x style already in name; this plan makes the style a loop:
a pinned `style-nova.css` snapshot beside Vega's, `build-registry` emitting four registries, the registry
site copying all four. Components stay written once with slot tokens, so a Nova build is the same source
translated against Nova's slots. The ZUI components compose zui's own native items; what ZUI draws itself
is the same in Nova and Vega (design spec "Nova vs Vega" sections), only the primitives differ.

**Tech Stack:** as plans 2-4; `input-otp-native` or an own OTP on a hidden `TextInput` (Task 2 rules on it).

**Spec:** `docs/superpowers/specs/2026-10-21-zui-native-registry-design.md`; design read-out
`.superpowers/design/zui-components.md`. Plan 6 of the native work.

## Global Constraints

- Everything in plans 2-4's Global Constraints holds; Nova snapshot pinned to the same shadcn commit
  `ba1503c64472b82256d9de95e2e62c5901a38e8b`, file `apps/v4/registry/styles/style-nova.css`.
- Registry paths `/r/styles/<engine>-<style>/` for engine nativewind|uniwind and style vega|nova; consumers set
  `"style": "<engine>-<style>"`.
- The theme per style: Nova and Vega share the neutral colour snapshot; each style's own radius and any
  token the style's CSS defines differently come from that style's upstream files.
- ZUI component names, parts and props as the web items (plan 5) and the design spec name them, adapted to
  React Native where the web relies on the DOM (links become `Pressable` with `onPress` and
  `accessibilityRole="link"`/`"tab"` as fits; `aria-live` becomes `accessibilityLiveRegion="polite"` on
  Android and `AccessibilityInfo.announceForAccessibility` on iOS).

## Review Focus

1. A Nova slot Vega lacks (or the reverse) used by a component: the Nova build fails naming it, never ships
   an empty class (Task 1).
2. Code Input: typing and paste fill the slots; one focusable input; the OS one-time-code autofill works
   (`textContentType="oneTimeCode"`, `autoComplete="sms-otp"`) (Task 2, Task 4).
3. Password Input: the visibility toggle keeps focus in the field and is named ("Show password"/"Hide
   password", string props) (Task 4).
4. Announcements: Password Strength's strength change and the toolbar's message reach VoiceOver and TalkBack
   (Task 4).
5. Tab Bar: the active item is announced selected; hidden labels still name each item (Task 4).

---

### Task 1: Nova as a second style

Skills: `wiring-a-task-target`, `writing-unit-tests`, `writing-e2e-tests`, `writing-comments`.

- Snapshot `style-nova.css` via `sync-upstream-styles`; `build-registry` loops styles x engines; the theme
  item per style; `apps/registry-ui` `shadcn-build` copies all four; e2e lists items for all four paths;
  docs installation names both styles.
- [ ] Tests first: emit/build specs per style (Nova Button default `h-8`, Vega `h-9`; each registry valid;
      every item present in all four); e2e serves `nativewind-nova` and `uniwind-nova`.
- [ ] Implement; build-registry prints "Registry is valid." four times; commit
      `feat(registry-native): build nova beside vega`.

### Task 2: Spinner, Input Group, Input OTP

Skills: `writing-a-component`, `writing-component-tests`, `declaring-a-dependency`, `adopting-a-library`.

- Spinner (lucide `Loader2` spinning; reduced motion respected), Input Group (`InputGroup`,
  `InputGroupAddon`, `InputGroupInput`, `InputGroupButton`, `InputGroupText` on Vega/Nova's input-group
  slots), Input OTP (`InputOTP`, `InputOTPGroup`, `InputOTPSlot`, `InputOTPSeparator`): rule between a
  maintained RN OTP library and an own hidden-`TextInput` implementation; ledger it.
- [ ] Tests first per component; implement; build valid in four registries; commit
      `feat(registry-native): add spinner, input group and input otp`.

### Task 3: docs pages for Task 1-2

- Native docs: styles section in installation (vega|nova), pages for spinner, input-group, input-otp; e2e.
- [ ] e2e first, write, run docs/registry/search/sitemap specs; commit
      `docs(registry-ui): document nova and the new native primitives`.

### Task 4: the ZUI components on React Native

Skills: as Task 2, plus `writing-a-form`.

- `password-input`, `password-strength` (+ requirement), `code-input`, `unsaved-changes-toolbar`, `tab-bar`
  (+ item parts) in `src/registry/ui/` (or a `components/` category folder if the registry's target layout
  wants it; follow the web item's target path), composed from zui native items, registered, built in four
  registries; docs pages under native/.
- [ ] Tests first per component (Review Focus 2-5); implement; build; docs; commit per component.

### Task 5: install check

As plan 4 Task 8, for `nativewind-nova` and `uniwind-nova` with every item, and for the vega pair with the
new items; tsc, expo export iOS + Android, gates on Nova's sizes (Button `h-8`) and the ZUI components.
