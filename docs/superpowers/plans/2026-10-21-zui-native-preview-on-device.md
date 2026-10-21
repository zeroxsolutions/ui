# zui docs: open a native demo on a phone through Expo Go Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every native component page has an "Open on your phone" control with a QR code; scanning it opens
that component's demo, in the style the page shows, inside Expo Go on iOS or Android, drawn by the real
engine on the device.

**Architecture:** `apps/native-preview` (today exported for web per style) is also published with EAS Update,
one branch per style (`vega`, `nova`), on Expo's free plan. Expo Go loads an update from a URL of the form
`exp://u.expo.dev/<project-id>?channel-name=<style>` and opens a path inside it with `--/<path>`, so the
QR encodes the demo's route. The docs page builds that URL from the project id, the style and the demo
name, and draws the QR in the page. A job in the production deploy workflow publishes both updates, so
the phone shows what the deployed docs show.

**Tech Stack:** as plan 8, plus `eas-cli` (devDependency, run through an nx target), `expo-updates`'
runtime-version rules for Expo Go, `expo-linking` for the in-app route, and a QR encoder for the docs
page (`qrcode` or a maintained equivalent, chosen per `adopting-a-library`).

**Spec:** this conversation: the user wants a QR like React Native Reusables' docs, has no budget, and
agreed to Expo's free plan (EAS Update, 1,000 monthly active users).

## Global Constraints

- Free plan only: no EAS Build, no store submission, no paid feature. Expo Go is the client; the app
  keeps to modules Expo Go ships (React Native core, react-native-svg, expo-font, the Geist fonts).
- The app's Expo SDK is the one Expo Go supports today (SDK 58). Its runtime version follows Expo Go's
  rule for its SDK, so an update published for SDK 58 opens in Expo Go 58. When Expo Go moves to the next
  SDK, the app has to move with it; the docs control says which Expo Go it needs.
- One EAS Update branch and channel per style: `vega`, `nova`. The project id lives in the app's config
  and in one constant the docs read; nothing else hardcodes it.
- The QR and its link carry the demo name and nothing else; the device follows its own light/dark scheme.
- The production deploy (`.github/workflows/cd.yml`, run by `git push origin master:production`) publishes
  both updates with the `EXPO_TOKEN` secret. When the secret is missing, the job is skipped with a notice;
  it never fails the deploy of the site.
- Done by the user, outside the repo, before Task 1 runs `eas init`: a free Expo account (organisation
  ZeroXSolutions), a robot or personal access token, stored as the repository secret `EXPO_TOKEN` and
  given to the session once for `eas init` (never committed, never printed).
- Everything in plans 2-8's Global Constraints holds.

## Review Focus

1. The QR on a Nova page opens the Nova demo, and on a Vega page the Vega demo, for the same component
   (Task 2).
2. A link to a demo name the app lacks opens a visible "no such demo" screen, never a blank app (Task 1).
3. The deploy job skips with a notice when `EXPO_TOKEN` is absent and never blocks the site deploy
   (Task 3).
4. The QR control is reachable by keyboard, names what it does, and offers the link as text for someone
   who cannot scan (Task 2).
5. The published runtime version matches what Expo Go 58 accepts; a mismatch is caught before publishing
   (Task 1).

---

### Task 1: the preview app as an EAS Update project

Skills: wiring-a-task-target, declaring-a-dependency, adopting-a-library, configuring-a-worker (secrets
handling applies to the token), writing-a-component, writing-unit-tests.

- `eas init` for `apps/native-preview` with the user's token (the session runs it once; the token stays in
  the environment), committing only the resulting project id and `updates.url` in the app config.
- Runtime version per Expo Go's rule for SDK 58; `expo-updates` added only if Expo Go needs it for the
  update URL (check the docs), nothing that leaves Expo Go's module set.
- In-app routing for native: the demo name from the deep link path (`--/<demo>`), the same demo list as
  the web export, the error boundary per demo, a "no such demo" screen.
- An nx target `publish-update` that runs `eas update --branch <style> --message <commit>` for each style
  with `STYLE` set, non-interactive, reading `EXPO_TOKEN` from the environment.
- [ ] Tests first for the route parsing and the demo lookup; run `publish-update` once by hand for both
      styles; open each in Expo Go on a simulator if one is available (else record as a device check);
      commit.

### Task 2: the "Open on your phone" control

Skills: writing-a-component, writing-component-tests, writing-e2e-tests, writing-prose, cutting-ai-tells,
writing-plain-ascii.

- A control beside the native preview: a button that opens a popover with the QR for
  `exp://u.expo.dev/<project-id>/--/<demo>?channel-name=<style>` (exact shape confirmed in Task 1), the
  link as copyable text, and one line: install Expo Go (SDK 58), scan with the phone's camera (iOS) or from
  Expo Go (Android).
- The URL builder is one function with unit tests (style, demo name, project id); the QR is drawn at
  render from that URL.
- [ ] Tests first (unit for the URL, component test for the popover's name and focus, e2e that a Nova
      page's QR link names the nova channel); implement; gate; commit.

### Task 3: publish on deploy

Skills: writing-a-ci-workflow, wiring-a-task-target.

- A job in `cd.yml` after the site deploy: install, `nx run @zeroxsolutions/native-preview:publish-update`
  with `EXPO_TOKEN` from secrets; skipped with a notice when the secret is empty; its failure reported but
  not undoing the site deploy.
- The native docs installation or index page gains one paragraph on opening demos on a phone.
- [ ] Workflow lint (actionlint if the repo runs it) and a dry run of the job's script locally with the
      token absent; commit.
