# Verification - add-ai-provider-card

Verification Mode: retained-required. Build/test green alone is insufficient for a UI
component; a real-browser check is recorded below.

## Automated gates (green)

- `nx test @zeroxsolutions/ui` - `ai-provider-card.spec.tsx`: 4/4 passing (card click ->
  `onSelect`; activating the `action` does NOT fire `onSelect`; `status` replaces `meta`
  and carries `text-destructive`; renders with neither `icon` nor `description`).
- `nx typecheck @zeroxsolutions/ui` - pass.
- `nx build @zeroxsolutions/ui` - pass.
- `nx build-storybook @zeroxsolutions/storybook` - pass (the story's `@zeroxsolutions/icons`
  brand-mark, `Switch`, and `AiProviderCard` imports all resolve and bundle).

Note: this repo has no `lint` target (no eslint config); the gates are typecheck + build +
test. `@zeroxsolutions/storybook:typecheck` has PRE-EXISTING failures in unrelated files
(`src/primitives/message-scroller.stories.tsx`, `src/primitives/pagination.stories.tsx`)
that exist independent of this change; `ai-provider-card.stories.tsx` itself is type-clean.

## Real-browser evidence (headless Chrome over CDP, storybook-static)

Driver: navigated the story `iframe.html` directly, waited in real time for render, measured
layout via `getBoundingClientRect`, toggled the `.dark` class, captured screenshots.

Grid story (`components-aiprovidercard--grid`), light:

```
count=3
OpenAI    hasIconSvg=true descH=44 footerTop=316 switchTop=316
Anthropic hasIconSvg=true descH=44 footerTop=316 switchTop=316
Mistral   hasIconSvg=true descH=44 footerTop=316 switchTop=316
bodyBg(light)=oklch(1 0 0)   bodyBg(dark)=oklch(0.145 0 0)
```

- Reserved-height alignment holds and DISCRIMINATES: OpenAI (2 lines), Anthropic (clamped
  from 3), and Mistral (1 line) all report `descH=44`, so `footerTop`/`switchTop` are
  identical (316) across all cards. Without `min-h-11` the 1-line Mistral footer would sit
  ~24px higher; it does not.
- Brand marks render (`hasIconSvg=true` on every card).
- Dark mode: applying `.dark` flips `bodyBg` from white to near-black; screenshot confirms
  dark card surfaces, adapted marks, muted descriptions, aligned footers.

Status story (`components-aiprovidercard--with-status`): both cards `descH=44`,
`footerTop=316`. Screenshot confirms tone colours via tokens - "Runtime not reachable" in
`text-destructive` (red, tone `busy`) and "Key added, not verified" in `text-warning`
(amber, tone `idle`).

Screenshots captured (scratchpad, light + dark): grid, status.

## Cache note

Storybook Vite/rolldown cache did not interfere this run (fresh `build-storybook`). If a
later rebuild does not reflect a change, clear `apps/storybook/node_modules/.cache/storybook`
and rebuild.

## Known, accepted limitations

- Whole-card click is a mouse affordance only (no `role="button"`/keyboard) - deliberate, as
  the card contains an interactive `action`; adding a button role would create nested-
  interactive semantics. Documented in design.md.
- A brand mark that carries its own SVG `<title>` (e.g. the story's `OpenaiMark.Avatar`)
  makes the title element's `textContent` read as "OpenAIOpenAI" (icon title + visible
  name). Cosmetic and consumer-driven (the card renders `{icon}` verbatim); not a card defect.
