## Why

The composed layer must read as one design system - shadcn/ui philosophy end to end -
not a bag of individually-authored components. Today it mostly does (the audit found
Base UI `render` everywhere, `data-slot` widely used, `cva` for variants), but two
gaps remain:

1. **Editor drift** - 9 files hand-join className with `[...].filter(Boolean).join(' ')`
   instead of `cn()` (the editor already imports `cn` from `@zeroxsolutions/ui/lib/utils`
   elsewhere); 5 chrome menus carry bespoke attributes (`data-bubble-menu`,
   `data-slash-menu`, `data-trigger-menu`, `data-block-menu`, `data-editor-toolbar`)
   instead of `data-slot="<kebab>"`; the floating surface is redeclared and has drifted
   (`FloatingShell` `shadow-md` + `text-popover-foreground` vs `editor-toolbar`
   `shadow-sm`).
2. **The whole composed layer needs a redesign pass** - every authored component across
   `@zeroxsolutions/ui`, `@zeroxsolutions/editor`, `@zeroxsolutions/icons`, and
   `@zeroxsolutions/fluent-emoji` (e.g. `SplitButton`, `MenuButton`, `Permission`,
   `ModelList*`, `ModelInfoCard`, `AiProviderCard`, `AvatarEditor`, `FileTree`,
   `FrontmatterEditor`, `NumberField`, `PasswordInput`, `TagInput`, `FluentEmojiStyleProvider`,
   the icon-system resolvers, ...) must be confirmed against the full shadcn philosophy
   (composition over config, parts-not-props, cva, `data-slot`, Base UI `render`, semantic
   tokens, monochrome, restraint-over-chrome) and - critically - made **composable enough
   to assemble into blocks and pages** (the registry ecosystem goal).

A usage-first audit confirmed the repo is a **UI-only SDK for external apps**: many
components show zero in-repo usage not because they are dead, but because their consumers
are **other apps in the product family**. Nothing is purged for low in-repo usage; every
authored component is redesigned in place.

Two real convention gaps share no spec yet: the monochrome-token + scoped-hue rule, and
the one-icon-source rule. They land together in one new capability.

## What Changes

A cluster-by-cluster redesign of the composed layer to the shadcn philosophy, plus two
new capability specs for the gaps. Each cluster is agreed in a short per-cluster
proposal (exact decisions, any breaking subpath rename) before it is touched.

- **`cn()` everywhere** - replace the 9 editor hand-join holdouts with the existing
  `cn()` import; add an explicit "every authored component composes classes through
  `cn()`" requirement to `ui-composition-defaults`.
- **`data-slot` everywhere** - replace the 5 bespoke chrome attributes with
  `data-slot="<kebab>"`, keeping any *content* variant on a second attribute (the
  `callout` pattern).
- **One shared surface, via the primitive** - `FloatingShell` is a bespoke re-implementation
  of Base UI `Popover.Positioner`, so it folds into the `ui/popover` primitive; the caret
  menus (`editor-toolbar`, `bubble-menu`, `slash-menu`, `trigger-menu`) consume `Popover`
  directly, deleting both the drift and the bespoke surface.
- **Redesign every authored composed component** - walk each composed component and hook
  (`SplitButton`, `MenuButton`, `Permission`, `ModelList*`, `ModelInfoCard`,
  `AiProviderCard`, `AvatarEditor`, `FileTree`, `FrontmatterEditor`, `NumberField`,
  `PasswordInput`, `TagInput`, `CodeBlock`/`Disclosure`, `FluentEmojiStyleProvider`,
  icon-system resolvers, and the rest) against the philosophy and the "composable into
  blocks/pages" goal; refactor where it falls short, never reimplementing a shipped
  primitive.
- **Two convention gaps, one new capability** - the monochrome-token + scoped-hue rule
  and the one-icon-source rule are both unrecorded; capture them together in a new
  `design-system-conventions` capability (monochrome tokens; a non-grayscale hue enters
  only through a scoped `.dark`-aware CSS variable; lucide for UI glyphs, the icon system
  for brand marks; no mixed raw unicode/emoji).

## Success Criteria

- Every composed component composes classes through `cn()` and carries a
  `data-slot="<kebab>"`; no hand-joined className, no bespoke `data-*-menu`.
- The floating surface is declared once and consumed everywhere; no drift.
- Every composed component is verified composable into a block (a consumer can assemble
  it with siblings into a page region without editing the component).
- The monochrome-token rule and the one-icon-source rule are recorded as OpenSpec
  capabilities.
- `nx run-many -t lint build test` green; `editor` unregressed; each redesigned
  component keeps its registry coverage (full docs are `build-registry-foundation`).
- Any subpath rename is flagged breaking and versioned major.

## Non-Goals

- Not a shadcn-2026 upgrade - the repo is already on Base UI `render`, `data-slot`,
  `cva`, `shadcn@4.11.0`.
- Not purging components for low in-repo usage - this is a UI-only SDK whose consumers
  are other apps; low in-repo usage is expected and is NOT a dead-code signal.
- Not the full registry docs / types / blocks - that is `build-registry-foundation`.
- Not redesigning the vendored `components/ui/*` primitives.
- Not the AI model picker - `add-model-picker`.

## Capabilities

### New Capabilities

- `design-system-conventions`: the visual-identity rules - tokens are monochrome
  (grayscale except `--destructive`); a non-grayscale hue enters only through a scoped
  `.dark`-aware CSS variable on a wrapper, never a hardcoded color or a new global color
  token; and one icon source per role - lucide for UI control glyphs, the
  `@zeroxsolutions/icons` system for brand marks, with no mixed raw unicode/emoji where a
  UI glyph belongs.

### Modified Capabilities

- `ui-composition-defaults`: add the explicit `cn()`-everywhere requirement (today only
  implied by the className-discipline requirements).
- `ui-menu-button` / `ui-split-button` / `ui-permission` / `model-list` /
  `model-info-card` / `ai-provider-card`: amended where the redesign pass changes a
  requirement (e.g. composable-into-block obligation, part naming).

## Impact

- **Packages**: `@zeroxsolutions/editor` (drift: cn, data-slot, surface), `@zeroxsolutions/ui`
  (composed redesign + surface extraction), `@zeroxsolutions/icons` (icon-system convention),
  `@zeroxsolutions/fluent-emoji` (Provider/setters verified against the philosophy).
- **Consumers**: any subpath rename is a breaking major bump, batched per cluster.
- **Specs**: two new capabilities, several modified capabilities.
