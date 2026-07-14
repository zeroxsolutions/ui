## 1. Component

- [x] 1.1 Add `packages/ui/src/components/ai-provider-card.tsx`: `AiProviderCard` composing `Card size="sm"` (`data-slot="ai-provider-card"`, `onClick={onSelect}`, `cursor-pointer`, hover ring) with `CardHeader`/`CardTitle` (icon slot + truncated name), `CardDescription` (`line-clamp-2 min-h-11`), and `CardFooter` (`mt-auto justify-between`).
- [x] 1.2 Footer left: render tone-styled `status.text` when `status` is present, else the muted `meta`; map `StatusTone` -> token class via a small `Record` (reuse `StatusTone` from `status-dot`, no hardcoded colour).
- [x] 1.3 Footer right: render `{action}` inside a span that stops click propagation so it never triggers `onSelect`.
- [x] 1.4 Confirm no `@zeroxsolutions/icons` import and no preset/provider map; `className` on primitives stays layout-only (no `text-base` override, no `border-t-0`/`bg-transparent`).

## 2. Story and spec

- [x] 2.1 Add `apps/storybook/src/ai-provider-card.stories.tsx` with mock data: a default provider, a card with a `status` (each tone), a disabled/no-`onSelect` variant, and a grid of cards with 1-line vs 3-line descriptions to show reserved-height alignment. Pass real brand marks from `@zeroxsolutions/icons` as `icon` and a `Switch` as `action` in the story only.
- [x] 2.2 Add `packages/ui/src/components/ai-provider-card.spec.tsx`: card click invokes `onSelect`; activating the `action` does NOT invoke `onSelect`; `status` replaces `meta` and carries the tone class; renders without `icon`/`description` without crashing.

## 3. Validation

- [x] 3.1 `nx run-many -t lint build test -p @zeroxsolutions/ui @zeroxsolutions/storybook` (or affected) is green.
- [x] 3.2 Real-browser verify: build `storybook-static`, drive the `AiProviderCard` stories headlessly, and confirm reserved-height footer alignment across description lengths and correct tokens in light and `.dark` (clear the Storybook Vite cache first if a rebuild does not reflect).
- [x] 3.3 Audit the staged diff against the `shadcn` skill (UI/component authority - supersedes the removed ui-from-design-system/ui-primitive-fidelity/ui-compound-authoring trio, per commit e4a07dc) plus the live `.agents/rules/*` (naming-files-and-symbols, plain-ascii-typography) before reporting done.
