# zui native: the ai-provider-picker block - implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `@zeroxsolutions/icons/brand-mark-url` exists and is published; the native registries publish the
`ai-provider-picker` block with a `brand-mark` lib; the native blocks page lists it; `NOT_PORTED` is empty.

**Architecture:** the brand marks stay on the CDN; a native lib draws them through `expo-image` from the package's
manifest and URL builder, reached through a new top-level module of the icons package. The block composes the native
`AiProviderCard` parts over that lib.

**Tech Stack:** React Native, NativeWind and Uniwind, `expo-image`, `lucide-react-native`, jest with RNTL `userEvent`,
Playwright for the native zone.

**Spec:** `docs/superpowers/specs/2026-11-12-native-ai-provider-picker-design.md`, under the first spec and waves 2-4's
test rules.

## Global Constraints

- Pull request A from master (`feat/icons-brand-mark-url`), pull request B on `feat/native-ai-provider-picker`.
- The npm publish runs only on the person's go-ahead, after A merges; B merges only after the publish.
- Specs: behaviour only, `userEvent`, each case red first, never a class; copied code compared with its source.
- All 16 native registries; no `web:` in a built registry; font weights through `font-sans-medium`.
- `apps/native-preview-uniwind/uniwind-types.d.ts` and `apps/registry-ui/next-env.d.ts` are never committed.

## Review Focus

- A provider key in a different case (`OpenAI`) resolves as the package resolves it; the comparison spec covers
  every key in `aiProviderMappings` and the same keys upper-cased.
- A mark whose every variant fails ends at the letter, not a blank box; the brand-mark spec fails each variant in turn.
- A mark name missing from the manifest (runtime data) draws the letter without a request; the comparison spec
  includes a name the manifest lacks.
- `mono` marks stay visible in dark mode, tinted the foreground colour; the Expo Go list carries it, since jest draws
  no colour.
- The built `brand-mark-url` module pulls no chunk that reads `document`, `window` or `import.meta`.

---

### Task 1 (pull request A): `@zeroxsolutions/icons/brand-mark-url`

**Files:**

- Create: `packages/icons/src/brand-mark-url.ts`, `packages/icons/src/brand-mark-url.spec.ts`
- Modify: `packages/icons/README.md` (one section naming the module and who reads it)

**Interfaces:**

- Produces: `@zeroxsolutions/icons/brand-mark-url` exporting `DEFAULT_BRAND_MARK_BASE`, `BRAND_MARKS`,
  `brandMarkChain(name, variant): BrandMarkVariant[]`, `brandMarkRatio(name, variant): number`,
  `brandMarkUrlFor(name, variant, base?): string`, and the types `BrandMarkName`, `BrandMarkVariant`, all re-exported
  unchanged from `src/lib/brand-mark-url.ts` and `src/lib/brand-manifest.ts`.

- [ ] Spec first, red: the module exports the seven names above, and reading `dist/brand-mark-url.js` with every chunk
      it imports finds no `import.meta`, `document.` or `window.` (follow `packages/fluent-emoji/src/catalog.spec.ts`).
- [ ] Add the module; the build already makes one entry per top-level source file and `exports` maps `./*`.
- [ ] Checks: icons build, test, lint, typecheck, lint-deps; ui typecheck.
- [ ] Commit, push, pull request, CI. After merge: `pnpm nx release version --projects=icons --dry-run`, report the
      version, publish only on the go-ahead (the release subcommands as fluent-emoji 0.1.2 used them).

### Task 2: the native `brand-mark` lib

**Files:**

- Create: `packages/native-ui/src/registry/lib/brand-mark.tsx`, `brand-mark.spec.tsx`
- Modify: `packages/native-ui/registry.json`, `packages/native-ui/package.json` and both preview apps'
  `package.json` (`@zeroxsolutions/icons: workspace:*` in dependencies), `pnpm-lock.yaml`

**Interfaces:**

- Consumes: Task 1's module; `resolveAiProviderMark` from `@zeroxsolutions/icons/ai-provider-mappings`.
- Produces: `BrandMark({ name, variant, size, label, base, shape })` and
  `AiProviderIcon({ provider, type, size, label })`, `size` a number of px, defaults as the web's.

- [ ] Spec first, red, cases from the spec's Tests: first variant's URL drawn; an `expo-image` error moves along the
      chain and past `mono` to the letter; label names it, no label hides it; known key draws its mark, unknown key the
      `Sparkle` placeholder.
- [ ] Comparison spec: for every name in `BRAND_MARKS` plus one it lacks, and every variant, the chain and URL the lib
      uses equal the package's; every key in `aiProviderMappings`, also upper-cased, resolves to the same mark.
- [ ] `mono` and `combine` drawn with `tintColor` in the foreground colour; `avatar` rounded by `shape`.
- [ ] Registry item `brand-mark` (`registry:lib`), dependencies `@zeroxsolutions/icons`, `expo-image`,
      `lucide-react-native`.

### Task 3: the block, its page and the blocks page

**Files:**

- Create: `packages/native-ui/src/registry/blocks/ai-provider-picker.tsx` and its spec (place it where the native
  registry's build reads a `registry:block` from; extend `src/build` if it reads none), demo
  `src/examples/ai-provider-picker-demo.tsx`, docs page for the block.
- Modify: `packages/native-ui/registry.json`, `src/examples/index.ts`, `src/build/web-twins.spec.ts` (`NOT_PORTED`
  empty), `packages/native-ui-docs-web/src/pages/native-blocks-page.tsx` (lists the blocks as the web's
  `blocks-page.tsx` does), the zone e2e lists (`native-docs.spec.ts`, `registry.spec.ts`).

**Interfaces:**

- Consumes: Task 2's `AiProviderIcon`; native `AiProviderCard`, `AiProviderCardDescription`, `AiProviderCardLabel`,
  `AiProviderCardTrigger`, `CardHeader`, `CardTitle`, `CardFooter`.
- Produces: `AiProviderPicker({ entries, onSelect, className })`, `AI_PROVIDER_PICKER_SAMPLE_ENTRIES`, types
  `AiProviderPickerEntry`, `AiProviderPickerProps`.

- [ ] Spec first, red: a card per entry named "Select <name>"; a press calls `onSelect` with that `provider`; footer
      only with `meta`; no `entries` shows the sample; the sample equals the web's (comparison).
- [ ] Wrapping row, one column, two from `sm`, three from `lg`, cards in a row as tall as the tallest.
- [ ] Registry item `ai-provider-picker` (`registry:block`), dependencies `@zeroxsolutions/icons`, `expo-image`.
- [ ] Docs page with demo, install line and the spec's differences; the blocks page lists the block and links it.

### Task 4: browser cases, screenshots, pull request B

- [ ] Native zone e2e: the block's demo draws a mark from the CDN; the blocks page links the block's page; three
      browsers, each case seen red.
- [ ] Screenshots of the block in vega and nova at a phone and a desktop width, opened and looked at.
- [ ] Checks: native-ui test, typecheck, lint, build-registry; native-ui-docs-web typecheck; native-preview export.
- [ ] Push, pull request with the Expo Go list; merge only after Task 1's publish.
